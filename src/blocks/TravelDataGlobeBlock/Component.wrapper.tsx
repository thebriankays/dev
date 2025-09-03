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
} from '@fortawesome/free-solid-svg-icons'
import { BlockWrapper } from '@/blocks/_shared/BlockWrapper'
import VerticalMarquee from '@/components/VerticalMarquee/VerticalMarquee'
import type { Feature, Polygon, MultiPolygon } from 'geojson'
import { AdvisoryPanel } from '@/components/TravelDataGlobe/AdvisoryPanel'
import { AdvisoryDetails } from '@/components/TravelDataGlobe/AdvisoryDetails'
import { VisaPanel } from '@/components/TravelDataGlobe/VisaPanel'
import { VisaDetails } from '@/components/TravelDataGlobe/VisaDetails'
import { RestaurantPanel } from '@/components/TravelDataGlobe/RestaurantPanel'
import { RestaurantDetails } from '@/components/TravelDataGlobe/RestaurantDetails'
import { AirportPanel } from '@/components/TravelDataGlobe/AirportPanel'
import { AirportDetails } from '@/components/TravelDataGlobe/AirportDetails'

import type {
  PreparedData,
  AdvisoryCountry,
  CountryVisaData,
  MichelinRestaurantData,
  AirportData,
} from './types'
import './styles.scss'

// ✅ Lazy import (remove the direct import to avoid duplication)
const TravelDataGlobe = lazy(
  () => import('@/webgl/components/globe/TravelDataGlobe/TravelDataGlobeManual')
)

// Helpers
function normalizeName(s: string) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

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

    if (geom.type === 'Polygon' && geom.coordinates && geom.coordinates[0]) {
      return collect(geom.coordinates[0] as number[][])
    }
    if (geom.type === 'MultiPolygon' && geom.coordinates && geom.coordinates.length > 0) {
      const rings = (geom.coordinates as number[][][][])
        .map((poly) => poly[0])
        .filter((ring) => ring && ring.length > 0)
        .sort((a, b) => b.length - a.length)
      if (rings.length > 0) return collect(rings[0] as number[][])
    }
    return null
  } catch (e) {
    console.warn('Failed to get centroid:', e)
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

  const advisoryByCode = useMemo(() => {
    const m = new Map<string, AdvisoryCountry>()
    advisories.forEach((a) => a.countryCode && m.set(a.countryCode.toUpperCase(), a))
    return m
  }, [advisories])

  const advisoryByName = useMemo(() => {
    const m = new Map<string, AdvisoryCountry>()
    advisories.forEach((a) => m.set(normalizeName(a.country), a))
    return m
  }, [advisories])

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

          let joined: AdvisoryCountry | undefined
          if (iso2 && advisoryByCode.has(iso2)) joined = advisoryByCode.get(iso2)
          if (!joined) {
            const nameVariants = [
              normalizeName(rawName),
              normalizeName(props.sovereignt || props.SOVEREIGNT || ''),
              normalizeName(props.geounit || props.GEOUNIT || ''),
              normalizeName(props.name_long || props.NAME_LONG || ''),
            ].filter((n) => n.length > 0)
            for (const variant of nameVariants) {
              if (advisoryByName.has(variant)) {
                joined = advisoryByName.get(variant)
                break
              }
            }
          }

          if (feature.geometry) {
            const centroid = getCentroidFromFeature(feature)
            if (centroid) {
              localCentroids.set(normalizeName(rawName), centroid)
              if (iso2) localCentroids.set(iso2, centroid)
              if (props.sovereignt) localCentroids.set(normalizeName(props.sovereignt), centroid)
            }
          }

          return {
            type: 'Feature' as const,
            geometry: feature.geometry,
            properties: { name: rawName, iso_a2: iso2 },
            level: (joined?.level || 1) as 1 | 2 | 3 | 4,
          }
        })

        const visaPolygons = geoData.features.map((feature) => {
          const rawName = feature.properties?.name || ''
          const hasData = visaCountries.some(
            (v) => normalizeName(v.countryName) === normalizeName(rawName)
          )
          return {
            type: 'Feature' as const,
            geometry: feature.geometry,
            properties: {
              name: rawName,
              iso_a2: (feature.properties?.iso_a2 || '').toUpperCase(),
            },
            requirement: (hasData ? 'visa_required' : 'no_admission') as 'visa_required' | 'no_admission',
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
  >((blockConfig.initialView || 'travelAdvisory') as
    | 'travelAdvisory'
    | 'visaRequirements'
    | 'michelinRestaurants'
    | 'airports')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvisoryKey, setShowAdvisoryKey] = useState(false)

  const [selectedAdvisory, setSelectedAdvisory] = useState<AdvisoryCountry | null>(null)
  const [selectedVisaCountry, setSelectedVisaCountry] = useState<CountryVisaData | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<MichelinRestaurantData | null>(null)
  const [selectedAirport, setSelectedAirport] = useState<AirportData | null>(null)

  const [_hoveredCountry, _setHoveredCountry] = useState<string | null>(null)
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'CANVAS' || target.closest('.travel-data-globe-block'))) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  const currentPolygons = useMemo(
    () => (currentView === 'visaRequirements' ? polygons.visa : polygons.advisory),
    [currentView, polygons]
  )

  const _visaArcs = useMemo(() => {
    if (!selectedVisaCountry || currentView !== 'visaRequirements') return []
    const origin = centroids.get(normalizeName(selectedVisaCountry.countryName))
    if (!origin) return []
    const arcs: Array<{
      startLat: number; startLng: number; endLat: number; endLng: number; color: string
    }> = []
    selectedVisaCountry.visaRequirements.forEach((req) => {
      if (req.requirement === 'visa_free' || req.requirement === 'visa_on_arrival' || req.requirement === 'e_visa') {
        const dest = centroids.get(normalizeName(req.destinationCountry))
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
                ? '#ffb300'
                : '#03a9f4',
          })
        }
      }
    })
    return arcs
  }, [selectedVisaCountry, currentView, centroids])

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
      const centroid = centroids.get(normalizeName(advisory.country))
      if (centroid) setFocusTarget(centroid)
    },
    [centroids]
  )

  const handleVisaCountryClick = useCallback(
    (country: CountryVisaData) => {
      setSelectedVisaCountry(country)
      const centroid = centroids.get(normalizeName(country.countryName))
      if (centroid) setFocusTarget(centroid)
    },
    [centroids]
  )

  const handleRestaurantClick = useCallback((restaurant: MichelinRestaurantData) => {
    setSelectedRestaurant(restaurant)
    setFocusTarget({ lat: restaurant.location.lat, lng: restaurant.location.lng })
  }, [])

  const handleAirportClick = useCallback((airport: AirportData) => {
    setSelectedAirport(airport)
    setFocusTarget({ lat: airport.location.lat, lng: airport.location.lng })
  }, [])

  const webglContent = (
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
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <TravelDataGlobe
        currentView={currentView}
        polygons={currentPolygons}
        borders={borders}
        airports={airports}
        restaurants={restaurants}
        globeImageUrl={blockConfig.globeImageUrl || '/earth-blue-marble.jpg'}
        bumpImageUrl={blockConfig.bumpImageUrl || '/earth-topology.png'}
        autoRotateSpeed={blockConfig.autoRotateSpeed || 0.3}
        atmosphereColor={blockConfig.atmosphereColor || '#81d6e3'}  // Changed to light cyan for glow effect
        atmosphereAltitude={blockConfig.atmosphereAltitude || 0.35}  // Increased for better visibility
        onCountryClick={(name: string) => {
          if (currentView === 'travelAdvisory') {
            const advisory = advisories.find((a) => a.country === name)
            if (advisory) handleAdvisoryClick(advisory)
          } else if (currentView === 'visaRequirements') {
            const country = visaCountries.find((c) => c.countryName === name)
            if (country) handleVisaCountryClick(country)
          }
        }}
        onAirportClick={handleAirportClick}
        onRestaurantClick={handleRestaurantClick}
        onCountryHover={(_name: string | null) => {}}
        selectedCountry={selectedAdvisory?.country || selectedVisaCountry?.countryName || null}
        selectedCountryCode={selectedAdvisory?.countryCode || selectedVisaCountry?.countryCode || null}
        hoveredCountry={_hoveredCountry}
        passportCountry={selectedVisaCountry?.countryName || null}
        visaArcs={_visaArcs}
        showMarkers={currentView === 'airports' || currentView === 'michelinRestaurants'}
        focusTarget={focusTarget}
      />
    </Suspense>
  )

  return (
    <BlockWrapper
      className="travel-data-globe-block"
      interactive={true}
      disableDefaultCamera={false}
      webglContent={webglContent}
      {...blockConfig}
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

        {/* Panel */}
        <aside className="tdg-info-panels">
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
                  {statistics.newAdvisoriesCount > 0 && (
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
              />
            )}
          </div>
        </aside>

        {selectedAdvisory && (
          <AdvisoryDetails advisory={selectedAdvisory} onClose={() => setSelectedAdvisory(null)} />
        )}
        {selectedVisaCountry && (
          <VisaDetails country={selectedVisaCountry} onClose={() => setSelectedVisaCountry(null)} />
        )}
        {selectedRestaurant && (
          <RestaurantDetails restaurant={selectedRestaurant} onClose={() => setSelectedRestaurant(null)} />
        )}
        {selectedAirport && (
          <AirportDetails airport={selectedAirport} onClose={() => setSelectedAirport(null)} />
        )}
      </div>
    </BlockWrapper>
  )
}
