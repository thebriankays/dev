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
          
          return (
            <li
              key={uniqueKey}
              className={`tdg-country-item ${
                selectedCountry === advisory.country ? 'tdg-selected' : ''
              }`}
              onClick={() => onCountryClick(advisory)}
            >
              <div className="tdg-advisory-header">
                {advisory.countryFlag && (
                  <Image
                    src={advisory.countryFlag}
                    alt={`${advisory.country} flag`}
                    width={24}
                    height={16}
                    className="tdg-flag"
                    style={{ width: '24px', height: 'auto' }}
                    unoptimized
                  />
                )}
                
                <span className="tdg-advisory-country">{advisory.country}</span>
                
                <span className={`tdg-advisory-level tdg-level-${advisory.level}`}>
                  Level {advisory.level}
                </span>
              </div>
              
              {advisory.isNew && (
                <span className="tdg-new-pill">NEW</span>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}