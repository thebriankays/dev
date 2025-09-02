'use client'

import React from 'react'
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
  const filteredCountries = countries.filter(country =>
    country.countryName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <input
        type="text"
        placeholder="Search passport countries…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="tdg-search-input"
      />
      
      <div className="tdg-list-container" data-lenis-prevent>
        {filteredCountries.map((country, idx) => (
          <div
            key={`visa-${country.countryId}-${idx}`}
            onClick={() => onCountryClick(country)}
            className={`tdg-visa-item ${selectedCountry === country.countryName ? 'tdg-selected' : ''}`}
          >
            <div className="tdg-visa-header">
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
              <span className="tdg-visa-country">{country.countryName}</span>
            </div>
            <div className="tdg-visa-stats">
              <span className="tdg-visa-count">{country.totalDestinations} destinations</span>
              {country.visaFreeCount && country.visaFreeCount > 0 && (
                <span className="tdg-visa-free">{country.visaFreeCount} visa-free</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
