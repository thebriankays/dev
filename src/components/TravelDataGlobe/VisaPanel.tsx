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
    country.countryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (country.countryCode && country.countryCode.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
        {filteredCountries.map((country) => (
          <li
            key={country.countryId}
            className={`tdg-visa-item ${
              selectedCountry === country.countryName ? 'tdg-selected' : ''
            }`}
            onClick={() => onCountryClick(country)}
          >
            <div className="tdg-visa-header">
              {country.countryFlag && (
                <Image
                  src={country.countryFlag}
                  alt={`${country.countryName} flag`}
                  width={24}
                  height={16}
                  className="tdg-flag"
                  style={{ width: '24px', height: '16px', objectFit: 'contain' }}
                  unoptimized
                />
              )}
              
              <span className="tdg-visa-country">{country.countryName}</span>
            </div>
            
            <div className="tdg-visa-stats">
              <span>{country.visaFreeCount || 0} visa-free</span>
              <span>{country.totalDestinations} total</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}