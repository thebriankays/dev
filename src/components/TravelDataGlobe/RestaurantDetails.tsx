'use client'

import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faUtensils, faStar, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons'
import type { MichelinRestaurantData } from '@/blocks/TravelDataGlobeBlock/types'

interface RestaurantDetailsProps {
  restaurant: MichelinRestaurantData
  onClose: () => void
}

export function RestaurantDetails({ restaurant, onClose }: RestaurantDetailsProps) {
  return (
    <div className="tdg-detail-overlay">
      <div className="tdg-detail-glass">
        <div className="tdg-detail-header">
          <div className="tdg-detail-header-left">
            <FontAwesomeIcon icon={faUtensils} />
            <h2 className="tdg-detail-title">{restaurant.name}</h2>
            {restaurant.greenStar && (
              <span className="tdg-detail-level tdg-level-1" title="Michelin Green Star">
                🌿 Green Star
              </span>
            )}
          </div>
          
          <button
            className="tdg-detail-close"
            onClick={onClose}
            aria-label="Close details"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="tdg-detail-content" data-lenis-prevent>
          <div className="tdg-prose">
            <div className="tdg-info-row">
              <FontAwesomeIcon icon={faStar} className="tdg-info-icon" />
              <span className="tdg-info-label">Rating:</span>
              <span className="tdg-info-value">
                {restaurant.displayRating || '⭐'.repeat(restaurant.rating)}
              </span>
            </div>
            
            <div className="tdg-info-row">
              <FontAwesomeIcon icon={faUtensils} className="tdg-info-icon" />
              <span className="tdg-info-label">Cuisine:</span>
              <span className="tdg-info-value">{restaurant.cuisine}</span>
            </div>
            
            <div className="tdg-info-row">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="tdg-info-icon" />
              <span className="tdg-info-label">Location:</span>
              <span className="tdg-info-value">{restaurant.displayLocation}</span>
            </div>

            <div className="tdg-location-coordinates">
              <span>Coordinates: {restaurant.location.lat.toFixed(4)}, {restaurant.location.lng.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
