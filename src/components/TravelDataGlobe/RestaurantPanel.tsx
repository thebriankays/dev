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
            className={`tdg-list-item ${
              selectedRestaurant?.id === restaurant.id ? 'tdg-list-item--selected' : ''
            }`}
            onClick={() => onRestaurantClick(restaurant)}
          >
            <div className="tdg-list-item-content">
              {/* Country Flag */}
              {restaurant.location?.countryFlag && (
                <Image
                  src={restaurant.location.countryFlag}
                  alt=""
                  className="tdg-country-flag"
                  width={24}
                  height={16}
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              
              {/* Restaurant Info */}
              <div className="tdg-list-item-details">
                <div className="tdg-list-item-name">
                  <span className="tdg-restaurant-name">{restaurant.name}</span>
                </div>
                {restaurant.cuisine && (
                  <div className="tdg-list-item-cuisine">
                    {restaurant.cuisine}
                  </div>
                )}
                <div className="tdg-list-item-location">
                  {restaurant.location?.city && restaurant.location?.country && 
                    `${restaurant.location.city}, ${restaurant.location.country}`
                  }
                </div>
              </div>

              {/* Michelin Stars and Green Star */}
              <div className="tdg-restaurant-badges">
                {restaurant.rating && restaurant.rating > 0 && (
                  <span className="tdg-michelin-stars">
                    {'⭐'.repeat(restaurant.rating)}
                  </span>
                )}
                {restaurant.greenStar && (
                  <span className="tdg-green-star" title="Michelin Green Star">🍃</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
