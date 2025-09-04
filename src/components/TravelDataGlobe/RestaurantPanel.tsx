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
  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant && (
      (restaurant.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (restaurant.cuisine || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (restaurant.location?.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (restaurant.location?.country || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  return (
    <>
      <div className="tdg-search-wrapper">
        <input
          type="text"
          placeholder="Search restaurants..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="tdg-search-input"
        />
      </div>

      <div className="tdg-list-container" data-lenis-prevent>
        {filteredRestaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className={`tdg-restaurant-item ${
              selectedRestaurant?.id === restaurant.id ? 'tdg-selected' : ''
            }`}
            onClick={() => onRestaurantClick(restaurant)}
          >
            <div className="tdg-restaurant-header">
              {/* Country Flag */}
              {restaurant.location?.countryFlag && (
                <Image
                  src={restaurant.location.countryFlag}
                  alt=""
                  className="tdg-flag"
                  width={24}
                  height={16}
                  style={{ width: '24px', height: 'auto' }}
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              
              <div className="tdg-restaurant-name">{restaurant.name}</div>
              
              {/* Michelin Stars and Green Star */}
              {restaurant.greenStar && (
                <span className="tdg-green-star" title="Michelin Green Star">🌿</span>
              )}
            </div>
            
            <div className="tdg-restaurant-details">
              <span className="tdg-restaurant-rating">
                {restaurant.rating && restaurant.rating > 0 && (
                  <>{'⭐'.repeat(Math.min(restaurant.rating, 3))}</>
                )}
              </span>
              <span className="tdg-restaurant-cuisine">{restaurant.cuisine}</span>
            </div>
            
            <div className="tdg-restaurant-location">
              {restaurant.location?.city && restaurant.location?.country && 
                `${restaurant.location.city}, ${restaurant.location.country}`
              }
            </div>
          </div>
        ))}
      </div>
    </>
  )
}