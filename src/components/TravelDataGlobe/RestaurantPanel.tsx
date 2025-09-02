'use client'

import React from 'react'
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
        {filteredRestaurants.map((restaurant, idx) => (
          <div
            key={`restaurant-${restaurant.id}-${idx}`}
            className={`tdg-restaurant-item ${selectedRestaurant?.id === restaurant.id ? 'tdg-selected' : ''}`}
            onClick={() => onRestaurantClick(restaurant)}
          >
            <div className="tdg-restaurant-header">
              <span className="tdg-restaurant-name">{restaurant.name}</span>
              {restaurant.greenStar && (
                <span className="tdg-green-star" title="Michelin Green Star">🌿</span>
              )}
            </div>
            <div className="tdg-restaurant-details">
              <span className="tdg-restaurant-rating">
                {restaurant.displayRating || '⭐'.repeat(restaurant.rating)}
              </span>
              <span className="tdg-restaurant-cuisine">{restaurant.cuisine}</span>
            </div>
            <div className="tdg-restaurant-location">{restaurant.displayLocation}</div>
          </div>
        ))}
      </div>
    </>
  )
}
