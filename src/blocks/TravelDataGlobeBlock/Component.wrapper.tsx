'use client'

import React, { useState, useMemo, useCallback, lazy, Suspense, useEffect, useRef } from 'react'
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

// Import all the panel and detail components from the proper location
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
  VisaData
} from './types'
import './styles.scss'

const TravelDataGlobe = lazy(() => import('@/webgl/components/globe/TravelDataGlobe/TravelDataGlobe'))

const GlobeLoading = () => (
  <>
    <ambientLight intensity={0.3} />
    <mesh>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial color="#1a1a1a" wireframe />
    </mesh>
  </>
)

function normalizeName(s: string) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Helper function to extract centroid from GeoJSON feature
function getCentroidFromFeature(feature: any): { lat: number; lng: number } | null {
  try {
    const geom = feature?.geometry
    if (!geom) return null

    const collect = (ring: number[][]) => {
      let sx = 0, sy = 0, n = 0
      for (const [lng, lat] of ring) {
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          sx += lng
          sy += lat
          n++
        }
      }
      if (!n) return null
      return { lat: sy / n, lng: sx / n }
    }

    if (geom.type === 'Polygon') {
      return collect(geom.coordinates[0]) // outer ring
    }
    if (geom.type === 'MultiPolygon') {
      // pick the largest outer ring (most points)
      const rings = geom.coordinates.map((poly: number[][][]) => poly[0]).sort((a: any, b: any) => b.length - a.length)
      return collect(rings[0])
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
  
  // Store centroids for country lookup (needed for visa arcs)
  const [centroids, setCentroids] = useState<Map<string, { lat: number; lng: number }>>(new Map())

  // Build quick lookup by code and name for advisories
  const advisoryByCode = useMemo(() => {
    const m = new Map<string, AdvisoryCountry>()
    advisories.forEach(a => a.countryCode && m.set(a.countryCode.toUpperCase(), a))
    return m
  }, [advisories])
  
  const advisoryByName = useMemo(() => {
    const m = new Map<string, AdvisoryCountry>()
    advisories.forEach(a => m.set(normalizeName(a.country), a))
    return m
  }, [advisories])

  // Load GeoJSON and join by ISO_A2 first, then by name
  useEffect(() => {
    fetch('/datamaps.world.json')
      .then(res => res.json())
      .then((geoData) => {
        const localCentroids = new Map<string, { lat: number; lng: number }>()
        
        const advisoryPolygons = geoData.features.map((feature: any) => {
          const iso2 = (feature.properties?.iso_a2 || feature.properties?.ISO_A2 || feature.properties?.ISO2 || '').toUpperCase()
          const rawName = feature.properties?.name || feature.properties?.NAME || feature.properties?.ADMIN || ''
          const joined = (iso2 && advisoryByCode.get(iso2)) || advisoryByName.get(normalizeName(rawName))

          // Calculate centroid for this country
          if (feature.geometry) {
            const centroid = getCentroidFromFeature(feature)
            if (centroid) {
              localCentroids.set(normalizeName(rawName), centroid)
              if (iso2) localCentroids.set(iso2, centroid)
            }
          }

          return {
            type: 'Feature',
            geometry: feature.geometry,
            properties: {
              name: rawName,
              iso_a2: iso2,
            },
            level: joined?.level ?? 1,
          }
        })

        const visaPolygons = geoData.features.map((feature: any) => {
          const rawName = feature.properties?.name || feature.properties?.NAME || feature.properties?.ADMIN || ''
          const hasData = visaCountries.some(v => normalizeName(v.countryName) === normalizeName(rawName))
          return {
            type: 'Feature',
            geometry: feature.geometry,
            properties: {
              name: rawName,
              iso_a2: (feature.properties?.iso_a2 || feature.properties?.ISO_A2 || '').toUpperCase(),
            },
            requirement: hasData ? 'visa_required' : 'no_data',
          }
        })

        const allCoordinates = geoData.features
          .filter((f: any) => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon')
          .map((f: any) => (f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates[0]))

        setCentroids(localCentroids)
        setPolygons({ advisory: advisoryPolygons, visa: visaPolygons })
        setBorders({
          type: 'Feature',
          geometry: { type: 'MultiPolygon', coordinates: allCoordinates },
          properties: { iso_a2: 'WORLD', name: 'World Borders' },
        })
      })
      .catch(err => console.warn('Failed to load GeoJSON data:', err))
  }, [advisories, visaCountries, advisoryByCode, advisoryByName])

  // State management
  const [currentView, setCurrentView] = useState<string>(blockConfig.initialView || 'travelAdvisory')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvisoryKey, setShowAdvisoryKey] = useState(false)
  
  // Selection state
  const [selectedAdvisory, setSelectedAdvisory] = useState<AdvisoryCountry | null>(null)
  const [selectedVisaCountry, setSelectedVisaCountry] = useState<CountryVisaData | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<MichelinRestaurantData | null>(null)
  const [selectedAirport, setSelectedAirport] = useState<AirportData | null>(null)
  
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lng: number } | null>(null)

  // Compute visa arcs based on selected visa country
  const visaArcs = useMemo(() => {
    if (!selectedVisaCountry || currentView !== 'visaRequirements') return []
    
    const origin = centroids.get(normalizeName(selectedVisaCountry.countryName))
    if (!origin) return []
    
    const arcs: any[] = []
    
    // Create arcs to visa-free and visa-on-arrival countries
    if (selectedVisaCountry.visaRequirements) {
      selectedVisaCountry.visaRequirements.forEach((req: VisaData) => {
        // Only show arcs for visa-free or visa-on-arrival
        if (req.requirement === 'visa_free' || req.requirement === 'visa_on_arrival') {
          const dest = centroids.get(normalizeName(req.destinationCountry))
          if (dest) {
            arcs.push({
              startLat: origin.lat,
              startLng: origin.lng,
              endLat: dest.lat,
              endLng: dest.lng,
              color: req.requirement === 'visa_free' ? '#4caf50' : '#ffb300',
              altitude: 0.2,
              dashLength: 0.35,
              dashGap: 0.15,
              dashAnimateTime: 2000
            })
          }
        }
      })
    }
    
    return arcs
  }, [selectedVisaCountry, currentView, centroids])

  // Reset focus when switching views
  useEffect(() => {
    setFocusTarget(null)
  }, [currentView])

  const currentPolygons = useMemo(
    () => (currentView === 'visaRequirements' ? polygons.visa : polygons.advisory),
    [currentView, polygons],
  )

  // Tab change handler
  const handleTabChange = useCallback((view: string) => {
    console.log('Tab changed to:', view) // Debug log
    setCurrentView(view)
    setSearchQuery('')
    setSelectedAdvisory(null)
    setSelectedVisaCountry(null)
    setSelectedRestaurant(null)
    setSelectedAirport(null)
    setFocusTarget(null)
  }, [])

  // Handle country click from globe
  const handleCountryClick = useCallback(
    (countryName: string) => {
      if (currentView === 'travelAdvisory') {
        const advisory = advisories.find(a => normalizeName(a.country) === normalizeName(countryName))
        if (advisory) setSelectedAdvisory(advisory)
      } else if (currentView === 'visaRequirements') {
        const country = visaCountries.find(c => normalizeName(c.countryName) === normalizeName(countryName))
        if (country) setSelectedVisaCountry(country)
      }
    },
    [currentView, advisories, visaCountries],
  )

  // Handle advisory selection
  const handleAdvisoryClick = useCallback((advisory: AdvisoryCountry) => {
    setSelectedAdvisory(advisory)
  }, [])

  // Handle visa country selection
  const handleVisaCountryClick = useCallback((country: CountryVisaData) => {
    setSelectedVisaCountry(country)
  }, [])

  // Handle restaurant selection
  const handleRestaurantClick = useCallback((restaurant: MichelinRestaurantData) => {
    setSelectedRestaurant(restaurant)
    setFocusTarget({ lat: restaurant.location.lat, lng: restaurant.location.lng })
  }, [])

  // Handle airport selection
  const handleAirportClick = useCallback((airport: AirportData) => {
    setSelectedAirport(airport)
    setFocusTarget({ lat: airport.location.lat, lng: airport.location.lng })
  }, [])

  // The WebGL content to render through BlockWrapper
  const webglContent = (
    <Suspense fallback={<GlobeLoading />}>
      <TravelDataGlobe
        polygons={currentPolygons}
        borders={borders}
        airports={currentView === 'airports' ? airports : []}
        restaurants={currentView === 'michelinRestaurants' ? restaurants : []}
        globeImageUrl={blockConfig.globeImageUrl || '/earth-blue-marble.jpg'}
        bumpImageUrl={blockConfig.bumpImageUrl || '/earth-topology.png'}
        autoRotateSpeed={blockConfig.autoRotateSpeed ?? 0.5}
        atmosphereColor={blockConfig.atmosphereColor || '#ffffff'}
        onCountryClick={handleCountryClick}
        onAirportClick={handleAirportClick}
        onRestaurantClick={handleRestaurantClick}
        onCountryHover={setHoveredCountry}
        selectedCountry={selectedAdvisory?.country || selectedVisaCountry?.countryName || null}
        selectedCountryCode={selectedAdvisory?.countryCode || null}
        hoveredCountry={hoveredCountry}
        passportCountry={selectedVisaCountry?.countryName || null}
        currentView={currentView as 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'}
        visaArcs={visaArcs}
        focusTarget={focusTarget}
        showMarkers={true}
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
        {/* Vertical Marquee */}
        <div className="tdg-vertical-marquee">
          <VerticalMarquee text="Sweet Serenity Getaways" animationSpeed={0.5} position="left" />
        </div>

        {/* Tabs */}
        <div className="tdg-tabs-wrapper">
          <div className="tdg-tabs-container">
            {enabledViews.map((view: string) => (
              <button
                key={view}
                className={`tdg-tab ${currentView === view ? 'tdg-tab--active' : ''}`}
                onClick={() => handleTabChange(view)}
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
            ))}
          </div>
        </div>

        {/* Info Panels */}
        <aside className="tdg-info-panels">
          <div className="tdg-info-panel-glass">
            {/* Panel Header */}
            <div className="tdg-panel-heading">
              {currentView === 'travelAdvisory' && (
                <>
                  <Image src="/department-of-state.png" alt="U.S. Department of State" width={40} height={40} style={{ opacity: 0.9, height: 'auto', width: '40px' }} />
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

            {/* Advisory Key */}
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

            {/* Stats Bar */}
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

            {/* Use the proper panel components */}
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

        {/* Use the proper details components */}
        {selectedAdvisory && (
          <AdvisoryDetails 
            advisory={selectedAdvisory} 
            onClose={() => setSelectedAdvisory(null)} 
          />
        )}
        
        {selectedVisaCountry && (
          <VisaDetails 
            country={selectedVisaCountry} 
            onClose={() => setSelectedVisaCountry(null)} 
          />
        )}
        
        {selectedRestaurant && (
          <RestaurantDetails 
            restaurant={selectedRestaurant} 
            onClose={() => setSelectedRestaurant(null)} 
          />
        )}
        
        {selectedAirport && (
          <AirportDetails 
            airport={selectedAirport} 
            onClose={() => setSelectedAirport(null)} 
          />
        )}
      </div>
    </BlockWrapper>
  )
}
