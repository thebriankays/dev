'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import type { CountryVisaData } from '@/blocks/TravelDataGlobeBlock/types'

interface VisaPanelProps {
  countries: CountryVisaData[]
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCountry: string | null
  onCountryClick: (country: CountryVisaData) => void
}

export function VisaPanel({
  countries,
  searchQuery,
  onSearchChange,
  selectedCountry,
  onCountryClick,
}: VisaPanelProps) {
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  
  const filteredCountries = countries.filter(country =>
    country && (
      (country.countryName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (country.countryCode || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const handleRowClick = (country: CountryVisaData) => {
    setExpandedCountry(expandedCountry === country.countryName ? null : country.countryName)
    onCountryClick(country)
  }

  return (
    <>
      <div className="tdg-search-container">
        <input
          type="text"
          placeholder="Search passport countries..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="tdg-search-input"
        />
      </div>

      <div className="tdg-list-container">
        {filteredCountries.map((country) => {
          const isExpanded = expandedCountry === country.countryName
          const isSelected = selectedCountry === country.countryName
          
          return (
            <div
              key={country.countryId}
              className={`tdg-country-item ${isSelected ? 'tdg-selected' : ''} ${isExpanded ? 'tdg-expanded' : ''}`}
            >
              <div 
                className="tdg-country-header"
                onClick={() => handleRowClick(country)}
              >
                {country.countryFlag && (
                  <Image
                    src={country.countryFlag}
                    alt={`${country.countryName} flag`}
                    width={24}
                    height={16}
                    className="tdg-flag"
                    unoptimized
                  />
                )}
                
                <span className="tdg-country-name">{country.countryName}</span>
                
                <span className="tdg-visa-free-count">
                  {country.visaFreeCount || 0} visa-free
                </span>
              </div>
              
              {isExpanded && (
                <div className="tdg-advisory-details">
                  <div className="tdg-detail-title">
                    {country.countryName} Passport Statistics
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <p className="tdg-detail-description">
                        <strong style={{ color: '#4caf50' }}>Visa Free:</strong> {country.visaFreeCount || 0}
                      </p>
                      <p className="tdg-detail-description">
                        <strong style={{ color: '#8bc34a' }}>Visa on Arrival:</strong> {country.visaOnArrivalCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="tdg-detail-description">
                        <strong style={{ color: '#03a9f4' }}>e-Visa/ETA:</strong> {country.eVisaCount || 0}
                      </p>
                      <p className="tdg-detail-description">
                        <strong style={{ color: '#f4511e' }}>Visa Required:</strong> {country.visaRequiredCount || 0}
                      </p>
                    </div>
                  </div>
                  
                  <p className="tdg-detail-description">
                    <strong>Total Destinations:</strong> {country.totalDestinations || 0}
                  </p>
                  
                  <div className="tdg-detail-text">
                    <p style={{ fontSize: '0.75rem', color: 'rgba(226, 232, 240, 0.6)' }}>
                      Click to view visa-free travel destinations on the globe. Green lines indicate visa-free access, 
                      light green for visa on arrival, and blue for e-visa/ETA options.
                    </p>
                  </div>
                  
                  {country.totalDestinations && country.visaFreeCount && (
                    <p className="tdg-detail-date">
                      Visa Freedom Index: {Math.round((country.visaFreeCount / country.totalDestinations) * 100)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
