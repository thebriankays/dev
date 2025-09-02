'use client'

import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPassport } from '@fortawesome/free-solid-svg-icons'
import { createPortal } from 'react-dom'
import { AdvisoryDetails } from './components/AdvisoryDetails'
import type { 
  AdvisoryCountry,
  CountryVisaData,
  AirportData,
  MichelinRestaurantData,
  PolyAdv,
  VisaPolygon,
  VisaData
} from './types'

// Lazy load the WebGL component only when needed
const TravelDataGlobe = lazy(() => import('@/webgl/components/globe/TravelDataGlobe/TravelDataGlobe'))

interface PreparedData {
  advisories: AdvisoryCountry[]
  visaCountries: CountryVisaData[]
  airports: AirportData[]
  restaurants: MichelinRestaurantData[]
  polygons: {
    advisory: PolyAdv[]
    visa: VisaPolygon[]
  }
  borders: any
  enabledViews: string[]
  blockConfig: any
}

interface TravelDataGlobeInteractiveProps {
  data: PreparedData
}

// Simple search component
function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Search countries…" 
}: { 
  value: string
  onChange: (value: string) => void
  placeholder?: string 
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="tdg-search-input"
    />
  )
}

// Loading fallback for WebGL
const GlobeLoading = () => (
  <>
    <ambientLight intensity={0.3} />
    <mesh>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial color="#1a1a1a" wireframe />
    </mesh>
  </>
)

export function TravelDataGlobeInteractive({ data }: TravelDataGlobeInteractiveProps) {
  const { 
    advisories, 
    visaCountries, 
    airports, 
    restaurants, 
    polygons, 
    borders, 
    enabledViews,
    blockConfig 
  } = data

  // Minimal client state - only what's needed for interactivity
  const [currentView, setCurrentView] = useState<string>(
    blockConfig.initialView || 'travelAdvisory'
  )
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [passportCountry, setPassportCountry] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [tabsReady, setTabsReady] = useState(false)
  const [panelReady, setPanelReady] = useState(false)
  const [webglReady, setWebglReady] = useState(false)

  // Initialize tabs and panels after mount
  useEffect(() => {
    // Hydrate the tab skeletons
    const tabs = document.querySelectorAll('.tdg-tab-skeleton')
    tabs.forEach(tab => {
      const view = tab.getAttribute('data-view')
      if (view) {
        tab.classList.remove('tdg-tab-skeleton')
        tab.classList.add('tdg-tab')
        if (view === currentView) {
          tab.classList.add('tdg-tab--active')
        }
        
        // Add click handler
        tab.addEventListener('click', () => handleTabChange(view))
      }
    })
    setTabsReady(true)

    // Panel is ready for content
    setPanelReady(true)

    // Delay WebGL loading slightly to prioritize UI
    const timer = setTimeout(() => setWebglReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Get current polygons based on view
  const currentPolygons = useMemo(() => {
    return currentView === 'visaRequirements' ? polygons.visa : polygons.advisory
  }, [currentView, polygons])

  // Get visa arcs for selected passport country
  const visaArcs: VisaData[] = useMemo(() => {
    if (!passportCountry || currentView !== 'visaRequirements') return []
    
    const country = visaCountries.find(c => c.countryName === passportCountry)
    return country?.visaRequirements || []
  }, [passportCountry, currentView, visaCountries])

  // Filter data based on search - the only client-side computation
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase()
    
    switch (currentView) {
      case 'travelAdvisory':
        return advisories.filter(adv => 
          adv.country.toLowerCase().includes(query)
        )
      case 'visaRequirements':
        return visaCountries.filter(visa => 
          visa.countryName.toLowerCase().includes(query)
        )
      case 'michelinRestaurants':
        return restaurants.filter(rest => 
          rest.name.toLowerCase().includes(query) ||
          rest.location.city.toLowerCase().includes(query) ||
          rest.location.country.toLowerCase().includes(query)
        )
      case 'airports':
        return airports.filter(airport => 
          airport.name.toLowerCase().includes(query) ||
          airport.code.toLowerCase().includes(query) ||
          airport.location.city.toLowerCase().includes(query)
        )
      default:
        return []
    }
  }, [currentView, searchQuery, advisories, visaCountries, restaurants, airports])

  // Handlers
  const handleTabChange = useCallback((view: string) => {
    setCurrentView(view)
    setSearchQuery('')
    setShowDetails(false)
    setSelectedCountry(null)
    setPassportCountry(null)
    
    // Update tab active states
    document.querySelectorAll('.tdg-tab').forEach(tab => {
      const tabView = tab.getAttribute('data-view')
      if (tabView === view) {
        tab.classList.add('tdg-tab--active')
      } else {
        tab.classList.remove('tdg-tab--active')
      }
    })
  }, [])

  const handleCountryClick = useCallback((countryName: string) => {
    if (currentView === 'travelAdvisory') {
      setSelectedCountry(countryName)
      setShowDetails(true)
    } else if (currentView === 'visaRequirements') {
      setPassportCountry(countryName)
    }
  }, [currentView])

  const selectedAdvisory = useMemo(() => {
    if (!selectedCountry) return null
    return advisories.find(adv => adv.country === selectedCountry)
  }, [selectedCountry, advisories])

  // Portal the dynamic panel content
  const panelContent = panelReady ? createPortal(
    <>
      <SearchInput 
        value={searchQuery} 
        onChange={setSearchQuery}
        placeholder={
          currentView === 'visaRequirements' ? "Search passport countries…" :
          currentView === 'airports' ? "Search airports…" :
          currentView === 'michelinRestaurants' ? "Search restaurants…" :
          "Search countries…"
        }
      />
      
      {/* Advisory List */}
      {currentView === 'travelAdvisory' && (
        <div className="tdg-advisory-list" data-lenis-prevent>
          {(filteredData as AdvisoryCountry[]).map((advisory, idx) => (
            <div
              key={`advisory-${advisory.country}-${idx}`}
              onClick={() => {
                setSelectedCountry(advisory.country)
                setShowDetails(true)
              }}
              className={`tdg-advisory-item ${selectedCountry === advisory.country ? 'tdg-selected' : ''}`}
            >
              <span className={`tdg-advisory-dot tdg-level-${advisory.level}`}></span>
              <div className="tdg-advisory-content">
                <div className="tdg-advisory-header">
                  {advisory.countryFlag && (
                    <Image 
                      src={advisory.countryFlag} 
                      alt={`${advisory.country} flag`} 
                      width={24} 
                      height={16} 
                      className="tdg-flag"
                      unoptimized
                    />
                  )}
                  <span className="tdg-advisory-country">{advisory.country}</span>
                  {advisory.isNew && (
                    <span className="tdg-new-pill" title={`Added ${advisory.dateAdded}`}>
                      NEW
                    </span>
                  )}
                </div>
                <span className={`tdg-advisory-level tdg-level-${advisory.level}`}>
                  Level {advisory.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visa List */}
      {currentView === 'visaRequirements' && (
        <div className="tdg-visa-list" data-lenis-prevent>
          <div className="tdg-panel-heading">
            <FontAwesomeIcon icon={faPassport} />
            <span>Select Passport Country</span>
          </div>
          {(filteredData as CountryVisaData[]).map((country, idx) => (
            <div
              key={`visa-${country.countryId}-${idx}`}
              onClick={() => setPassportCountry(country.countryName)}
              className={`tdg-visa-item ${passportCountry === country.countryName ? 'tdg-selected' : ''}`}
            >
              <span className="tdg-visa-country">{country.countryName}</span>
              <span className="tdg-visa-count">
                {country.totalDestinations} destinations
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Airport List */}
      {currentView === 'airports' && (
        <div className="tdg-airport-list" data-lenis-prevent>
          {(filteredData as AirportData[]).map((airport, idx) => (
            <div
              key={`airport-${airport.code}-${idx}`}
              className="tdg-airport-item"
            >
              <div className="tdg-airport-header">
                <span className="tdg-airport-code">{airport.code}</span>
                <span className="tdg-airport-name">{airport.name}</span>
              </div>
              <div className="tdg-airport-location">
                {airport.location.city}, {airport.location.country}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Restaurant List */}
      {currentView === 'michelinRestaurants' && (
        <div className="tdg-restaurant-list" data-lenis-prevent>
          {(filteredData as MichelinRestaurantData[]).map((restaurant, idx) => (
            <div
              key={`restaurant-${restaurant.id}-${idx}`}
              className="tdg-restaurant-item"
            >
              <div className="tdg-restaurant-header">
                <span className="tdg-restaurant-name">{restaurant.name}</span>
                {restaurant.greenStar && (
                  <span className="tdg-green-star" title="Michelin Green Star">🌿</span>
                )}
              </div>
              <div className="tdg-restaurant-details">
                <span className="tdg-restaurant-rating">
                  {'⭐'.repeat(restaurant.rating)}
                </span>
                <span className="tdg-restaurant-cuisine">{restaurant.cuisine}</span>
              </div>
              <div className="tdg-restaurant-location">
                {restaurant.location.city}, {restaurant.location.country}
              </div>
            </div>
          ))}
        </div>
      )}
    </>,
    document.getElementById('tdg-dynamic-panel')!
  ) : null

  // WebGL content - loaded progressively
  const webglContent = webglReady ? (
    <Suspense fallback={<GlobeLoading />}>
      <TravelDataGlobe
        polygons={currentPolygons}
        borders={borders}
        airports={currentView === 'airports' ? airports : []}
        restaurants={currentView === 'michelinRestaurants' ? restaurants : []}
        globeImageUrl="/earth-blue-marble.jpg"
        bumpImageUrl="/earth-topology.jpg"
        autoRotateSpeed={0.5}
        atmosphereColor="#ffffff"
        onCountryClick={handleCountryClick}
        onAirportClick={() => {}}
        onRestaurantClick={() => {}}
        onCountryHover={setHoveredCountry}
        selectedCountry={selectedCountry}
        hoveredCountry={hoveredCountry}
        currentView={currentView as any}
        visaArcs={visaArcs}
        showMarkers={true}
      />
    </Suspense>
  ) : (
    <GlobeLoading />
  )

  // Use the BlockWrapper's webglContent prop through parent
  useEffect(() => {
    const blockWrapper = document.querySelector('.tdg-block')
    if (blockWrapper && webglContent) {
      // The parent BlockWrapper will handle tunneling this to the canvas
      blockWrapper.setAttribute('data-webgl-ready', 'true')
    }
  }, [webglContent])

  return (
    <>
      {/* Dynamic panel content via portal */}
      {panelContent}
      
      {/* WebGL content via BlockWrapper's tunnel */}
      {webglContent}
      
      {/* Detail overlay */}
      {showDetails && selectedAdvisory && (
        <AdvisoryDetails 
          advisory={selectedAdvisory} 
          onClose={() => setShowDetails(false)} 
        />
      )}
    </>
  )
}
