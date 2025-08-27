'use client'

import React, { useRef, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { VerticalMarquee } from '@/components/VerticalMarquee/VerticalMarquee'
import { useGSAP } from '@/providers/Animation'
import gsap from 'gsap'
import './TravelGlobe.scss'

// Dynamically import react-globe.gl (it CANNOT use shared canvas)
const GlobeGL = dynamic(() => import('react-globe.gl'), { 
  ssr: false,
  loading: () => (
    <div className="tdg-loading">
      <div className="tdg-loading-spinner" />
      <p>Loading globe...</p>
    </div>
  )
})

// Tab configuration
const tabConfig = {
  travelAdvisory: { label: 'Travel Advisories', icon: '⚠️' },
  visaRequirements: { label: 'Visa Requirements', icon: '📑' },
  michelinRestaurants: { label: 'Michelin Restaurants', icon: '🍽️' },
  airports: { label: 'Airports', icon: '✈️' },
}

export function TravelGlobeClient(props: any) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  
  const [currentView, setCurrentView] = useState(props.initialView || 'travelAdvisory')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  
  // Calculate tab indicator offset
  const tabIndicatorOffset = useMemo(() => {
    const index = props.enabledViews.indexOf(currentView)
    const tabWidth = 182
    return `${index * tabWidth}px`
  }, [currentView, props.enabledViews])
  
  // GSAP animations
  useGSAP(() => {
    if (!containerRef.current) return
    
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
    )
  }, [])
  
  const handleTabChange = (view: string) => {
    setCurrentView(view)
    setSearchQuery('')
    setShowDetails(false)
  }
  
  return (
    <div className="travel-globe-block travel-globe-standalone">
      <div className="tdg-container" ref={containerRef}>
        {/* Vertical Marquee */}
        <div className="tdg-vertical-marquee">
          <VerticalMarquee
            text="Sweet Serenity Getaways • Travel Tools"
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
              '--tab-indicator-color': props.tabIndicatorColor,
            } as React.CSSProperties}
          >
            {props.enabledViews.map((view: string) => (
              <button
                key={view}
                className={`tdg-tab ${currentView === view ? 'tdg-tab--active' : ''}`}
                onClick={() => handleTabChange(view)}
              >
                <span className="tdg-tab-icon">
                  {tabConfig[view as keyof typeof tabConfig].icon}
                </span>
                <span className="tdg-tab-label">
                  {tabConfig[view as keyof typeof tabConfig].label}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Side Panel */}
        <aside className="tdg-info-panels">
          <div className="tdg-info-panel-glass">
            <div className="tdg-info-panel">
              <h3 className="tdg-panel-heading">
                {currentView === 'travelAdvisory' && '🌍 U.S. Travel Advisories'}
                {currentView === 'visaRequirements' && '📑 Select Passport Country'}
                {currentView === 'michelinRestaurants' && '🍽️ Michelin Star Restaurants'}
                {currentView === 'airports' && '✈️ International Airports'}
              </h3>
              
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tdg-search-input"
              />
              
              <div className="tdg-list-content">
                <p className="tdg-placeholder">
                  Connect to travel data APIs for live data
                </p>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Globe Container - Using react-globe.gl (NOT shared canvas) */}
        <div className="tdg-globe-pane">
          <div className="tdg-globe-wrapper">
            <div className="tdg-globe-standalone-notice">
              <p>⚠️ This globe uses its own canvas (not shared)</p>
            </div>
            <GlobeGL
              ref={globeRef}
              globeImageUrl="/textures/globe/earth-day.jpg"
              bumpImageUrl="/textures/globe/earth-bump.jpg"
              backgroundImageUrl="/textures/globe/night-sky.png"
              showAtmosphere={true}
              atmosphereColor="#3a7bd5"
              atmosphereAltitude={0.15}
              polygonsData={props.advisoryPolygons || []}
              polygonCapColor={() => '#ff0000'}
              polygonSideColor={() => 'rgba(0,0,0,0)'}
              polygonStrokeColor={() => '#111'}
              polygonAltitude={0.01}
              onPolygonClick={(poly: any) => setSelectedCountry(poly.properties?.name)}
              polygonLabel={(poly: any) => `
                <div style="background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 4px;">
                  <b>${poly.properties?.name || 'Unknown'}</b>
                </div>
              `}
            />
          </div>
        </div>
        
        {/* Detail Overlay */}
        {showDetails && (
          <aside className="tdg-detail-overlay">
            <div className="tdg-detail-glass">
              <div className="tdg-detail-header">
                <span className="tdg-detail-title">{selectedCountry}</span>
                <button className="tdg-detail-close" onClick={() => setShowDetails(false)}>
                  ×
                </button>
              </div>
              <div className="tdg-detail-content">
                <p>Travel information will appear here.</p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

export default TravelGlobeClient
