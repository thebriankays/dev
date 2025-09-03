'use client'

import React from 'react'
import Image from 'next/image'
import type { MichelinRestaurantData } from '@/blocks/TravelDataGlobeBlock/types'

interface RestaurantPanelProps {
  restaurants: MichelinRestaurantData[]
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedRestaurant: MichelinRestaurantData | null
  onRestaurantClick: (restaurant: MichelinRestaurantData) => void
}

export function RestaurantPanel({
  restaurants,
  searchQuery,
  onSearchChange,
  selectedRestaurant,
  onRestaurantClick,
}: RestaurantPanelProps) {
  const filteredRestaurants = restaurants.filter(rest =>
    rest && (
      (rest.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rest.displayLocation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rest.cuisine || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  // Helper to get country flag from location
  const getCountryFlag = (restaurant: MichelinRestaurantData) => {
    // Check if there's a flag in the location data
    if (restaurant.location?.countryFlag) {
      return restaurant.location.countryFlag
    }
    
    // Extract country from display location or location data
    const locationStr = restaurant.displayLocation || restaurant.location?.country || ''
    if (!locationStr) return null
    
    // Extract country from location (usually the last part after comma)
    const parts = locationStr.split(',')
    const country = parts[parts.length - 1]?.trim()
    if (!country) return null
    
    // Map common country names to ISO codes for flag URLs
    const countryMap: Record<string, string> = {
      'USA': 'us', 'United States': 'us', 'US': 'us', 'United States of America': 'us',
      'UK': 'gb', 'United Kingdom': 'gb', 'Great Britain': 'gb',
      'France': 'fr', 'Germany': 'de', 'Italy': 'it', 'Spain': 'es',
      'Japan': 'jp', 'China': 'cn', 'Canada': 'ca', 'Mexico': 'mx',
      'Brazil': 'br', 'India': 'in', 'Australia': 'au', 'Netherlands': 'nl',
      'Belgium': 'be', 'Switzerland': 'ch', 'Austria': 'at', 'Sweden': 'se',
      'Norway': 'no', 'Denmark': 'dk', 'Finland': 'fi', 'Poland': 'pl',
      'Portugal': 'pt', 'Greece': 'gr', 'Turkey': 'tr', 'Russia': 'ru',
      'South Korea': 'kr', 'Singapore': 'sg', 'Thailand': 'th', 'Indonesia': 'id',
      'Malaysia': 'my', 'Philippines': 'ph', 'Vietnam': 'vn', 'UAE': 'ae',
      'Saudi Arabia': 'sa', 'Egypt': 'eg', 'South Africa': 'za', 'Nigeria': 'ng',
      'Argentina': 'ar', 'Chile': 'cl', 'Colombia': 'co', 'Peru': 'pe',
    }
    
    const code = countryMap[country] || country.toLowerCase().slice(0, 2)
    return `https://flagcdn.com/24x16/${code}.png`
  }

  return (
    <>
      <input
        type="text"
        placeholder="Search restaurants…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="tdg-search-input"
      />

      <div className="tdg-list-container" data-lenis-prevent>
        {filteredRestaurants.map((restaurant, idx) => {
          const flagUrl = getCountryFlag(restaurant)
          
          return (
            <div
              key={`restaurant-${restaurant.id}-${idx}`}
              className={`tdg-restaurant-item ${selectedRestaurant?.id === restaurant.id ? 'tdg-selected' : ''}`}
              onClick={() => onRestaurantClick(restaurant)}
            >
              <div className="tdg-restaurant-header">
                {flagUrl && (
                  <Image
                    src={flagUrl}
                    alt="flag"
                    width={24}
                    height={16}
                    className="tdg-flag"
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                <span className="tdg-restaurant-name">{restaurant.name}</span>
                {restaurant.greenStar && <span className="tdg-green-star" title="Michelin Green Star">🌿</span>}
              </div>
              <div className="tdg-restaurant-details">
                <span className="tdg-restaurant-rating">{restaurant.displayRating || '⭐'.repeat(restaurant.rating)}</span>
                <span className="tdg-restaurant-cuisine">{restaurant.cuisine}</span>
              </div>
              <div className="tdg-restaurant-location">
                {restaurant.displayLocation}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}