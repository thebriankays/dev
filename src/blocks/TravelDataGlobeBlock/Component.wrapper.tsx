'use client'

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  Suspense,
  lazy,
} from 'react'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faExclamationTriangle,
  faPassport,
  faUtensils,
  faPlane,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { BlockWrapper } from '@/blocks/_shared/BlockWrapper'
import VerticalMarquee from '@/components/VerticalMarquee/VerticalMarquee'
import type { Feature, Polygon, MultiPolygon } from 'geojson'

// Import centralized country mappings
import { 
  normalizeCountryName, 
  getCountryNameVariations
} from '@/lib/country-mappings'

import { AdvisoryPanel } from '@/components/TravelDataGlobe/AdvisoryPanel'
import { VisaPanel } from '@/components/TravelDataGlobe/VisaPanel'
import { RestaurantPanel } from '@/components/TravelDataGlobe/RestaurantPanel'
import { AirportPanel } from '@/components/TravelDataGlobe/AirportPanel'

import type {
  PreparedData,
  AdvisoryCountry,
  CountryVisaData,
  MichelinRestaurantData,
  AirportData,
} from './types'
import './styles.scss'

// Lazy import the globe
const TravelDataGlobe = lazy(
  () => import('@/webgl/components/globe/TravelDataGlobe/TravelDataGlobeManual')
)

// ---------- helpers ----------

type WorldFeature = Feature<
  Polygon | MultiPolygon,
  {
    name?: string; NAME?: string
    iso_a2?: string; ISO_A2?: string
    iso2?: string; ISO2?: string
    iso_alpha2?: string; ISO_ALPHA2?: string
    cca2?: string; CCA2?: string
    LABEL_X?: number; LABEL_Y?: number
    label_x?: number; label_y?: number
    LABEL_LONG?: number; LABEL_LAT?: number
    label_long?: number; label_lat?: number
    LON?: number; LAT?: number
    sovereignt?: string; SOVEREIGNT?: string
    geounit?: string; GEOUNIT?: string
    name_en?: string; NAME_EN?: string
    name_long?: string; NAME_LONG?: string
    admin?: string; ADMIN?: string
  }
>

function getCentroidFromFeature(feature: WorldFeature): { lat: number; lng: number } | null {
  try {
    const props = feature?.properties || {}
    const labelLng =
      props.LABEL_X ?? props.label_x ?? props.LABEL_LONG ?? props.label_long ?? props.LON
    const labelLat =
      props.LABEL_Y ?? props.label_y ?? props.LABEL_LAT ?? props.label_lat ?? props.LAT

    if (Number.isFinite(Number(labelLng)) && Number.isFinite(Number(labelLat))) {
      return { lat: Number(labelLat), lng: Number(labelLng) }
    }

    const geom = feature?.geometry
    if (!geom) return null

    const collect = (ring: number[][]) => {
      if (!ring || ring.length === 0) return null
      let sx = 0, sy = 0, n = 0
      for (const coord of ring) {
        if (!coord || coord.length < 2) continue
        const lng = Number(coord[0])
        const lat = Number(coord[1])
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          sx += lng
          sy += lat
          n++
        }
      }
      if (!n) return null
      return { lat: sy / n, lng: sx / n }
    }

    if (geom.type === 'Polygon' && geom.coordinates?.[0]) return collect(geom.coordinates[0] as number[][])
    if (geom.type === 'MultiPolygon' && geom.coordinates?.length) {
      const rings = (geom.coordinates as number[][][][])
        .map((poly) => poly[0])
        .filter((ring) => ring && ring.length > 0)
        .sort((a, b) => b.length - a.length)
      if (rings.length > 0) return collect(rings[0] as number[][])
    }
    return null
  } catch {
    return null
  }
}

interface TravelDataGlobeWrapperProps {
  data: PreparedData
}

export function TravelDataGlobeWrapper({ data }: TravelDataGlobeWrapperProps) {
  const {
    advisories,
    visaCountries,
    airports,
    restaurants,
    polygons: initialPolygons,
    borders: initialBorders,
    statistics,
    blockConfig,
    enabledViews,
  } = data

  const [polygons, setPolygons] = useState(initialPolygons)
  const [borders, setBorders] = useState(initialBorders)
  const [centroids, setCentroids] = useState<Map<string, { lat: number; lng: number }>>(new Map())
  
  // Panel collapse states
  const [isListPanelCollapsed, setIsListPanelCollapsed] = useState(false)

  const advisoryByCode = useMemo(() => {
    const m = new Map<string, AdvisoryCountry>()
    advisories.forEach((a) => a.countryCode && m.set(a.countryCode.toUpperCase(), a))
    return m
  }, [advisories])

  const advisoryByName = useMemo(() => {
    const m = new Map<string, AdvisoryCountry>()
    advisories.forEach((a) => {
      const normalized = normalizeCountryName(a.country)
      m.set(normalized, a)
      getCountryNameVariations(a.country).forEach(variation => m.set(variation, a))
    })
    return m
  }, [advisories])

  const visaByName = useMemo(() => {
    const m = new Map<string, CountryVisaData>()
    visaCountries.forEach((c) => {
      const normalized = normalizeCountryName(c.countryName)
      m.set(normalized, c)
      getCountryNameVariations(c.countryName).forEach(variation => m.set(variation, c))
    })
    return m
  }, [visaCountries])

  const addCentroidKeys = (
    store: Map<string, { lat: number; lng: number }>,
    keys: string[],
    value: { lat: number; lng: number }
  ) => {
    keys
      .map(k => normalizeCountryName(k))
      .filter(Boolean)
      .forEach((k) => store.set(k, value))
  }

  useEffect(() => {
    fetch('/datamaps.world.json')
      .then((res) => res.json())
      .then((geoData: { features: WorldFeature[] }) => {
        const localCentroids = new Map<string, { lat: number; lng: number }>()
        const advisoryPolygons = geoData.features.map((feature) => {
          const props = feature.properties || {}
          const iso2 = String(
            props.iso_a2 ||
              props.ISO_A2 ||
              props.iso2 ||
              props.ISO2 ||
              props.iso_alpha2 ||
              props.ISO_ALPHA2 ||
              props.cca2 ||
              props.CCA2 ||
              ''
          )
            .toUpperCase()
            .trim()

          const rawName = String(
            props.name || props.NAME || props.name_en || props.NAME_EN || props.admin || props.ADMIN || ''
          ).trim()

          const sovereign = String(props.sovereignt || props.SOVEREIGNT || '').trim()
          const nameLong = String(props.name_long || props.NAME_LONG || '').trim()
          const geounit = String(props.geounit || props.GEOUNIT || '').trim()

          const centroid = getCentroidFromFeature(feature)
          if (centroid) {
            const allNames = [rawName, sovereign, nameLong, geounit].filter(Boolean)
            const allKeys = new Set<string>()
            
            allNames.forEach(name => {
              allKeys.add(normalizeCountryName(name))
              getCountryNameVariations(name).forEach(v => allKeys.add(v))
            })
            
            if (iso2) allKeys.add(iso2)
            
            addCentroidKeys(localCentroids, Array.from(allKeys), centroid)

            if (rawName.includes(',')) {
              const parts = rawName.split(',').map((s) => s.trim())
              if (parts.length === 2) {
                const reversed = `${parts[1]} ${parts[0]}`
                addCentroidKeys(localCentroids, [reversed], centroid)
              }
            }
          }

          let joined: AdvisoryCountry | undefined
          if (iso2 && advisoryByCode.has(iso2)) joined = advisoryByCode.get(iso2)
          if (!joined) {
            const normalized = normalizeCountryName(rawName)
            joined = advisoryByName.get(normalized)
            
            if (!joined) {
              const variants = [sovereign, nameLong, geounit]
                .filter(Boolean)
                .map(n => normalizeCountryName(n))
              for (const v of variants) {
                if (advisoryByName.has(v)) {
                  joined = advisoryByName.get(v)
                  break
                }
              }
            }
          }

          return {
            type: 'Feature' as const,
            geometry: feature.geometry,
            properties: { name: rawName, iso_a2: iso2 },
            level: (joined?.level || 1) as 1 | 2 | 3 | 4,
            advisory: joined || null,
          }
        })

        const visaPolygons = geoData.features.map((feature) => {
          const rawName = feature.properties?.name || ''
          const normalized = normalizeCountryName(rawName)
          const hasData = visaCountries.some(
            (v) => normalizeCountryName(v.countryName) === normalized
          )
          return {
            type: 'Feature' as const,
            geometry: feature.geometry,
            properties: {
              name: rawName,
              iso_a2: (feature.properties?.iso_a2 || '').toUpperCase(),
            },
            requirement: (hasData ? 'visa_required' : 'no_admission') as
              | 'visa_required'
              | 'no_admission',
          }
        })

        setCentroids(localCentroids)
        setPolygons({ advisory: advisoryPolygons, visa: visaPolygons })
        setBorders({
          type: 'Feature',
          geometry: { type: 'MultiPolygon', coordinates: [] },
          properties: { iso_a2: 'WORLD', name: 'World Borders' },
        })
      })
      .catch((err) => console.warn('Failed to load GeoJSON data:', err))
  }, [advisories, visaCountries, advisoryByCode, advisoryByName])

  const [currentView, setCurrentView] = useState<
    'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'
  >(blockConfig.initialView as 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports' || 'travelAdvisory')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvisoryKey, setShowAdvisoryKey] = useState(false)

  const [selectedAdvisory, setSelectedAdvisory] = useState<AdvisoryCountry | null>(null)
  const [selectedVisaCountry, setSelectedVisaCountry] = useState<CountryVisaData | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<MichelinRestaurantData | null>(null)
  const [selectedAirport, setSelectedAirport] = useState<AirportData | null>(null)

  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lng: number } | null>(null)
  const [showInternationalOnly, setShowInternationalOnly] = useState(true)

  const filteredAirports = useMemo(() => {
    if (!showInternationalOnly) return airports
    
    return airports.filter(airport => {
      const isInternational = (airport.name || '').toLowerCase().includes('international') ||
                            (airport.name || '').toLowerCase().includes('intl') ||
                            (airport.type || '').toLowerCase() === 'international'
      return isInternational
    })
  }, [airports, showInternationalOnly])

  const currentPolygons = useMemo(
    () => (currentView === 'visaRequirements' ? polygons.visa : polygons.advisory),
    [currentView, polygons]
  )

  const resolveByName = useCallback(
    (name: string, which: 'advisory' | 'visa'): AdvisoryCountry | CountryVisaData | null => {
      const normalized = normalizeCountryName(name)
      
      if (which === 'advisory') {
        if (advisoryByName.has(normalized)) return advisoryByName.get(normalized)!
        
        const variations = getCountryNameVariations(name)
        for (const v of variations) {
          if (advisoryByName.has(v)) return advisoryByName.get(v)!
        }
        
        for (const [k, v] of advisoryByName.entries()) {
          if (k.includes(normalized) || normalized.includes(k)) return v
        }
        return null
      } else {
        if (visaByName.has(normalized)) return visaByName.get(normalized)!
        
        const variations = getCountryNameVariations(name)
        for (const v of variations) {
          if (visaByName.has(v)) return visaByName.get(v)!
        }
        
        for (const [k, v] of visaByName.entries()) {
          if (k.includes(normalized) || normalized.includes(k)) return v
        }
        return null
      }
    },
    [advisoryByName, visaByName]
  )

  const handleTabChange = useCallback(
    (view: 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports') => {
      setCurrentView(view)
      setSearchQuery('')
      setSelectedAdvisory(null)
      setSelectedVisaCountry(null)
      setSelectedRestaurant(null)
      setSelectedAirport(null)
      setFocusTarget(null)
    },
    []
  )

  const handleAdvisoryClick = useCallback(
    (advisory: AdvisoryCountry) => {
      setSelectedAdvisory(advisory)
      setSelectedVisaCountry(null)
      setSelectedRestaurant(null)
      setSelectedAirport(null)
      const normalized = normalizeCountryName(advisory.country)
      const c = centroids.get(normalized)
        || centroids.get(advisory.countryCode?.toUpperCase() || '')
      if (c) setFocusTarget(c)
    },
    [centroids]
  )

  const handleVisaCountryClick = useCallback(
    (country: CountryVisaData) => {
      setSelectedVisaCountry(country)
      setSelectedAdvisory(null)
      setSelectedRestaurant(null)
      setSelectedAirport(null)
      const normalized = normalizeCountryName(country.countryName)
      const c = centroids.get(normalized)
        || centroids.get(country.countryCode?.toUpperCase() || '')
      if (c) setFocusTarget(c)
    },
    [centroids]
  )

  const handleRestaurantClick = useCallback((restaurant: MichelinRestaurantData) => {
    setSelectedRestaurant(restaurant)
    setSelectedAdvisory(null)
    setSelectedVisaCountry(null)
    setSelectedAirport(null)
    setFocusTarget({ lat: restaurant.location.lat, lng: restaurant.location.lng })
  }, [])

  const handleAirportClick = useCallback((airport: AirportData) => {
    setSelectedAirport(airport)
    setSelectedAdvisory(null)
    setSelectedVisaCountry(null)
    setSelectedRestaurant(null)
    setFocusTarget({ lat: airport.location.lat, lng: airport.location.lng })
  }, [])



  // Visa arcs calculation (fixed)
  const visaArcs = useMemo(() => {
    if (!selectedVisaCountry || currentView !== 'visaRequirements') return []
    
    const normalized = normalizeCountryName(selectedVisaCountry.countryName)
    const origin = centroids.get(normalized) ||
      centroids.get(selectedVisaCountry.countryCode?.toUpperCase() || '')
    if (!origin) return []

    const arcs: Array<{
      startLat: number
      startLng: number
      endLat: number
      endLng: number
      color: string
    }> = []

    selectedVisaCountry.visaRequirements.forEach((req) => {
      if (
        req.requirement === 'visa_free' ||
        req.requirement === 'visa_on_arrival' ||
        req.requirement === 'e_visa' ||
        req.requirement === 'eta'
      ) {
        const destNormalized = normalizeCountryName(req.destinationCountry)
        let dest = centroids.get(destNormalized)
        
        if (!dest) {
          const variations = getCountryNameVariations(req.destinationCountry)
          for (const v of variations) {
            dest = centroids.get(v)
            if (dest) break
          }
        }

        if (dest) {
          arcs.push({
            startLat: origin.lat,
            startLng: origin.lng,
            endLat: dest.lat,
            endLng: dest.lng,
            color:
              req.requirement === 'visa_free'
                ? '#4caf50'
                : req.requirement === 'visa_on_arrival'
                ? '#8bc34a'
                : req.requirement === 'e_visa'
                ? '#03a9f4'
                : '#00bcd4',
          })
        }
      }
    })
    return arcs
  }, [selectedVisaCountry, currentView, centroids])

  // Dynamic globe pane class based on panel states
  const globePaneClass = useMemo(() => {
    let className = 'tdg-globe-pane'
    
    if (isListPanelCollapsed) {
      className += ' tdg-globe-pane--list-collapsed'
    }
    
    return className
  }, [isListPanelCollapsed])

  // 3D content
  const webglContent = (
    <>
      <Suspense
        fallback={
          <>
            <ambientLight intensity={0.3} />
            <mesh>
              <sphereGeometry args={[2, 32, 32]} />
              <meshBasicMaterial wireframe />
            </mesh>
          </>
        }
      >
        <TravelDataGlobe
        currentView={currentView}
        polygons={currentPolygons}
        borders={borders}
        airports={filteredAirports}
        restaurants={restaurants}
        globeImageUrl={blockConfig.globeImageUrl || '/earth-blue-marble.jpg'}
        bumpImageUrl={blockConfig.bumpImageUrl || '/earth-topology.png'}
        autoRotateSpeed={blockConfig.autoRotateSpeed || 0.3}
        atmosphereColor={blockConfig.atmosphereColor || '#7ecbf1'}
        atmosphereAltitude={blockConfig.atmosphereAltitude || 0.06}
        onCountryClick={(name: string) => {
          if (currentView === 'travelAdvisory') {
            const adv = resolveByName(name, 'advisory') as AdvisoryCountry | null
            if (adv) handleAdvisoryClick(adv)
          } else if (currentView === 'visaRequirements') {
            const vc = resolveByName(name, 'visa') as CountryVisaData | null
            if (vc) handleVisaCountryClick(vc)
          }
        }}
        onAirportClick={handleAirportClick}
        onRestaurantClick={handleRestaurantClick}
        onCountryHover={(n) => setHoveredCountry(n)}
        selectedCountry={selectedAdvisory?.country || selectedVisaCountry?.countryName || null}
        selectedCountryCode={selectedAdvisory?.countryCode || selectedVisaCountry?.countryCode || null}
        hoveredCountry={hoveredCountry}
        passportCountry={selectedVisaCountry?.countryName || null}
        visaArcs={visaArcs}
        showMarkers={currentView === 'airports' || currentView === 'michelinRestaurants'}
        focusTarget={focusTarget}
        />
      </Suspense>
    </>
  )

  return (
    <BlockWrapper
      className="travel-data-globe-block"
      interactive={true}
      disableDefaultCamera={true}
      fixedWebGL={true}
      webglContent={webglContent}
    >
      <div className="tdg-container">
        <div className="tdg-vertical-marquee">
          <VerticalMarquee text="Sweet Serenity Getaways" animationSpeed={0.5} position="left" />
        </div>

        {/* Tabs */}
        <div className="tdg-tabs-wrapper">
          <div className="tdg-tabs-container">
            {enabledViews.map((view: string) => {
              const typedView = view as
                | 'travelAdvisory'
                | 'visaRequirements'
                | 'michelinRestaurants'
                | 'airports'
              return (
                <button
                  key={view}
                  className={`tdg-tab ${currentView === view ? 'tdg-tab--active' : ''}`}
                  onClick={() => handleTabChange(typedView)}
                  type="button"
                >
                  <FontAwesomeIcon
                    icon={
                      view === 'travelAdvisory'
                        ? faExclamationTriangle
                        : view === 'visaRequirements'
                        ? faPassport
                        : view === 'michelinRestaurants'
                        ? faUtensils
                        : faPlane
                    }
                    className="tdg-tab-icon"
                  />
                  <span className="tdg-tab-label">
                    {view === 'travelAdvisory'
                      ? 'Travel Advisories'
                      : view === 'visaRequirements'
                      ? 'Visa Requirements'
                      : view === 'michelinRestaurants'
                      ? 'Michelin Restaurants'
                      : 'Airports'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Globe pane - dynamically sized */}
        <div className={globePaneClass}>
          <div className="tdg-viewport" />
        </div>

        {/* List panel - left side, collapsible */}
        <aside className={`tdg-list-panel ${isListPanelCollapsed ? 'tdg-list-panel--collapsed' : ''}`}>
          <button
            className="tdg-collapse-toggle"
            onClick={() => setIsListPanelCollapsed(!isListPanelCollapsed)}
            type="button"
          >
            <FontAwesomeIcon icon={isListPanelCollapsed ? faChevronRight : faChevronLeft} />
          </button>
          
          <div className="tdg-info-panel-glass">
            <div className="tdg-panel-heading">
              {currentView === 'travelAdvisory' && (
                <>
                  <Image
                    src="/department-of-state.png"
                    alt="U.S. Department of State"
                    width={40}
                    height={40}
                    style={{ opacity: 0.9, height: 'auto', width: '40px' }}
                  />
                  <span>U.S. Travel Advisories</span>
                </>
              )}
              {currentView === 'visaRequirements' && (
                <>
                  <FontAwesomeIcon icon={faPassport} />
                  <span>Select Passport Country</span>
                </>
              )}
              {currentView === 'michelinRestaurants' && (
                <>
                  <FontAwesomeIcon icon={faUtensils} />
                  <span>Michelin Restaurants</span>
                </>
              )}
              {currentView === 'airports' && (
                <>
                  <FontAwesomeIcon icon={faPlane} />
                  <span>International Airports</span>
                </>
              )}
            </div>

            {currentView === 'travelAdvisory' && (
              <div className="tdg-key-accordion">
                <button
                  className={`tdg-key-toggle ${showAdvisoryKey ? 'tdg-key-toggle--open' : ''}`}
                  onClick={() => setShowAdvisoryKey(!showAdvisoryKey)}
                  type="button"
                >
                  <span>Advisory Level Key</span>
                  <FontAwesomeIcon icon={faChevronDown} className="tdg-key-icon" />
                </button>
                {showAdvisoryKey && (
                  <div className="tdg-key-content tdg-key-content--open">
                    <div className="tdg-key-items">
                      <div className="tdg-key-item">
                        <span className="tdg-key-indicator tdg-level-1"></span>
                        <span>Level 1: Exercise Normal Precautions</span>
                      </div>
                      <div className="tdg-key-item">
                        <span className="tdg-key-indicator tdg-level-2"></span>
                        <span>Level 2: Exercise Increased Caution</span>
                      </div>
                      <div className="tdg-key-item">
                        <span className="tdg-key-indicator tdg-level-3"></span>
                        <span>Level 3: Reconsider Travel</span>
                      </div>
                      <div className="tdg-key-item">
                        <span className="tdg-key-indicator tdg-level-4"></span>
                        <span>Level 4: Do Not Travel</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="tdg-stats-bar">
              {currentView === 'travelAdvisory' && (
                <>
                  <span className="tdg-stat">
                    <strong>{statistics.totalAdvisories}</strong> Countries
                  </span>
                  <span className="tdg-stat tdg-stat-danger">
                    <strong>{statistics.level4Count}</strong> Do Not Travel
                  </span>
                  {!!statistics.newAdvisoriesCount && (
                    <span className="tdg-stat tdg-stat-new">
                      <strong>{statistics.newAdvisoriesCount}</strong> New
                    </span>
                  )}
                </>
              )}
              {currentView === 'visaRequirements' && (
                <>
                  <span className="tdg-stat">
                    <strong>{statistics.totalVisaCountries}</strong> Countries
                  </span>
                  <span className="tdg-stat">
                    <strong>{statistics.passportCountriesCount}</strong> Passports
                  </span>
                </>
              )}
              {currentView === 'michelinRestaurants' && (
                <>
                  <span className="tdg-stat">
                    <strong>{statistics.totalRestaurants}</strong> Restaurants
                  </span>
                  <span className="tdg-stat">
                    <strong>{statistics.greenStarCount}</strong> Green Stars
                  </span>
                </>
              )}
              {currentView === 'airports' && (
                <span className="tdg-stat">
                  <strong>{statistics.totalAirports}</strong> Airports
                </span>
              )}
            </div>

            <div className="tdg-list-container">
              {currentView === 'travelAdvisory' && (
                <AdvisoryPanel
                  advisories={advisories}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedCountry={selectedAdvisory?.country || null}
                  onCountryClick={handleAdvisoryClick}
                />
              )}
              {currentView === 'visaRequirements' && (
                <VisaPanel
                  countries={visaCountries}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedCountry={selectedVisaCountry?.countryName || null}
                  onCountryClick={handleVisaCountryClick}
                />
              )}
              {currentView === 'michelinRestaurants' && (
                <RestaurantPanel
                  restaurants={restaurants}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedRestaurant={selectedRestaurant}
                  onRestaurantClick={handleRestaurantClick}
                />
              )}
              {currentView === 'airports' && (
                <AirportPanel
                  airports={airports}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedAirport={selectedAirport}
                  onAirportClick={handleAirportClick}
                  showInternationalOnly={showInternationalOnly}
                  onFilterChange={setShowInternationalOnly}
                />
              )}
            </div>
          </div>
        </aside>


      </div>
    </BlockWrapper>
  )
}
