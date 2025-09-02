'use client'

import React from 'react'
import Image from 'next/image'
import type { AdvisoryCountry } from '@/blocks/TravelDataGlobeBlock/types'

interface AdvisoryPanelProps {
  advisories: AdvisoryCountry[]
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCountry: string | null
  onCountryClick: (advisory: AdvisoryCountry) => void
}

export function AdvisoryPanel({
  advisories,
  searchQuery,
  onSearchChange,
  selectedCountry,
  onCountryClick,
}: AdvisoryPanelProps) {
  const filteredAdvisories = advisories.filter(adv =>
    adv.country.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <input
        type="text"
        placeholder="Search countries…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="tdg-search-input"
      />
      
      <div className="tdg-list-container" data-lenis-prevent>
        {filteredAdvisories.map((advisory, idx) => (
          <div
            key={`advisory-${advisory.country}-${idx}`}
            onClick={() => onCountryClick(advisory)}
            className={`tdg-advisory-item ${selectedCountry === advisory.country ? 'tdg-selected' : ''}`}
          >
            <span className={`tdg-advisory-dot tdg-level-${advisory.level}`} />
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
            </div>
            <span className={`tdg-advisory-level tdg-level-${advisory.level}`}>
              {advisory.levelText || `Level ${advisory.level}`}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
