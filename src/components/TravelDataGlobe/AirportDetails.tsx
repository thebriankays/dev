'use client'

import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faPlane, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons'
import type { AirportData } from '@/blocks/TravelDataGlobeBlock/types'

interface AirportDetailsProps {
  airport: AirportData
  onClose: () => void
}

export function AirportDetails({ airport, onClose }: AirportDetailsProps) {
  return (
    <div className="tdg-detail-overlay">
      <div className="tdg-detail-glass">
        <div className="tdg-detail-header">
          <div className="tdg-detail-header-left">
            <FontAwesomeIcon icon={faPlane} />
            <h2 className="tdg-detail-title">{airport.name}</h2>
            <span className="tdg-detail-level tdg-level-2">{airport.code}</span>
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
              <FontAwesomeIcon icon={faMapMarkerAlt} className="tdg-info-icon" />
              <span className="tdg-info-label">Location:</span>
              <span className="tdg-info-value">{airport.displayLocation}</span>
            </div>

            <div className="tdg-location-coordinates">
              <span>Coordinates: {airport.location.lat.toFixed(4)}, {airport.location.lng.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
