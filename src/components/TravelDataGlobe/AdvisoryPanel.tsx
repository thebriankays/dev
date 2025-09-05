'use client'

import React, { useState } from 'react'
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
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  
  const filteredAdvisories = advisories.filter(advisory =>
    advisory.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (advisory.countryCode && advisory.countryCode.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Track duplicates to create unique keys
  const keyTracker = new Map<string, number>()
  const getUniqueKey = (country: string, code?: string) => {
    const baseKey = `${country}-${code || 'XX'}`
    const count = keyTracker.get(baseKey) || 0
    keyTracker.set(baseKey, count + 1)
    return count === 0 ? baseKey : `${baseKey}-${count}`
  }
  
  const handleRowClick = (advisory: AdvisoryCountry) => {
    // Toggle expanded state
    setExpandedCountry(expandedCountry === advisory.country ? null : advisory.country)
    onCountryClick(advisory)
  }

  return (
    <>
      <input
        type="text"
        placeholder="Search countries..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="tdg-search-input"
      />

      <ul className="tdg-list-container">
        {filteredAdvisories.map((advisory) => {
          const uniqueKey = getUniqueKey(advisory.country, advisory.countryCode)
          const isExpanded = expandedCountry === advisory.country
          const isSelected = selectedCountry === advisory.country
          
          return (
            <li
              key={uniqueKey}
              className={`tdg-advisory-item ${isSelected ? 'tdg-selected' : ''} ${isExpanded ? 'tdg-expanded' : ''}`}
            >
              <div 
                className="tdg-advisory-header"
                onClick={() => handleRowClick(advisory)}
              >
                {advisory.countryFlag && (
                  <Image
                    src={advisory.countryFlag}
                    alt={`${advisory.country} flag`}
                    width={24}
                    height={16}
                    className="tdg-flag"
                    style={{ width: '24px', height: '16px', objectFit: 'contain' }}
                    unoptimized
                  />
                )}
                
                <span className="tdg-advisory-country">{advisory.country}</span>
                
                <span className={`tdg-advisory-level tdg-level-${advisory.level}`}>
                  Level {advisory.level}
                </span>
                
                {advisory.isNew && (
                  <span className="tdg-new-pill">NEW</span>
                )}
              </div>
              
              {isExpanded && (
                <div className="tdg-advisory-details">
                  <h4 className="tdg-detail-title">{advisory.levelText}</h4>
                  <p className="tdg-detail-description">{advisory.levelDescription}</p>
                  {advisory.advisoryText && (
                    <div 
                      className="tdg-detail-text"
                      dangerouslySetInnerHTML={{ __html: advisory.advisoryText }}
                    />
                  )}
                  {advisory.dateAdded && (
                    <p className="tdg-detail-date">
                      Published {new Date(advisory.dateAdded).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}