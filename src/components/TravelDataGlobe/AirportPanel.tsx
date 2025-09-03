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

  // Helper to get country flag
  const getCountryFlag = (airport: AirportData) => {
    // Check if there's a flag in the location data
    if (airport.location?.countryFlag) {
      return airport.location.countryFlag
    }
    
    // Otherwise try to generate from country name
    const country = airport.location?.country
    if (!country) return null
    
    // Map common country names to ISO codes for flag URLs
    const countryMap: Record<string, string> = {
      'USA': 'us', 'United States': 'us', 'US': 'us', 'United States of America': 'us',
      'UK': 'gb', 'United Kingdom': 'gb', 'Great Britain': 'gb',
      'France': 'fr', 'Germany': 'de', 'Italy': 'it', 'Spain': 'es',
      'Japan': 'jp', 'China': 'cn', 'Canada': 'ca', 'Mexico': 'mx',
      'Brazil': 'br', 'India': 'in', 'Australia': 'au', 'Netherlands': 'nl',
      'Belgium': 'be', 'Switzerland': 'ch', 'Austria': 'at', 'Sweden': 'se',
      'Norway': 'no', 'Denmark': 'dk', 'Finland': 'fi', 'Poland': 'pl',
      'Portugal': 'pt', 'Greece': 'gr', 'Turkey': 'tr', 'Russia': 'ru',
      'South Korea': 'kr', 'Singapore': 'sg', 'Thailand': 'th', 'Indonesia': 'id',
      'Malaysia': 'my', 'Philippines': 'ph', 'Vietnam': 'vn', 'UAE': 'ae',
      'Saudi Arabia': 'sa', 'Egypt': 'eg', 'South Africa': 'za', 'Nigeria': 'ng',
      'Argentina': 'ar', 'Chile': 'cl', 'Colombia': 'co', 'Peru': 'pe',
    }
    
    const code = countryMap[country] || country.toLowerCase().slice(0, 2)
    return `https://flagcdn.com/24x16/${code}.png`
  }

  return (
    <>
      <input
        type="text"
        placeholder="Search airports…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="tdg-search-input"
      />

      <div className="tdg-list-container" data-lenis-prevent>
        {filteredAirports.map((airport, idx) => {
          const flagUrl = getCountryFlag(airport)
          
          return (
            <div
              key={`airport-${airport.code}-${idx}`}
              className={`tdg-airport-item ${selectedAirport?.code === airport.code ? 'tdg-selected' : ''}`}
              onClick={() => onAirportClick(airport)}
            >
              <div className="tdg-airport-header">
                {flagUrl && (
                  <Image
                    src={flagUrl}
                    alt={`${airport.location?.country || ''} flag`}
                    width={24}
                    height={16}
                    className="tdg-flag"
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                <span className="tdg-airport-name">{airport.name}</span>
                <span className="tdg-airport-code">({airport.code})</span>
              </div>
              <div className="tdg-airport-location">
                {airport.location?.city && airport.location?.country 
                  ? `${airport.location.city}, ${airport.location.country}`
                  : airport.displayLocation || ''
                }
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}