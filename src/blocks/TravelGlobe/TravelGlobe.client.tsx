'use client'

import React, { useState, useMemo, useRef } from 'react'
import { useGSAP } from '@/providers/Animation'
import { BlockWrapper } from '../_shared/BlockWrapper'
import { TravelDataGlobe } from '@/webgl/components/globe/TravelDataGlobe'
import { VerticalMarquee } from '@/components/VerticalMarquee/VerticalMarquee'
import gsap from 'gsap'
import './TravelGlobe.scss'

// Tab configuration for different data views
const tabConfig = {
  travelAdvisory: { 
    label: 'Travel Advisories', 
    icon: '⚠️',
    description: 'Government travel warnings and safety information'
  },
  visaRequirements: { 
    label: 'Visa Requirements', 
    icon: '📑',
    description: 'Entry requirements and visa policies worldwide'
  },
  michelinRestaurants: { 
    label: 'Michelin Restaurants', 
    icon: '🍽️',
    description: 'Michelin-starred restaurants around the globe'
  },
  airports: { 
    label: 'Major Airports', 
    icon: '✈️',
    description: 'International airports and flight connections'
  },
}

// Color schemes for different data types
const ADVISORY_COLORS: Record<number, string> = {
  1: '#4caf50', // Level 1 - Normal precautions (green)
  2: '#ffb300', // Level 2 - Exercise caution (amber)
  3: '#ff6f00', // Level 3 - Reconsider travel (orange)
  4: '#d32f2f', // Level 4 - Do not travel (red)
}

const VISA_COLORS: Record<string, string> = {
  visa_free: '#4caf50',        // Green
  visa_on_arrival: '#8bc34a',  // Light green
  e_visa: '#03a9f4',           // Light blue
  eta: '#00bcd4',              // Cyan
  visa_required: '#ff9800',    // Orange
  no_admission: '#f44336',     // Red
}

interface TravelGlobeClientProps {
  // View configuration
  enabledViews?: ('travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports')[]
  initialView?: 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'
  
  // Data sources (would come from Payload collections in production)
  advisories?: any[]
  visaData?: any[]
  restaurants?: any[]
  airports?: any[]
  flightRoutes?: any[]
  countryPolygons?: any[] // GeoJSON features
  
  // Globe settings
  globeSettings?: {
    imageUrl?: string
    bumpUrl?: string
    rotationSpeed?: number
    showClouds?: boolean
    showAtmosphere?: boolean
    atmosphereColor?: string
  }
  
  // Glass effects
  glassEffect?: {
    enabled?: boolean
    variant?: 'card' | 'panel' | 'subtle' | 'frost' | 'liquid'
    intensity?: number
  }
  
  // Fluid overlay
  fluidOverlay?: {
    enabled?: boolean
    intensity?: number
  }
}

export function TravelGlobeClient({
  enabledViews = ['travelAdvisory', 'visaRequirements', 'michelinRestaurants', 'airports'],
  initialView = 'travelAdvisory',
  advisories = [],
  visaData = [],
  restaurants = [],
  airports = [],
  flightRoutes = [],
  countryPolygons = [],
  globeSettings = {},
  glassEffect = { enabled: true, variant: 'panel' },
  fluidOverlay = { enabled: false },
}: TravelGlobeClientProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentView, setCurrentView] = useState(initialView)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [hoveredCountry, setHoveredCountry] = useState<any>(null)
  
  // Filter enabled tabs
  const availableTabs = useMemo(() => {
    return Object.entries(tabConfig)
      .filter(([key]) => enabledViews.includes(key as any))
      .map(([key, config]) => ({ key, ...config }))
  }, [enabledViews])
  
  // Calculate tab indicator position
  const tabIndicatorOffset = useMemo(() => {
    const index = availableTabs.findIndex(tab => tab.key === currentView)
    const tabWidth = 100 / availableTabs.length
    return `${index * tabWidth}%`
  }, [currentView, availableTabs])
  
  // GSAP animations
  useGSAP((context, requestRender) => {
    if (!containerRef.current) return
    
    // Animate in the container
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 50 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1.2,
        ease: 'power3.out',
        delay: 0.3,
        onUpdate: requestRender
      }
    )
    
    // Animate tabs
    gsap.fromTo(
      '.tdg-tab',
      { opacity: 0, y: -20 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.6
      }
    )
  }, [])
  
  // Prepare data based on current view
  const { polygonData, pointData, arcData } = useMemo(() => {
    let polygons: any[] = []
    let points: any[] = []
    let arcs: any[] = []
    
    switch (currentView) {
      case 'travelAdvisory':
        // Color countries by advisory level
        polygons = countryPolygons.map(feature => {
          const advisory = advisories.find(a => a.countryCode === feature.properties?.ISO_A2)
          const level = advisory?.level as (1 | 2 | 3 | 4) | undefined
          return {
            feature,
            color: level ? ADVISORY_COLORS[level] : '#333333',
            altitude: advisory && hoveredCountry?.properties?.ISO_A2 === feature.properties?.ISO_A2 ? 0.02 : 0.01,
            opacity: advisory ? 0.7 : 0.2,
            data: { ...feature.properties, advisory }
          }
        })
        break
        
      case 'visaRequirements':
        // Color countries by visa requirements
        polygons = countryPolygons.map(feature => {
          const visa = visaData.find(v => v.countryCode === feature.properties?.ISO_A2)
          const requirement = visa?.requirement as string | undefined
          return {
            feature,
            color: requirement && requirement in VISA_COLORS ? VISA_COLORS[requirement] : '#333333',
            altitude: visa && hoveredCountry?.properties?.ISO_A2 === feature.properties?.ISO_A2 ? 0.02 : 0.01,
            opacity: visa ? 0.7 : 0.2,
            data: { ...feature.properties, visa }
          }
        })
        break
        
      case 'michelinRestaurants':
        // Show restaurants as points
        points = restaurants.map(restaurant => ({
          lat: restaurant.latitude,
          lng: restaurant.longitude,
          color: restaurant.stars === 3 ? '#ffd700' : // Gold for 3 stars
                 restaurant.stars === 2 ? '#c0c0c0' : // Silver for 2 stars
                 '#cd7f32', // Bronze for 1 star
          size: 0.5 + (restaurant.stars * 0.3),
          altitude: 0.01,
          data: restaurant
        }))
        
        // Subtle country outlines
        polygons = countryPolygons.map(feature => ({
          feature,
          color: '#333333',
          altitude: 0.005,
          opacity: 0.1,
          data: feature.properties
        }))
        break
        
      case 'airports':
        // Show airports as points
        points = airports.map(airport => ({
          lat: airport.latitude,
          lng: airport.longitude,
          color: airport.type === 'international' ? '#00bcd4' : '#81c784',
          size: airport.type === 'international' ? 1.0 : 0.6,
          altitude: 0.01,
          data: airport
        }))
        
        // Show flight routes as arcs
        arcs = flightRoutes.map(route => {
          const fromAirport = airports.find(a => a.code === route.from)
          const toAirport = airports.find(a => a.code === route.to)
          
          if (!fromAirport || !toAirport) return null
          
          return {
            startLat: fromAirport.latitude,
            startLng: fromAirport.longitude,
            endLat: toAirport.latitude,
            endLng: toAirport.longitude,
            color: route.type === 'direct' ? '#ffeb3b' : '#ff9800',
            altitude: 0.1,
            strokeWidth: route.frequency ? Math.min(route.frequency / 10, 3) : 1,
            data: route
          }
        }).filter(Boolean)
        
        // Subtle country outlines
        polygons = countryPolygons.map(feature => ({
          feature,
          color: '#333333',
          altitude: 0.005,
          opacity: 0.1,
          data: feature.properties
        }))
        break
    }
    
    return { 
      polygonData: polygons, 
      pointData: points, 
      arcData: arcs 
    }
  }, [currentView, advisories, visaData, restaurants, airports, flightRoutes, countryPolygons, hoveredCountry])
  
  // Search filter
  const filteredData = useMemo(() => {
    if (!searchQuery) return { polygonData, pointData, arcData }
    
    const query = searchQuery.toLowerCase()
    
    return {
      polygonData: polygonData.filter(p => 
        p.data?.name?.toLowerCase().includes(query) ||
        p.data?.ISO_A2?.toLowerCase().includes(query)
      ),
      pointData: pointData.filter(p => 
        p.data?.name?.toLowerCase().includes(query) ||
        p.data?.city?.toLowerCase().includes(query) ||
        p.data?.country?.toLowerCase().includes(query)
      ),
      arcData: arcData.filter(a => 
        a.data?.from?.toLowerCase().includes(query) ||
        a.data?.to?.toLowerCase().includes(query)
      )
    }
  }, [searchQuery, polygonData, pointData, arcData])
  
  return (
    <div ref={containerRef} className="travel-globe-container">
      {/* Header with tabs */}
      <div className="tdg-header">
        <div className="tdg-tabs">
          {availableTabs.map(tab => (
            <button
              key={tab.key}
              className={`tdg-tab ${currentView === tab.key ? 'active' : ''}`}
              onClick={() => setCurrentView(tab.key as any)}
            >
              <span className="tdg-tab-icon">{tab.icon}</span>
              <span className="tdg-tab-label">{tab.label}</span>
            </button>
          ))}
          <div 
            className="tdg-tab-indicator"
            style={{ 
              transform: `translateX(${tabIndicatorOffset})`,
              width: `${100 / availableTabs.length}%`
            }}
          />
        </div>
        
        {/* Search bar */}
        <div className="tdg-search">
          <input
            type="text"
            placeholder="Search countries, cities, airports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tdg-search-input"
          />
          <button className="tdg-search-button">🔍</button>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="tdg-content">
        {/* Globe viewer */}
        <BlockWrapper
          glassEffect={{ enabled: glassEffect?.enabled ?? false, variant: glassEffect?.variant }}
          fluidOverlay={{ enabled: fluidOverlay?.enabled ?? false, intensity: fluidOverlay?.intensity }}
          className="tdg-globe-wrapper"
          webglContent={
            <TravelDataGlobe
              polygonsData={filteredData.polygonData}
              polygonAltitude={(d: any) => d.altitude || 0.01}
              polygonCapColor={(d: any) => d.color}
              polygonOpacity={0.6}
              onPolygonClick={(polygon: any) => {
                setSelectedItem(polygon.data)
                setShowDetails(true)
              }}
              onPolygonHover={(polygon: any) => {
                setHoveredCountry(polygon?.feature || null)
              }}
              
              pointsData={filteredData.pointData}
              pointAltitude={(d: any) => d.altitude || 0.01}
              pointColor={(d: any) => d.color}
              pointRadius={(d: any) => d.size || 0.5}
              onPointClick={(point: any) => {
                setSelectedItem(point.data)
                setShowDetails(true)
              }}
              
              arcsData={filteredData.arcData}
              arcColor={(d: any) => d.color}
              arcAltitude={(d: any) => d.altitude || 0.15}
              arcStroke={(d: any) => d.strokeWidth || 1}
              
              globeImageUrl={globeSettings.imageUrl || '/earth-blue-marble.jpg'}
              bumpImageUrl={globeSettings.bumpUrl || '/earth-bump.jpg'}
              showAtmosphere={globeSettings.showAtmosphere !== false}
              atmosphereColor="#3a7ca5"
              atmosphereAltitude={0.15}
              
              autoRotateSpeed={globeSettings.rotationSpeed || 0.5}
              enableZoom={true}
              enableRotate={true}
              enablePan={false}
              
              radius={100}
            />
          }
        >
          {/* Globe viewport placeholder */}
          <div className="tdg-globe-viewport" style={{ width: '100%', height: '500px' }} />
        </BlockWrapper>
        
        {/* Side panel with details */}
        <div className={`tdg-sidebar ${showDetails ? 'active' : ''}`}>
          {selectedItem && (
            <div className="tdg-details">
              <button 
                className="tdg-details-close"
                onClick={() => {
                  setShowDetails(false)
                  setSelectedItem(null)
                }}
              >
                ✕
              </button>
              
              <h3 className="tdg-details-title">
                {selectedItem.name || selectedItem.NAME || selectedItem.city || 'Details'}
              </h3>
              
              {currentView === 'travelAdvisory' && selectedItem.advisory && (
                <div className="tdg-advisory-info">
                  <div className={`tdg-advisory-level level-${selectedItem.advisory.level}`}>
                    Level {selectedItem.advisory.level}
                  </div>
                  <p>{selectedItem.advisory.description}</p>
                  <div className="tdg-advisory-updated">
                    Updated: {new Date(selectedItem.advisory.updated).toLocaleDateString()}
                  </div>
                </div>
              )}
              
              {currentView === 'visaRequirements' && selectedItem.visa && (
                <div className="tdg-visa-info">
                  <div className={`tdg-visa-type type-${selectedItem.visa.requirement}`}>
                    {selectedItem.visa.requirement.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <p>{selectedItem.visa.details}</p>
                  {selectedItem.visa.duration && (
                    <div className="tdg-visa-duration">
                      Duration: {selectedItem.visa.duration} days
                    </div>
                  )}
                </div>
              )}
              
              {currentView === 'michelinRestaurants' && selectedItem.stars && (
                <div className="tdg-restaurant-info">
                  <div className="tdg-restaurant-stars">
                    {'⭐'.repeat(selectedItem.stars)}
                  </div>
                  <p className="tdg-restaurant-cuisine">{selectedItem.cuisine}</p>
                  <p className="tdg-restaurant-address">{selectedItem.address}</p>
                  {selectedItem.chef && (
                    <p className="tdg-restaurant-chef">Chef: {selectedItem.chef}</p>
                  )}
                </div>
              )}
              
              {currentView === 'airports' && selectedItem.code && (
                <div className="tdg-airport-info">
                  <div className="tdg-airport-code">{selectedItem.code}</div>
                  <p className="tdg-airport-city">{selectedItem.city}, {selectedItem.country}</p>
                  <p className="tdg-airport-type">
                    {selectedItem.type === 'international' ? 'International Airport' : 'Domestic Airport'}
                  </p>
                  {selectedItem.terminals && (
                    <p className="tdg-airport-terminals">Terminals: {selectedItem.terminals}</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Statistics marquee */}
          {!showDetails && (
            <div className="tdg-stats">
              <VerticalMarquee 
                text={`Countries: ${countryPolygons.length} • Data Points: ${pointData.length} • Connections: ${arcData.length}`}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Footer info */}
      <div className="tdg-footer">
        <p className="tdg-description">
          {tabConfig[currentView as keyof typeof tabConfig].description}
        </p>
      </div>
    </div>
  )
}

export default TravelGlobeClient
