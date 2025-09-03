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
  const q = (searchQuery || '').toLowerCase()
  
  const filteredAdvisories = (advisories || []).filter(adv =>
    adv && (adv.country || '').toLowerCase().includes(q)
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
            className={`tdg-country-item ${selectedCountry === advisory.country ? 'tdg-selected' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            {/* Flag */}
            {advisory.countryFlag && (
              <Image 
                src={advisory.countryFlag} 
                alt={`${advisory.country} flag`}
                width={24}
                height={16}
                className="tdg-flag"
                unoptimized
                style={{ flexShrink: 0 }}
              />
            )}
            
            {/* Country name - takes up available space */}
            <span 
              style={{
                flex: '1 1 auto',
                color: '#e2e8f0',
                fontSize: '0.875rem',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0, // Important for text-overflow to work
              }}
            >
              {advisory.country}
            </span>
            
            {/* Level pill - always on the right */}
            <span 
              className={`tdg-advisory-level tdg-level-${advisory.level}`}
              style={{
                flexShrink: 0,
                fontSize: '0.7rem',
                padding: '0.125rem 0.5rem',
                borderRadius: '0.25rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Level {advisory.level}
            </span>
            
            {/* NEW pill if applicable */}
            {advisory.isNew && (
              <span 
                className="tdg-new-pill"
                style={{
                  flexShrink: 0,
                  fontSize: '0.6rem',
                  padding: '2px 6px',
                  marginLeft: '0.25rem',
                }}
              >
                NEW
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  )
}