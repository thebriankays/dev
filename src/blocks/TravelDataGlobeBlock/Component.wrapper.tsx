'use client'

import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react'
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
import { AdvisoryDetails } from './components/AdvisoryDetails'
import type { 
  PreparedData,
  AdvisoryCountry,
  CountryVisaData,
  MichelinRestaurantData,
  AirportData,
  VisaData 
} from './types'
import './styles.scss'

// Lazy load the WebGL component
const TravelDataGlobe = lazy(() => import('@/webgl/components/globe/TravelDataGlobe/TravelDataGlobe'))

// Loading fallback
const GlobeLoading = () => (
  <>
    <ambientLight intensity={0.3} />
    <mesh>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial color="#1a1a1a" wireframe />
    </mesh>
  </>
)

interface TravelDataGlobeWrapperProps {
  data: PreparedData
}

export function TravelDataGlobeWrapper({ data }: TravelDataGlobeWrapperProps) {
  const {
    advisories,
    visaCountries,
    airports,
    restaurants,
    polygons,
    borders,
    statistics,
    blockConfig,
    enabledViews,
  } = data

  // Minimal client state
  const [currentView, setCurrentView] = useState<string>(
    blockConfig.initialView || 'travelAdvisory'
  )
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [passportCountry, setPassportCountry] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [showAdvisoryKey, setShowAdvisoryKey] = useState(false)

  // Get current polygons
  const currentPolygons = useMemo(() => {
    return currentView === 'visaRequirements' ? polygons.visa : polygons.advisory
  }, [currentView, polygons])

  // Get visa arcs
  const visaArcs = useMemo(() => {
    if (!passportCountry || currentView !== 'visaRequirements') return []
    const country = visaCountries.find((c: CountryVisaData) => c.countryName === passportCountry)
    return country?.visaRequirements || []
  }, [passportCountry, currentView, visaCountries])

  // Filter data - the only client-side computation
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase()
    
    switch (currentView) {
      case 'travelAdvisory':
        return advisories.filter((adv: AdvisoryCountry) => 
          adv.country.toLowerCase().includes(query)
        )
      case 'visaRequirements':
        return visaCountries.filter((visa: CountryVisaData) => 
          visa.countryName.toLowerCase().includes(query)
        )
      case 'michelinRestaurants':
        return restaurants.filter((rest: MichelinRestaurantData) => 
          rest.name.toLowerCase().includes(query) ||
          (rest.displayLocation || '').toLowerCase().includes(query) ||
          rest.cuisine.toLowerCase().includes(query)
        )
      case 'airports':
        return airports.filter((airport: AirportData) => 
          airport.code.toLowerCase().includes(query) ||
          airport.name.toLowerCase().includes(query) ||
          (airport.displayLocation || '').toLowerCase().includes(query)
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
    return advisories.find((adv: AdvisoryCountry) => adv.country === selectedCountry)
  }, [selectedCountry, advisories])

  // WebGL content for BlockWrapper - memoize to avoid re-renders
  const webglContent = useMemo(() => (
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
        currentView={currentView as 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'}
        visaArcs={visaArcs as VisaData[]}
        showMarkers={true}
      />
    </Suspense>
  ), [currentPolygons, borders, airports, restaurants, currentView, handleCountryClick, selectedCountry, hoveredCountry, visaArcs])

  return (
    <BlockWrapper
      className="tdg-block"
      webglContent={webglContent}
      interactive={true}
      disableDefaultCamera={true}
      {...blockConfig}
    >
      <div className="tdg-container">
        {/* Static UI - Most is server-rendered but we need to make interactive */}
        
        {/* Vertical Marquee */}
        <div className="tdg-vertical-marquee">
          <VerticalMarquee 
            text="Travel Data Globe • 🌍 • Explore the World • 🌎 •" 
            animationSpeed={0.5} 
            position="left" 
          />
        </div>

        {/* Tabs */}
        <div className="tdg-tabs-wrapper">
          <div className="tdg-tabs-container">
            {enabledViews.map((view: string) => (
              <button
                key={view}
                className={`tdg-tab ${currentView === view ? 'tdg-tab--active' : ''}`}
                onClick={() => handleTabChange(view)}
              >
                <FontAwesomeIcon 
                  icon={
                    view === 'travelAdvisory' ? faExclamationTriangle :
                    view === 'visaRequirements' ? faPassport :
                    view === 'michelinRestaurants' ? faUtensils :
                    faPlane
                  } 
                  className="tdg-tab-icon" 
                />
                <span className="tdg-tab-label">
                  {view === 'travelAdvisory' ? 'Travel Advisories' :
                   view === 'visaRequirements' ? 'Visa Requirements' :
                   view === 'michelinRestaurants' ? 'Michelin Restaurants' :
                   'Airports'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Info Panels */}
        <aside className="tdg-info-panels">
          <div className="tdg-info-panel-glass">
            {/* Panel Header - Changes based on view */}
            <div className="tdg-panel-heading">
              {currentView === 'travelAdvisory' && (
                <>
                  <Image 
                    src="/department-of-state.png" 
                    alt="U.S. Department of State" 
                    width={40} 
                    height={40} 
                    style={{ opacity: 0.9 }}
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

            {/* Advisory Key - Only for travel advisory view */}
            {currentView === 'travelAdvisory' && (
              <div className="tdg-key-accordion">
                <button 
                  className={`tdg-key-toggle ${showAdvisoryKey ? 'tdg-key-toggle--open' : ''}`}
                  onClick={() => setShowAdvisoryKey(!showAdvisoryKey)}
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

            {/* Statistics Bar */}
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

            {/* Search */}
            <input
              type="text"
              placeholder={
                currentView === 'visaRequirements' ? "Search passport countries…" :
                currentView === 'airports' ? "Search airports…" :
                currentView === 'michelinRestaurants' ? "Search restaurants…" :
                "Search countries…"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tdg-search-input"
            />

            {/* List Content */}
            <div className="tdg-list-container" data-lenis-prevent>
              {/* Advisory List */}
              {currentView === 'travelAdvisory' && (filteredData as AdvisoryCountry[]).map((advisory, idx) => (
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
                      {advisory.levelText || `Level ${advisory.level}`}
                    </span>
                  </div>
                </div>
              ))}

              {/* Visa List */}
              {currentView === 'visaRequirements' && (filteredData as CountryVisaData[]).map((country, idx) => (
                <div
                  key={`visa-${country.countryId}-${idx}`}
                  onClick={() => setPassportCountry(country.countryName)}
                  className={`tdg-visa-item ${passportCountry === country.countryName ? 'tdg-selected' : ''}`}
                >
                  <div className="tdg-visa-header">
                    {country.countryFlag && (
                      <Image 
                        src={country.countryFlag} 
                        alt={`${country.countryName} flag`} 
                        width={24} 
                        height={16} 
                        className="tdg-flag"
                        unoptimized
                      />
                    )}
                    <span className="tdg-visa-country">{country.countryName}</span>
                  </div>
                  <div className="tdg-visa-stats">
                    <span className="tdg-visa-count">{country.totalDestinations} destinations</span>
                    {country.visaFreeCount && country.visaFreeCount > 0 && (
                      <span className="tdg-visa-free">{country.visaFreeCount} visa-free</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Restaurant List */}
              {currentView === 'michelinRestaurants' && (filteredData as MichelinRestaurantData[]).map((restaurant, idx) => (
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
                    <span className="tdg-restaurant-rating">{restaurant.displayRating || '⭐'.repeat(restaurant.rating)}</span>
                    <span className="tdg-restaurant-cuisine">{restaurant.cuisine}</span>
                  </div>
                  <div className="tdg-restaurant-location">{restaurant.displayLocation}</div>
                </div>
              ))}

              {/* Airport List */}
              {currentView === 'airports' && (filteredData as AirportData[]).map((airport, idx) => (
                <div
                  key={`airport-${airport.code}-${idx}`}
                  className="tdg-airport-item"
                >
                  <div className="tdg-airport-header">
                    <span className="tdg-airport-code">{airport.code}</span>
                    <span className="tdg-airport-name">{airport.name}</span>
                  </div>
                  <div className="tdg-airport-location">{airport.displayLocation}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Globe Pane */}
        <div className={`tdg-globe-pane ${showDetails ? 'tdg-globe-pane--split' : ''}`}>
          <div className="tdg-globe-wrapper">
            {/* Globe renders through BlockWrapper's webglContent */}
          </div>
        </div>

        {/* Detail Overlay */}
        {showDetails && selectedAdvisory && (
          <AdvisoryDetails 
            advisory={selectedAdvisory} 
            onClose={() => setShowDetails(false)} 
          />
        )}
      </div>
    </BlockWrapper>
  )
}
