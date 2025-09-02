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
    <div className="tdg-details-overlay">
      <div className="tdg-details-panel">
        <button className="tdg-details-close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        
        <div className="tdg-details-header">
          <FontAwesomeIcon icon={faPlane} className="tdg-details-icon" />
          <h2>{airport.name}</h2>
          <span className="tdg-airport-code-badge">{airport.code}</span>
        </div>

        <div className="tdg-details-content">
          <div className="tdg-airport-info">
            <div className="tdg-info-row">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="tdg-info-icon" />
              <span className="tdg-info-label">Location:</span>
              <span className="tdg-info-value">{airport.displayLocation}</span>
            </div>
          </div>

          <div className="tdg-location-coordinates">
            <span>Coordinates: {airport.location.lat.toFixed(4)}, {airport.location.lng.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
