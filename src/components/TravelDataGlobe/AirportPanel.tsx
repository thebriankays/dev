'use client'

import React from 'react'
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

  return (
    <>
      <div className="tdg-search-wrapper">
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

      <div className="tdg-list-container" data-lenis-prevent>
        {filteredAirports.map((airport) => (
          <div
            key={`${airport.code}-${airport.name}`}
            className={`tdg-airport-item ${
              selectedAirport?.code === airport.code ? 'tdg-selected' : ''
            }`}
            onClick={() => onAirportClick(airport)}
          >
            <div className="tdg-airport-header">
              {/* Country Flag */}
              {airport.location?.countryFlag && (
                <Image
                  src={airport.location.countryFlag}
                  alt=""
                  className="tdg-flag"
                  width={24}
                  height={16}
                  style={{ width: '24px', height: 'auto' }}
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              
              <div className="tdg-airport-name">{airport.name}</div>
              <div className="tdg-airport-code">{airport.code}</div>
            </div>
            
            <div className="tdg-airport-location">
              {airport.location?.city && airport.location?.country && 
                `${airport.location.city}, ${airport.location.country}`
              }
            </div>
          </div>
        ))}
      </div>
    </>
  )
}