'use client'

import React from 'react'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import type { AdvisoryCountry } from '../types'

interface AdvisoryPanelProps {
  advisories: AdvisoryCountry[]
  selectedCountry: string | null
  searchQuery: string
  showKey: boolean
  onSearchChange: (value: string) => void
  onToggleKey: () => void
  onSelectCountry: (country: string) => void
}

export const AdvisoryPanel: React.FC<AdvisoryPanelProps> = ({
  advisories,
  selectedCountry,
  searchQuery,
  showKey,
  onSearchChange,
  onToggleKey,
  onSelectCountry
}) => {
  // Helper to check if advisory is new (added in last 30 days)
  const isNewAdvisory = (dateAdded: string | undefined): boolean => {
    if (!dateAdded) return false
    try {
      const date = new Date(dateAdded)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 30
    } catch {
      return false
    }
  }
  
  // Helper to get flag URL
  const getFlagUrl = (country: any): string | null => {
    if (country?.flag) return `/flags/${country.flag}`
    if (country?.iso2) return `/flags/${country.iso2.toLowerCase()}.svg`
    if (country?.name) {
      // Map common country names to ISO codes
      const countryMap: Record<string, string> = {
        'united states': 'us',
        'united kingdom': 'gb',
        'south korea': 'kr',
        'north korea': 'kp',
        // Add more mappings as needed
      }
      const code = countryMap[country.name.toLowerCase()]
      if (code) return `/flags/${code}.svg`
    }
    return null
  }
  
  // Filter advisories based on search
  const filteredAdvisories = advisories.filter(adv => 
    adv?.country?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  return (
    <div className="tdg-info-panel tdg-advisory-panel">
      <h3 className="tdg-panel-heading">
        <Image 
          src="/department-of-state.png" 
          alt="U.S. Department of State" 
          width={40} 
          height={40} 
          style={{ opacity: 0.9 }}
        />
        <span>U.S. Travel Advisories</span>
      </h3>
      
      {/* Advisory Level Key */}
      <div className="tdg-key-accordion">
        <button 
          className={`tdg-key-toggle ${showKey ? 'tdg-key-toggle--open' : ''}`}
          onClick={onToggleKey}
        >
          <span>Advisory Level Key</span>
          <FontAwesomeIcon icon={faChevronDown} className="tdg-key-icon" />
        </button>
        <div className={`tdg-key-content ${showKey ? 'tdg-key-content--open' : ''}`}>
          <div className="tdg-key-items">
            <div className="tdg-key-item">
              <span className="tdg-key-indicator tdg-level-1"></span>
              <span>Level 1: Exercise Normal Precautions</span>
            </div>
            <div className="tdg-key-item">
              <span className="tdg-key-indicator tdg-level-2"></span>
              <span>Level 2: Exercise Increased Caution</span>
            </div>
            <div className="tdg-key-item">
              <span className="tdg-key-indicator tdg-level-3"></span>
              <span>Level 3: Reconsider Travel</span>
            </div>
            <div className="tdg-key-item">
              <span className="tdg-key-indicator tdg-level-4"></span>
              <span>Level 4: Do Not Travel</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search */}
      <input
        type="text"
        placeholder="Search countries…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="tdg-search-input"
      />
      
      {/* Advisory List */}
      <div className="tdg-advisory-list" data-lenis-prevent>
        {filteredAdvisories.map((advisory, idx) => {
          const flagUrl = getFlagUrl(advisory)
          const isNew = isNewAdvisory(advisory.dateAdded)
          
          return (
            <div
              key={`advisory-${advisory.country}-${idx}`}
              onClick={() => onSelectCountry(advisory.country)}
              className={`tdg-advisory-item ${selectedCountry === advisory.country ? 'tdg-selected' : ''}`}
            >
              <span className={`tdg-advisory-dot tdg-level-${advisory.level}`}></span>
              <div className="tdg-advisory-content">
                <div className="tdg-advisory-header">
                  {flagUrl && (
                    <Image 
                      src={flagUrl} 
                      alt={`${advisory.country} flag`} 
                      width={24} 
                      height={16} 
                      className="tdg-flag"
                      unoptimized
                    />
                  )}
                  <span className="tdg-advisory-country">{advisory.country}</span>
                  {isNew && (
                    <span className="tdg-new-pill" title={`Added ${advisory.dateAdded}`}>
                      NEW
                    </span>
                  )}
                </div>
                <span className={`tdg-advisory-level tdg-level-${advisory.level}`}>
                  Level {advisory.level}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
