'use client'

import React, { useState, useMemo, useCallback, lazy, Suspense, useEffect } from 'react'
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

interface TravelDataGlobeWrapperProps {
  data: PreparedData
}

function normalizeName(s: string) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
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

  // Load GeoJSON and *join by ISO_A2 first*, then by name
  useEffect(() => {
    fetch('/datamaps.world.json')
      .then(res => res.json())
      .then((geoData) => {
        const advisoryPolygons = geoData.features.map((feature: any) => {
          const iso2 =
            (feature.properties?.iso_a2 || feature.properties?.ISO_A2 || feature.properties?.ISO2 || '').toUpperCase()
          const rawName =
            feature.properties?.name || feature.properties?.NAME || feature.properties?.ADMIN || ''
          const joined =
            (iso2 && advisoryByCode.get(iso2)) ||
            advisoryByName.get(normalizeName(rawName))

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

        // Borders
        const allCoordinates = geoData.features
          .filter((f: any) => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon')
          .map((f: any) => (f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates[0]))

        setPolygons({ advisory: advisoryPolygons, visa: visaPolygons })
        setBorders({
          type: 'Feature',
          geometry: { type: 'MultiPolygon', coordinates: allCoordinates },
          properties: { iso_a2: 'WORLD', name: 'World Borders' },
        })
      })
      .catch(err => console.warn('Failed to load GeoJSON data:', err))
  }, [advisories, visaCountries, advisoryByCode, advisoryByName])

  // ---- UI state ----
  const [currentView, setCurrentView] = useState<string>(blockConfig.initialView || 'travelAdvisory')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null)
  const [passportCountry, setPassportCountry] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [showAdvisoryKey, setShowAdvisoryKey] = useState(false)
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lng: number } | null>(null)

  // Reset camera focus when switching views
  useEffect(() => {
    setFocusTarget(null)
  }, [currentView])

  const currentPolygons = useMemo(
    () => (currentView === 'visaRequirements' ? polygons.visa : polygons.advisory),
    [currentView, polygons],
  )

  const visaArcs = useMemo(() => {
    if (!passportCountry || currentView !== 'visaRequirements') return []
    const country = visaCountries.find(c => c.countryName === passportCountry)
    return country?.visaRequirements || []
  }, [passportCountry, currentView, visaCountries])

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase()
    switch (currentView) {
      case 'travelAdvisory':
        return advisories.filter(adv => adv.country.toLowerCase().includes(q))
      case 'visaRequirements':
        return visaCountries.filter(visa => visa.countryName.toLowerCase().includes(q))
      case 'michelinRestaurants':
        return restaurants.filter(
          rest =>
            rest.name.toLowerCase().includes(q) ||
            (rest.displayLocation || '').toLowerCase().includes(q) ||
            rest.cuisine.toLowerCase().includes(q),
        )
      case 'airports':
        return airports.filter(
          airport =>
            airport.code.toLowerCase().includes(q) ||
            airport.name.toLowerCase().includes(q) ||
            (airport.displayLocation || '').toLowerCase().includes(q),
        )
      default:
        return []
    }
  }, [currentView, searchQuery, advisories, visaCountries, restaurants, airports])

  // Tab change
  const handleTabChange = useCallback((view: string) => {
    setCurrentView(view)
    setSearchQuery('')
    setShowDetails(false)
    setSelectedCountry(null)
    setSelectedCountryCode(null)
    setPassportCountry(null)
    setFocusTarget(null)
  }, [])

  // From GL click (outline)
  const handleCountryClick = useCallback(
    (countryName: string) => {
      if (currentView === 'travelAdvisory') {
        setSelectedCountry(countryName)
        // Try to find ISO from our polygons/advisories
        const poly = currentPolygons.find(p => normalizeName(p.properties?.name) === normalizeName(countryName))
        const codeGuess = (poly?.properties as any)?.iso_a2 || advisoryByName.get(normalizeName(countryName))?.countryCode || null
        setSelectedCountryCode(codeGuess || null)
        setShowDetails(true)
      } else if (currentView === 'visaRequirements') {
        setPassportCountry(countryName)
      }
    },
    [currentView, currentPolygons, advisoryByName],
  )

  // From list click (advisories)
  const handleAdvisoryItemClick = (adv: AdvisoryCountry) => {
    setSelectedCountry(adv.country)
    setSelectedCountryCode(adv.countryCode || null)
    setShowDetails(true)
  }

  const selectedAdvisory = useMemo(
    () => (selectedCountry ? advisories.find(adv => adv.country === selectedCountry) || null : null),
    [selectedCountry, advisories],
  )

  // Focus helpers for lists
  const focusLatLng = (lat: number, lng: number) => {
    setFocusTarget({ lat, lng })
    setShowDetails(false)
    setSelectedCountry(null)
    setSelectedCountryCode(null)
    setPassportCountry(null)
  }

  // WebGL content
  const webglContent = useMemo(
    () => (
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
          onAirportClick={(a) => focusLatLng(a.location.lat, a.location.lng)}
          onRestaurantClick={(r) => focusLatLng(r.location.lat, r.location.lng)}
          onCountryHover={setHoveredCountry}
          selectedCountry={selectedCountry}
          selectedCountryCode={selectedCountryCode}
          hoveredCountry={hoveredCountry}
          passportCountry={passportCountry}
          currentView={currentView as 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'}
          visaArcs={visaArcs as VisaData[]}
          focusTarget={focusTarget}
          showMarkers={true}
        />
      </Suspense>
    ),
    [
      currentPolygons,
      borders,
      airports,
      restaurants,
      currentView,
      handleCountryClick,
      selectedCountry,
      selectedCountryCode,
      hoveredCountry,
      passportCountry,
      visaArcs,
      focusTarget,
      blockConfig.globeImageUrl,
      blockConfig.bumpImageUrl,
      blockConfig.autoRotateSpeed,
      blockConfig.atmosphereColor,
    ],
  )

  return (
    <BlockWrapper
      className="tdg-block"
      webglContent={webglContent}
      interactive={true}
      disableDefaultCamera={false}
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

        {/* Panels */}
        <aside className="tdg-info-panels">
          <div className="tdg-info-panel-glass">
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
                currentView === 'visaRequirements'
                  ? 'Search passport countries…'
                  : currentView === 'airports'
                  ? 'Search airports…'
                  : currentView === 'michelinRestaurants'
                  ? 'Search restaurants…'
                  : 'Search countries…'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tdg-search-input"
            />

            {/* Lists */}
            <div className="tdg-list-container" data-lenis-prevent>
              {currentView === 'travelAdvisory' &&
                (filteredData as AdvisoryCountry[]).map((advisory, idx) => (
                  <div
                    key={`advisory-${advisory.country}-${idx}`}
                    onClick={() => handleAdvisoryItemClick(advisory)}
                    className={`tdg-advisory-item ${selectedCountry === advisory.country ? 'tdg-selected' : ''}`}
                  >
                    <span className={`tdg-advisory-dot tdg-level-${advisory.level}`} />
                    <div className="tdg-advisory-content">
                      <div className="tdg-advisory-header">
                        {advisory.countryFlag && (
                          <Image src={advisory.countryFlag} alt={`${advisory.country} flag`} width={24} height={16} className="tdg-flag" unoptimized />
                        )}
                        <span className="tdg-advisory-country">{advisory.country}</span>
                        {advisory.isNew && (
                          <span className="tdg-new-pill" title={`Added ${advisory.dateAdded}`}>
                            NEW
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`tdg-advisory-level tdg-level-${advisory.level}`}>{advisory.levelText || `Level ${advisory.level}`}</span>
                  </div>
                ))}

              {currentView === 'visaRequirements' &&
                (filteredData as CountryVisaData[]).map((country, idx) => (
                  <div
                    key={`visa-${country.countryId}-${idx}`}
                    onClick={() => setPassportCountry(country.countryName)}
                    className={`tdg-visa-item ${passportCountry === country.countryName ? 'tdg-selected' : ''}`}
                  >
                    <div className="tdg-visa-header">
                      {country.countryFlag && <Image src={country.countryFlag} alt={`${country.countryName} flag`} width={24} height={16} className="tdg-flag" unoptimized />}
                      <span className="tdg-visa-country">{country.countryName}</span>
                    </div>
                    <div className="tdg-visa-stats">
                      <span className="tdg-visa-count">{country.totalDestinations} destinations</span>
                      {country.visaFreeCount && country.visaFreeCount > 0 && <span className="tdg-visa-free">{country.visaFreeCount} visa-free</span>}
                    </div>
                  </div>
                ))}

              {currentView === 'michelinRestaurants' &&
                (filteredData as MichelinRestaurantData[]).map((restaurant, idx) => (
                  <div
                    key={`restaurant-${restaurant.id}-${idx}`}
                    className="tdg-restaurant-item"
                    onClick={() => focusLatLng(restaurant.location.lat, restaurant.location.lng)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="tdg-restaurant-header">
                      <span className="tdg-restaurant-name">{restaurant.name}</span>
                      {restaurant.greenStar && <span className="tdg-green-star" title="Michelin Green Star">🌿</span>}
                    </div>
                    <div className="tdg-restaurant-details">
                      <span className="tdg-restaurant-rating">{restaurant.displayRating || '⭐'.repeat(restaurant.rating)}</span>
                      <span className="tdg-restaurant-cuisine">{restaurant.cuisine}</span>
                    </div>
                    <div className="tdg-restaurant-location">{restaurant.displayLocation}</div>
                  </div>
                ))}

              {currentView === 'airports' &&
                (filteredData as AirportData[]).map((airport, idx) => (
                  <div
                    key={`airport-${airport.code}-${idx}`}
                    className="tdg-airport-item"
                    onClick={() => focusLatLng(airport.location.lat, airport.location.lng)}
                    style={{ cursor: 'pointer' }}
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
          <div className="tdg-globe-wrapper">{/* GL renders through BlockWrapper */}</div>
        </div>

        {showDetails && selectedAdvisory && <AdvisoryDetails advisory={selectedAdvisory} onClose={() => setShowDetails(false)} />}
      </div>
    </BlockWrapper>
  )
}
