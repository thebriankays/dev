'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import type { AirportData } from '@/blocks/TravelDataGlobeBlock/types'

interface AirportPanelProps {
  airports: AirportData[]
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedAirport: AirportData | null
  onAirportClick: (airport: AirportData) => void
  showInternationalOnly?: boolean
  onFilterChange?: (value: boolean) => void
}

export function AirportPanel({
  airports,
  searchQuery,
  onSearchChange,
  selectedAirport,
  onAirportClick,
  showInternationalOnly = true,
  onFilterChange,
}: AirportPanelProps) {
  const [expandedAirport, setExpandedAirport] = useState<string | null>(null)
  
  // Filter airports based on international filter and search query
  const filteredAirports = airports.filter(airport => {
    if (!airport) return false
    
    // Check if it's international based on name or type
    const isInternational = (airport.name || '').toLowerCase().includes('international') ||
                          (airport.name || '').toLowerCase().includes('intl') ||
                          (airport.type || '').toLowerCase() === 'international'
    
    // Apply international filter if enabled
    if (showInternationalOnly && !isInternational) {
      return false
    }
    
    // Apply search filter
    return (
      (airport.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (airport.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (airport.location?.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (airport.location?.country || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const handleRowClick = (airport: AirportData) => {
    const airportKey = `${airport.code}-${airport.name}`
    setExpandedAirport(expandedAirport === airportKey ? null : airportKey)
    onAirportClick(airport)
  }

  return (
    <>
      <div className="tdg-search-container">
        <input
          type="text"
          placeholder="Search airports..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="tdg-search-input"
        />
      </div>
      
      {onFilterChange && (
        <div className="tdg-filter-toggle">
          <label className="tdg-checkbox-label">
            <input
              type="checkbox"
              checked={showInternationalOnly}
              onChange={(e) => onFilterChange(e.target.checked)}
              className="tdg-checkbox"
            />
            <span>International Airports Only</span>
          </label>
        </div>
      )}

      <div className="tdg-list-container">
        {filteredAirports.map((airport) => {
          const airportKey = `${airport.code}-${airport.name}`
          const isExpanded = expandedAirport === airportKey
          const isSelected = selectedAirport?.code === airport.code
          
          return (
            <div
              key={airportKey}
              className={`tdg-airport-item ${isSelected ? 'tdg-selected' : ''} ${isExpanded ? 'tdg-expanded' : ''}`}
            >
              <div 
                className="tdg-airport-header"
                onClick={() => handleRowClick(airport)}
              >
                {/* Country Flag */}
                {airport.location?.countryFlag && (
                  <Image
                    src={airport.location.countryFlag}
                    alt=""
                    className="tdg-flag"
                    width={24}
                    height={16}
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                
                <div className="tdg-airport-name">{airport.name}</div>
                
                <div className="tdg-airport-code">{airport.code}</div>
              </div>
              
              {isExpanded && (
                <div className="tdg-advisory-details">
                  <div className="tdg-detail-title">{airport.name}</div>
                  
                  <p className="tdg-detail-description">
                    <strong>IATA/ICAO Code:</strong> {airport.code}
                  </p>
                  
                  <p className="tdg-detail-description">
                    <strong>Location:</strong> {airport.location?.city}, {airport.location?.country}
                  </p>
                  
                  {airport.type && (
                    <p className="tdg-detail-description">
                      <strong>Type:</strong> {airport.type}
                    </p>
                  )}
                  
                  {(airport.location?.lat && airport.location?.lng) && (
                    <div className="tdg-detail-text">
                      <p>
                        <strong>Coordinates:</strong><br/>
                        Latitude: {airport.location.lat.toFixed(6)}<br/>
                        Longitude: {airport.location.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                  
                  {airport.displayLocation && (
                    <p className="tdg-detail-date">
                      {airport.displayLocation}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
