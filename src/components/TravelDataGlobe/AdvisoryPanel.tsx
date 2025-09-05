'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons'
import type { AdvisoryCountry } from '@/blocks/TravelDataGlobeBlock/types'

interface AdvisoryPanelProps {
  advisories: AdvisoryCountry[]
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCountry: string | null
  onCountryClick: (advisory: AdvisoryCountry) => void
}

type SortField = 'country' | 'level'
type SortOrder = 'asc' | 'desc'
type LevelFilter = 'all' | 1 | 2 | 3 | 4

export function AdvisoryPanel({
  advisories,
  searchQuery,
  onSearchChange,
  selectedCountry,
  onCountryClick,
}: AdvisoryPanelProps) {
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('country')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  
  // Filter and sort advisories
  const processedAdvisories = useMemo(() => {
    const filtered = advisories.filter(advisory => {
      // Search filter
      const matchesSearch = advisory.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (advisory.countryCode && advisory.countryCode.toLowerCase().includes(searchQuery.toLowerCase()))
      
      // Level filter
      const matchesLevel = levelFilter === 'all' || advisory.level === levelFilter
      
      return matchesSearch && matchesLevel
    })
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      
      if (sortField === 'country') {
        comparison = a.country.localeCompare(b.country)
      } else if (sortField === 'level') {
        comparison = a.level - b.level
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return filtered
  }, [advisories, searchQuery, levelFilter, sortField, sortOrder])
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }
  
  const handleRowClick = (advisory: AdvisoryCountry) => {
    setExpandedCountry(expandedCountry === advisory.country ? null : advisory.country)
    onCountryClick(advisory)
  }
  
  // Track duplicates for unique keys
  const keyTracker = new Map<string, number>()
  const getUniqueKey = (country: string, code?: string) => {
    const baseKey = `${country}-${code || 'XX'}`
    const count = keyTracker.get(baseKey) || 0
    keyTracker.set(baseKey, count + 1)
    return count === 0 ? baseKey : `${baseKey}-${count}`
  }

  return (
    <>
      {/* Search bar */}
      <div className="tdg-search-container">
        <input
          type="text"
          placeholder="Search countries..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="tdg-search-input"
        />
      </div>

      {/* Level filter - Always visible */}
      <div className="tdg-key-section">
        <div className="tdg-key-header">Filter by Level:</div>
        <div className="tdg-key-filters">
          <button
            className={`tdg-filter-btn tdg-filter-all ${levelFilter === 'all' ? 'active' : ''}`}
            onClick={() => setLevelFilter('all')}
          >
            All ({advisories.length})
          </button>
          <button
            className={`tdg-filter-btn tdg-level-1 ${levelFilter === 1 ? 'active' : ''}`}
            onClick={() => setLevelFilter(1)}
          >
            Level 1
          </button>
          <button
            className={`tdg-filter-btn tdg-level-2 ${levelFilter === 2 ? 'active' : ''}`}
            onClick={() => setLevelFilter(2)}
          >
            Level 2
          </button>
          <button
            className={`tdg-filter-btn tdg-level-3 ${levelFilter === 3 ? 'active' : ''}`}
            onClick={() => setLevelFilter(3)}
          >
            Level 3
          </button>
          <button
            className={`tdg-filter-btn tdg-level-4 ${levelFilter === 4 ? 'active' : ''}`}
            onClick={() => setLevelFilter(4)}
          >
            Level 4
          </button>
        </div>
      </div>

      {/* Sort controls */}
      <div className="tdg-sort-controls">
        <button
          className="tdg-sort-btn"
          onClick={() => handleSort('country')}
        >
          Country
          <FontAwesomeIcon
            icon={sortField === 'country' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort}
            className="tdg-sort-icon"
          />
        </button>
        <button
          className="tdg-sort-btn"
          onClick={() => handleSort('level')}
        >
          Level
          <FontAwesomeIcon
            icon={sortField === 'level' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort}
            className="tdg-sort-icon"
          />
        </button>
      </div>

      {/* List */}
      <ul className="tdg-list-container">
        {processedAdvisories.map((advisory) => {
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
                
                {advisory.isNew && (
                  <span className="tdg-new-pill">NEW</span>
                )}
                
                <span className={`tdg-advisory-level tdg-level-${advisory.level}`}>
                  Level {advisory.level}
                </span>
              </div>
              
              {isExpanded && (
                <div className="tdg-advisory-details">
                  {advisory.dateAdded && (
                    <p className="tdg-detail-date">
                      Published {new Date(advisory.dateAdded).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                  <h4 className="tdg-detail-title">{advisory.levelText}</h4>
                  <p className="tdg-detail-description">{advisory.levelDescription}</p>
                  {advisory.advisoryText && (
                    <div 
                      className="tdg-detail-text"
                      dangerouslySetInnerHTML={{ __html: advisory.advisoryText }}
                    />
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