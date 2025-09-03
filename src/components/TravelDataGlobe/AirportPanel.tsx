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
}

export function AirportPanel({
  airports,
  searchQuery,
  onSearchChange,
  selectedAirport,
  onAirportClick,
}: AirportPanelProps) {
  const filteredAirports = airports.filter(airport =>
    airport && (
      (airport.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (airport.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (airport.location?.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (airport.location?.country || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

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

      <div className="tdg-list-container" data-lenis-prevent>
        {filteredAirports.map((airport) => (
          <div
            key={`${airport.code}-${airport.name}`}
            className={`tdg-list-item ${
              selectedAirport?.code === airport.code ? 'tdg-list-item--selected' : ''
            }`}
            onClick={() => onAirportClick(airport)}
          >
            <div className="tdg-list-item-content">
              {/* Country Flag */}
              {airport.location?.countryFlag && (
                <Image
                  src={airport.location.countryFlag}
                  alt=""
                  className="tdg-country-flag"
                  width={24}
                  height={16}
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              
              {/* Airport Info */}
              <div className="tdg-list-item-details">
                <div className="tdg-list-item-name">
                  <span className="tdg-airport-code">{airport.code}</span>
                  <span className="tdg-airport-name">{airport.name}</span>
                </div>
                <div className="tdg-list-item-location">
                  {airport.location?.city && airport.location?.country && 
                    `${airport.location.city}, ${airport.location.country}`
                  }
                </div>
              </div>

              {/* Airport Type Badge if available */}
              {airport.type && (
                <span className="tdg-airport-type">{airport.type}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
