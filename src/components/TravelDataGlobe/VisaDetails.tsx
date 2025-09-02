'use client'

import React from 'react'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faPassport, faCheckCircle, faTimesCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import type { CountryVisaData } from '@/blocks/TravelDataGlobeBlock/types'

interface VisaDetailsProps {
  country: CountryVisaData
  onClose: () => void
}

export function VisaDetails({ country, onClose }: VisaDetailsProps) {
  const getVisaIcon = (requirement: string) => {
    switch (requirement) {
      case 'visa_free':
        return <FontAwesomeIcon icon={faCheckCircle} className="tdg-visa-icon tdg-visa-free" />
      case 'visa_on_arrival':
      case 'e_visa':
      case 'eta':
        return <FontAwesomeIcon icon={faExclamationCircle} className="tdg-visa-icon tdg-visa-partial" />
      case 'visa_required':
      case 'no_admission':
        return <FontAwesomeIcon icon={faTimesCircle} className="tdg-visa-icon tdg-visa-required" />
      default:
        return null
    }
  }

  const getVisaText = (requirement: string) => {
    switch (requirement) {
      case 'visa_free': return 'Visa Free'
      case 'visa_on_arrival': return 'Visa on Arrival'
      case 'e_visa': return 'e-Visa Required'
      case 'eta': return 'ETA Required'
      case 'visa_required': return 'Visa Required'
      case 'no_admission': return 'No Admission'
      default: return 'Unknown'
    }
  }

  return (
    <div className="tdg-details-overlay">
      <div className="tdg-details-panel">
        <button className="tdg-details-close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        
        <div className="tdg-details-header">
          <FontAwesomeIcon icon={faPassport} className="tdg-details-icon" />
          <h2>Visa Requirements from {country.countryName}</h2>
        </div>

        <div className="tdg-details-stats">
          <div className="tdg-stat-item">
            <span className="tdg-stat-value">{country.totalDestinations}</span>
            <span className="tdg-stat-label">Total Destinations</span>
          </div>
          {country.visaFreeCount && (
            <div className="tdg-stat-item">
              <span className="tdg-stat-value">{country.visaFreeCount}</span>
              <span className="tdg-stat-label">Visa-Free Access</span>
            </div>
          )}
        </div>

        <div className="tdg-details-content">
          <h3>Destination Requirements</h3>
          <div className="tdg-visa-requirements-grid">
            {country.visaRequirements?.map((req, idx) => (
              <div key={idx} className="tdg-visa-requirement-item">
                <div className="tdg-visa-requirement-country">
                  <span>{req.destinationCountry}</span>
                </div>
                <div className="tdg-visa-requirement-status">
                  {getVisaIcon(req.requirement)}
                  <span>{getVisaText(req.requirement)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
