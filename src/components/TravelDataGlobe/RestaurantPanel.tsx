'use client'

import React, { useState } from 'react'
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
  const [expandedRestaurant, setExpandedRestaurant] = useState<string | null>(null)
  
  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant && (
      (restaurant.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (restaurant.cuisine || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (restaurant.location?.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (restaurant.location?.country || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const handleRowClick = (restaurant: MichelinRestaurantData) => {
    setExpandedRestaurant(expandedRestaurant === restaurant.id ? null : restaurant.id)
    onRestaurantClick(restaurant)
  }

  return (
    <>
      <div className="tdg-search-container">
        <input
          type="text"
          placeholder="Search restaurants..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="tdg-search-input"
        />
      </div>

      <div className="tdg-list-container">
        {filteredRestaurants.map((restaurant) => {
          const isExpanded = expandedRestaurant === restaurant.id
          const isSelected = selectedRestaurant?.id === restaurant.id
          
          return (
            <div
              key={restaurant.id}
              className={`tdg-restaurant-item ${isSelected ? 'tdg-selected' : ''} ${isExpanded ? 'tdg-expanded' : ''}`}
            >
              <div 
                className="tdg-restaurant-header"
                onClick={() => handleRowClick(restaurant)}
              >
                {/* Country Flag */}
                {restaurant.location?.countryFlag && (
                  <Image
                    src={restaurant.location.countryFlag}
                    alt=""
                    className="tdg-flag"
                    width={24}
                    height={16}
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                
                <div className="tdg-restaurant-name">{restaurant.name}</div>
                
                {/* Green Star */}
                {restaurant.greenStar && (
                  <span className="tdg-green-star" title="Michelin Green Star">🌿</span>
                )}
                
                {/* Michelin Stars */}
                {restaurant.rating && restaurant.rating > 0 && (
                  <span className="tdg-restaurant-rating">
                    {'⭐'.repeat(Math.min(restaurant.rating, 3))}
                  </span>
                )}
              </div>
              
              {isExpanded && (
                <div className="tdg-advisory-details">
                  <div className="tdg-detail-title">{restaurant.name}</div>
                  
                  {restaurant.cuisine && (
                    <p className="tdg-detail-description">
                      <strong>Cuisine:</strong> {restaurant.cuisine}
                    </p>
                  )}
                  
                  <p className="tdg-detail-description">
                    <strong>Location:</strong> {restaurant.location?.city}, {restaurant.location?.country}
                  </p>
                  
                  {restaurant.rating && restaurant.rating > 0 && (
                    <p className="tdg-detail-description">
                      <strong>Michelin Rating:</strong> {'⭐'.repeat(Math.min(restaurant.rating, 3))} ({restaurant.rating} star{restaurant.rating > 1 ? 's' : ''})
                    </p>
                  )}
                  
                  {restaurant.greenStar && (
                    <p className="tdg-detail-description">
                      <strong>Green Star:</strong> 🌿 Awarded for sustainable gastronomy
                    </p>
                  )}
                  
                  {restaurant.description && (
                    <div className="tdg-detail-text">
                      <p>{restaurant.description}</p>
                    </div>
                  )}
                  
                  {(restaurant.location?.lat && restaurant.location?.lng) && (
                    <p className="tdg-detail-date">
                      Coordinates: {restaurant.location.lat.toFixed(4)}, {restaurant.location.lng.toFixed(4)}
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
