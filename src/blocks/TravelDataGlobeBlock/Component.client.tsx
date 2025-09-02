'use client'

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { BlockWrapper } from '@/blocks/_shared/BlockWrapper'
import { ViewportRenderer } from '@/webgl/components/view'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faExclamationTriangle,
  faPassport,
  faUtensils,
  faPlane,
  faChevronDown,
  faTimes,
  faLeaf,
} from '@fortawesome/free-solid-svg-icons'
import Image from 'next/image'
import VerticalMarquee from '@/components/VerticalMarquee/VerticalMarquee'
import type { 
  TravelDataGlobeBlockProps, 
  AdvisoryCountry,
  CountryVisaData,
  AirportData,
  MichelinRestaurantData,
  PolyAdv,
  VisaPolygon
} from './types'
import type { GlobeMethods } from '@/webgl/components/globe/TravelDataGlobe/TravelDataGlobe'
import './styles.scss'

// Dynamically import TravelDataGlobe since it uses WebGL/Three.js
const TravelDataGlobe = dynamic(
  () => import('@/webgl/components/globe/TravelDataGlobe/TravelDataGlobe'),
  { 
    ssr: false
  }
)

// Helper function to get flag URL from country data
const getFlagUrl = (flagFileName: string | undefined): string | null => {
  if (!flagFileName) return null
  return `/flags/${flagFileName}`
}

export function TravelDataGlobeBlockClient(props: TravelDataGlobeBlockProps) {
  const { blockConfig, polygons, borders, airports, restaurants, travelAdvisories, visaRequirements } = props
  
  // State
  const [currentView, setCurrentView] = useState<'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'>(
    blockConfig.initialView || 'travelAdvisory'
  )
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedAirport, setSelectedAirport] = useState<AirportData | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<MichelinRestaurantData | null>(null)
  const [passportCountry, setPassportCountry] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [showAdvisoryKey, setShowAdvisoryKey] = useState(false)
  const [showVisaKey, setShowVisaKey] = useState(false)
  const [isGlobeLoaded, setIsGlobeLoaded] = useState(false)

  const globeRef = useRef<GlobeMethods | null>(null)

  // Enabled views from config
  const enabledViews = useMemo(() => 
    blockConfig.enabledViews || ['travelAdvisory', 'visaRequirements', 'michelinRestaurants', 'airports'],
    [blockConfig.enabledViews]
  )

  // Get current polygons based on view
  const currentPolygons = useMemo(() => {
    if (!polygons || !Array.isArray(polygons)) return []
    if (currentView === 'visaRequirements') {
      return polygons.filter(p => p && 'requirement' in p) as VisaPolygon[]
    }
    return polygons.filter(p => p && 'level' in p) as PolyAdv[]
  }, [currentView, polygons])

  // Get visa arcs when passport country is selected
  const visaArcs = useMemo(() => {
    if (!passportCountry || currentView !== 'visaRequirements' || !visaRequirements) return []
    
    const selectedCountryData = visaRequirements.find(c => c?.countryName === passportCountry)
    if (!selectedCountryData || !selectedCountryData.visaRequirements) return []

    // Return the visa requirements directly - the globe component will handle positioning
    return selectedCountryData.visaRequirements
      .filter(req => req?.requirement === 'visa_free')
  }, [passportCountry, currentView, visaRequirements])

  // Filter data based on search
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase()
    
    switch (currentView) {
      case 'travelAdvisory':
        return (travelAdvisories || []).filter(adv => 
          adv?.country?.toLowerCase().includes(query)
        )
      case 'visaRequirements':
        return (visaRequirements || []).filter(visa => 
          visa?.countryName?.toLowerCase().includes(query)
        )
      case 'michelinRestaurants':
        return (restaurants || []).filter(rest => 
          rest?.name?.toLowerCase().includes(query) ||
          rest?.location?.city?.toLowerCase().includes(query) ||
          rest?.location?.country?.toLowerCase().includes(query) ||
          rest?.cuisine?.toLowerCase().includes(query)
        )
      case 'airports':
        return (airports || []).filter(airport => 
          airport?.name?.toLowerCase().includes(query) ||
          airport?.code?.toLowerCase().includes(query) ||
          airport?.location?.city?.toLowerCase().includes(query) ||
          airport?.location?.country?.toLowerCase().includes(query)
        )
      default:
        return []
    }
  }, [currentView, searchQuery, travelAdvisories, visaRequirements, restaurants, airports])

  // Handlers
  const handleCountryClick = useCallback((countryName: string) => {
    if (currentView === 'travelAdvisory') {
      setSelectedCountry(countryName)
      setShowDetails(true)
    } else if (currentView === 'visaRequirements' && passportCountry !== countryName) {
      setPassportCountry(countryName)
      setSelectedCountry(null)
    }
  }, [currentView, passportCountry])

  const handleTabChange = useCallback((view: typeof currentView) => {
    setCurrentView(view)
    setSearchQuery('')
    setShowDetails(false)
    setSelectedCountry(null)
    setSelectedAirport(null)
    setSelectedRestaurant(null)
  }, [])

  // Tab config
  const tabConfig = {
    travelAdvisory: {
      label: 'Travel Advisories',
      icon: faExclamationTriangle,
    },
    visaRequirements: {
      label: 'Visa Requirements',
      icon: faPassport,
    },
    michelinRestaurants: {
      label: 'Michelin Restaurants',
      icon: faUtensils,
    },
    airports: {
      label: 'Airports',
      icon: faPlane,
    },
  }

  // Calculate tab indicator offset
  const tabIndicatorOffset = useMemo(() => {
    const index = enabledViews.indexOf(currentView)
    const tabWidth = 182 // Width + gap
    return `${index * tabWidth}px`
  }, [currentView, enabledViews])

  // Get selected advisory data
  const selectedAdvisory = useMemo(() => {
    if (!selectedCountry || currentView !== 'travelAdvisory') return null
    return travelAdvisories.find(adv => adv.country === selectedCountry)
  }, [selectedCountry, currentView, travelAdvisories])

  // Set globe loaded after mount
  useEffect(() => {
    setIsGlobeLoaded(true)
  }, [])

  // WebGL content for the shared canvas
  const webglContent = isGlobeLoaded ? (
    <TravelDataGlobe
      ref={globeRef}
      polygons={currentPolygons}
      borders={borders}
      airports={currentView === 'airports' ? airports : []}
      restaurants={currentView === 'michelinRestaurants' ? restaurants : []}
      globeImageUrl={blockConfig.globeImageUrl || '/earth-blue-marble.jpg'}
      bumpImageUrl={blockConfig.bumpImageUrl || '/earth-topology.png'}
      autoRotateSpeed={blockConfig.autoRotateSpeed || 0.5}
      atmosphereColor={blockConfig.atmosphereColor || '#3a7ca5'}
      atmosphereAltitude={blockConfig.atmosphereAltitude || 0.15}
      onCountryClick={handleCountryClick}
      onAirportClick={(airport) => {
        setSelectedAirport(airport)
        setShowDetails(true)
      }}
      onRestaurantClick={(restaurant) => {
        setSelectedRestaurant(restaurant)
        setShowDetails(true)
      }}
      onCountryHover={setHoveredCountry}
      selectedCountry={selectedCountry}
      hoveredCountry={hoveredCountry}
      currentView={currentView}
      visaArcs={visaArcs}
      showMarkers={showDetails}
    />
  ) : null
  
  return (
    <BlockWrapper
      glassEffect={{
        enabled: blockConfig.enableGlassEffect || true,
        variant: 'frost'
      }}
      className="travel-data-globe-block"
    >
      <div className="tdg-container">
        {/* Vertical Marquee */}
        <div className="tdg-vertical-marquee">
          <VerticalMarquee
            text={blockConfig.marqueeText || "Sweet Serenity Getaways  • 🦋 • Travel Tools • 🦋 •"}
            animationSpeed={0.5}
            position="left"
          />
        </div>

        {/* Glass Tab Bar */}
        <div className="tdg-tabs-wrapper">
          <div
            className="tdg-tabs-container"
            style={{
              '--tab-indicator-offset': tabIndicatorOffset,
              '--tab-indicator-color': blockConfig.tabIndicatorColor || '#81d6e3',
            } as React.CSSProperties}
          >
            {enabledViews.map((view) => (
              <button
                key={view}
                className={`tdg-tab ${currentView === view ? 'tdg-tab--active' : ''}`}
                onClick={() => handleTabChange(view as typeof currentView)}
                aria-label={tabConfig[view as keyof typeof tabConfig].label}
                title={tabConfig[view as keyof typeof tabConfig].label}
              >
                <FontAwesomeIcon icon={tabConfig[view as keyof typeof tabConfig].icon} className="tdg-tab-icon" />
                <span className="tdg-tab-label">{tabConfig[view as keyof typeof tabConfig].label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Side panels */}
        <aside className="tdg-info-panels">
          <div className="tdg-info-panel-glass">
            {/* Travel Advisory Panel */}
            {currentView === 'travelAdvisory' && (
              <div className="tdg-info-panel tdg-advisory-panel">
                <h3 className="tdg-panel-heading">
                  <Image
                    src="/department-of-state.png"
                    alt="U.S. Department of State"
                    width={30}
                    height={30}
                    style={{ opacity: 0.8 }}
                  />
                  U.S. Travel Advisories
                </h3>
                <div className="tdg-key-accordion">
                  <button
                    className={`tdg-key-toggle ${showAdvisoryKey ? 'tdg-key-toggle--open' : ''}`}
                    onClick={() => setShowAdvisoryKey(!showAdvisoryKey)}
                  >
                    <span>Advisory Level Key</span>
                    <FontAwesomeIcon icon={faChevronDown} className="tdg-key-icon" />
                  </button>
                  <div className={`tdg-key-content ${showAdvisoryKey ? 'tdg-key-content--open' : ''}`}>
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
                </div>
                <input
                  type="text"
                  placeholder="Search countries…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="tdg-search-input"
                />
                <ul className="tdg-country-list" data-lenis-prevent>
                  {(filteredData as AdvisoryCountry[]).map((advisory, index) => {
                    const flagUrl = getFlagUrl(advisory.countryFlag)
                    return (
                      <li
                        key={`${advisory.country}-${index}`}
                        onClick={() => handleCountryClick(advisory.country)}
                        className={`tdg-advisory-item ${selectedCountry === advisory.country ? 'tdg-selected' : ''}`}
                      >
                        <span className={`tdg-advisory-dot tdg-level-${advisory.level}`}></span>
                        {flagUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={flagUrl} alt={`${advisory.country} flag`} className="tdg-flag" />
                        ) : (
                          <span className="tdg-flag-placeholder" />
                        )}
                        <span className="tdg-advisory-country">{advisory.country}</span>
                        <span className={`tdg-advisory-level tdg-level-${advisory.level}`}>
                          Level {advisory.level}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Visa Requirements Panel */}
            {currentView === 'visaRequirements' && (
              <div className="tdg-info-panel tdg-visa-panel">
                <h3 className="tdg-panel-heading">
                  <FontAwesomeIcon icon={faPassport} />
                  {passportCountry ? `${passportCountry} Passport` : 'Select Passport Country'}
                </h3>
                <div className="tdg-key-accordion">
                  <button
                    className={`tdg-key-toggle ${showVisaKey ? 'tdg-key-toggle--open' : ''}`}
                    onClick={() => setShowVisaKey(!showVisaKey)}
                  >
                    <span>Visa Requirements Key</span>
                    <FontAwesomeIcon icon={faChevronDown} className="tdg-key-icon" />
                  </button>
                  <div className={`tdg-key-content ${showVisaKey ? 'tdg-key-content--open' : ''}`}>
                    <div className="tdg-key-items">
                      <div className="tdg-key-item">
                        <span className="tdg-key-indicator" style={{ background: '#4caf50' }}></span>
                        <span>Visa Free</span>
                      </div>
                      <div className="tdg-key-item">
                        <span className="tdg-key-indicator" style={{ background: '#8bc34a' }}></span>
                        <span>Visa on Arrival</span>
                      </div>
                      <div className="tdg-key-item">
                        <span className="tdg-key-indicator" style={{ background: '#03a9f4' }}></span>
                        <span>e-Visa</span>
                      </div>
                      <div className="tdg-key-item">
                        <span className="tdg-key-indicator" style={{ background: '#f4511e' }}></span>
                        <span>Visa Required</span>
                      </div>
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Search countries…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="tdg-search-input"
                />
                <ul className="tdg-country-list" data-lenis-prevent>
                  {(filteredData as CountryVisaData[]).map((country, index) => {
                    const flagUrl = getFlagUrl(country.countryFlag)
                    const visaFreeCount = country.visaRequirements.filter(
                      req => req.requirement === 'visa_free'
                    ).length
                    return (
                      <li
                        key={`${country.countryId}-${index}`}
                        onClick={() => setPassportCountry(country.countryName)}
                        className={`tdg-country-item ${passportCountry === country.countryName ? 'tdg-selected' : ''}`}
                      >
                        {flagUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={flagUrl} alt={`${country.countryName} flag`} className="tdg-flag" />
                        ) : (
                          <span className="tdg-flag-placeholder" />
                        )}
                        <span className="tdg-country-name">{country.countryName}</span>
                        <span className="tdg-visa-free-count">{visaFreeCount} visa-free</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Michelin Restaurants Panel */}
            {currentView === 'michelinRestaurants' && (
              <div className="tdg-info-panel tdg-restaurant-panel">
                <h3 className="tdg-panel-heading">
                  <FontAwesomeIcon icon={faUtensils} />
                  Michelin Star Restaurants
                </h3>
                <div className="tdg-key-accordion">
                  <button
                    className={`tdg-key-toggle ${showAdvisoryKey ? 'tdg-key-toggle--open' : ''}`}
                    onClick={() => setShowAdvisoryKey(!showAdvisoryKey)}
                  >
                    <span>Michelin Stars Key</span>
                    <FontAwesomeIcon icon={faChevronDown} className="tdg-key-icon" />
                  </button>
                  <div className={`tdg-key-content ${showAdvisoryKey ? 'tdg-key-content--open' : ''}`}>
                    <div className="tdg-key-items">
                      <div className="tdg-key-item">
                        <span className="tdg-star">⭐</span>
                        <span>1 Star - Very Good</span>
                      </div>
                      <div className="tdg-key-item">
                        <span className="tdg-star">⭐⭐</span>
                        <span>2 Stars - Excellent</span>
                      </div>
                      <div className="tdg-key-item">
                        <span className="tdg-star">⭐⭐⭐</span>
                        <span>3 Stars - Exceptional</span>
                      </div>
                      <div className="tdg-key-item">
                        <FontAwesomeIcon icon={faLeaf} className="tdg-green-star" style={{ color: '#4CAF50' }} />
                        <span>Green Star - Sustainable</span>
                      </div>
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Search restaurants…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="tdg-search-input"
                />
                <div className="tdg-restaurant-list" data-lenis-prevent>
                  {(filteredData as MichelinRestaurantData[]).map((restaurant) => {
                    const flagUrl = getFlagUrl(restaurant.location.countryFlag)
                    return (
                      <div
                        key={restaurant.id}
                        onClick={() => {
                          setSelectedRestaurant(restaurant)
                          setShowDetails(true)
                        }}
                        className={`tdg-restaurant-item ${selectedRestaurant?.id === restaurant.id ? 'tdg-selected' : ''}`}
                      >
                        <div className="tdg-restaurant-header">
                          <div className="tdg-restaurant-details">
                            <span className="tdg-restaurant-name">{restaurant.name}</span>
                            <div className="tdg-restaurant-location">
                              {flagUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={flagUrl} alt={`${restaurant.location.country} flag`} className="tdg-flag" />
                              )}
                              <span className="tdg-cuisine">{restaurant.cuisine}</span>
                              <span>•</span>
                              <span className="tdg-city">{restaurant.location.city}</span>
                            </div>
                          </div>
                          <div className="tdg-restaurant-stars">
                            {Array.from({ length: restaurant.rating }).map((_, i) => (
                              <span key={i} className="tdg-star">⭐</span>
                            ))}
                            {restaurant.greenStar && (
                              <FontAwesomeIcon icon={faLeaf} className="tdg-green-star" style={{ color: '#4CAF50' }} />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Airports Panel */}
            {currentView === 'airports' && (
              <div className="tdg-info-panel tdg-airport-panel">
                <h3 className="tdg-panel-heading">
                  <FontAwesomeIcon icon={faPlane} />
                  Major Airports
                </h3>
                <input
                  type="text"
                  placeholder="Search airports…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="tdg-search-input"
                />
                <div className="tdg-airport-list" data-lenis-prevent>
                  {(filteredData as AirportData[]).map((airport) => {
                    const flagUrl = getFlagUrl(airport.location.countryFlag)
                    return (
                      <div
                        key={airport.code}
                        onClick={() => {
                          setSelectedAirport(airport)
                          setShowDetails(true)
                        }}
                        className={`tdg-airport-item ${selectedAirport?.code === airport.code ? 'tdg-selected' : ''}`}
                      >
                        <div className="tdg-airport-main">
                          <div>
                            <span className="tdg-airport-name">{airport.name}</span>
                            <div className="tdg-airport-details">
                              {flagUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={flagUrl} alt={`${airport.location.country} flag`} className="tdg-flag" />
                              )}
                              <span className="tdg-city">{airport.location.city}, {airport.location.country}</span>
                            </div>
                          </div>
                          <span className="tdg-code">{airport.code}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Globe pane */}
        <div className={`tdg-globe-pane ${showDetails ? 'tdg-globe-pane--split' : ''}`}>
          <div className="tdg-globe-wrapper">
            {!isGlobeLoaded && (
              <div className="tdg-loading">
                <div className="tdg-loading-text">Loading globe...</div>
              </div>
            )}
            {isGlobeLoaded && (
              <ViewportRenderer interactive={true}>
                {webglContent}
              </ViewportRenderer>
            )}
          </div>
        </div>

        {/* Detail overlay */}
        {showDetails && (selectedCountry || selectedAirport || selectedRestaurant) && (
          <div className="tdg-detail-overlay">
            <div className="tdg-detail-glass">
              <div className="tdg-detail-header">
                <div className="tdg-detail-header-left">
                  {/* Travel Advisory Details */}
                  {selectedCountry && selectedAdvisory && (
                    <>
                      <h2 className="tdg-detail-title">{selectedCountry}</h2>
                      <span className={`tdg-detail-level tdg-level-${selectedAdvisory.level}`}>
                        Level {selectedAdvisory.level}
                      </span>
                    </>
                  )}
                  
                  {/* Restaurant Details */}
                  {selectedRestaurant && (
                    <>
                      <h2 className="tdg-detail-title">{selectedRestaurant.name}</h2>
                      <div className="tdg-detail-stars">
                        {Array.from({ length: selectedRestaurant.rating }).map((_, i) => (
                          <span key={i} className="tdg-star">⭐</span>
                        ))}
                        {selectedRestaurant.greenStar && (
                          <FontAwesomeIcon icon={faLeaf} style={{ color: '#4CAF50', marginLeft: '0.5rem' }} />
                        )}
                      </div>
                    </>
                  )}
                  
                  {/* Airport Details */}
                  {selectedAirport && (
                    <>
                      <h2 className="tdg-detail-title">{selectedAirport.name}</h2>
                      <span className="tdg-code">{selectedAirport.code}</span>
                    </>
                  )}
                </div>
                <button
                  className="tdg-detail-close"
                  onClick={() => setShowDetails(false)}
                  aria-label="Close details"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="tdg-detail-content" data-lenis-prevent>
                {/* Travel Advisory Content */}
                {selectedCountry && selectedAdvisory && (
                  <div className="tdg-prose">
                    <h4>Travel Advisory for {selectedCountry}</h4>
                    <p><strong>Current Level:</strong> {selectedAdvisory.level} - {
                      selectedAdvisory.level === 1 ? 'Exercise Normal Precautions' :
                      selectedAdvisory.level === 2 ? 'Exercise Increased Caution' :
                      selectedAdvisory.level === 3 ? 'Reconsider Travel' :
                      'Do Not Travel'
                    }</p>
                    <p><strong>Date Added:</strong> {new Date(selectedAdvisory.dateAdded).toLocaleDateString()}</p>
                    {selectedAdvisory.advisoryText && (
                      <>
                        <h4>Advisory Details</h4>
                        <p>{selectedAdvisory.advisoryText}</p>
                      </>
                    )}
                  </div>
                )}
                
                {/* Restaurant Content */}
                {selectedRestaurant && (
                  <div className="tdg-prose">
                    <h4>{selectedRestaurant.name}</h4>
                    <p><strong>Cuisine:</strong> {selectedRestaurant.cuisine}</p>
                    <p><strong>Location:</strong> {selectedRestaurant.location.city}, {selectedRestaurant.location.country}</p>
                    <p><strong>Rating:</strong> {selectedRestaurant.rating} Michelin Star{selectedRestaurant.rating > 1 ? 's' : ''}</p>
                    {selectedRestaurant.greenStar && (
                      <p className="tdg-green-star-label">🌿 Michelin Green Star for Sustainability</p>
                    )}
                    {selectedRestaurant.description && (
                      <p className="tdg-description">{selectedRestaurant.description}</p>
                    )}
                  </div>
                )}
                
                {/* Airport Content */}
                {selectedAirport && (
                  <div className="tdg-prose">
                    <h4>{selectedAirport.name}</h4>
                    <p><strong>IATA Code:</strong> {selectedAirport.code}</p>
                    <p><strong>Location:</strong> {selectedAirport.location.city}, {selectedAirport.location.country}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </BlockWrapper>
  )
}