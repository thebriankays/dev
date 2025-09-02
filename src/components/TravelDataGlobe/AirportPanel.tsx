'use client'

import React from 'react'
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
  const q = (searchQuery || '').toLowerCase()

  const filteredAirports = (airports || []).filter((airport) => {
    if (!airport) return false
    const code = (airport.code || '').toLowerCase()
    const name = (airport.name || '').toLowerCase()
    const loc = (airport.displayLocation || '').toLowerCase()
    return code.includes(q) || name.includes(q) || loc.includes(q)
  })

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
        {filteredAirports.map((airport, idx) => (
          <div
            key={`airport-${airport.code || idx}-${idx}`}
            className={`tdg-airport-item ${selectedAirport?.code === airport.code ? 'tdg-selected' : ''}`}
            onClick={() => onAirportClick(airport)}
          >
            <div className="tdg-airport-header">
              <span className="tdg-airport-code">{airport.code || '—'}</span>
              <span className="tdg-airport-name">{airport.name || 'Unnamed airport'}</span>
            </div>
            <div className="tdg-airport-location">{airport.displayLocation || ''}</div>
          </div>
        ))}
      </div>
    </>
  )
}
