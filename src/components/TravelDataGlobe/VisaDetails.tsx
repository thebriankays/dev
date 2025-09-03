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
        return <FontAwesomeIcon icon={faCheckCircle} className="tdg-visa-icon tdg-visa-free" style={{ color: '#4caf50' }} />
      case 'visa_on_arrival':
      case 'e_visa':
      case 'eta':
        return <FontAwesomeIcon icon={faExclamationCircle} className="tdg-visa-icon tdg-visa-partial" style={{ color: '#ffb300' }} />
      case 'visa_required':
      case 'no_admission':
        return <FontAwesomeIcon icon={faTimesCircle} className="tdg-visa-icon tdg-visa-required" style={{ color: '#ef4444' }} />
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
    <div className="tdg-detail-overlay">
      <div className="tdg-detail-glass">
        <div className="tdg-detail-header">
          <div className="tdg-detail-header-left">
            <FontAwesomeIcon icon={faPassport} />
            {country.countryFlag && (
              <Image 
                src={country.countryFlag} 
                alt={`${country.countryName} flag`} 
                width={36} 
                height={24} 
                className="tdg-detail-flag"
                unoptimized
              />
            )}
            <h2 className="tdg-detail-title">Visa Requirements from {country.countryName}</h2>
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
            <div className="tdg-visa-stats">
              <div className="tdg-stat-card">
                <span className="tdg-stat-value">{country.totalDestinations}</span>
                <span className="tdg-stat-label">Total Destinations</span>
              </div>
              {country.visaFreeCount !== undefined && (
                <div className="tdg-stat-card">
                  <span className="tdg-stat-value" style={{ color: '#4caf50' }}>{country.visaFreeCount}</span>
                  <span className="tdg-stat-label">Visa-Free Access</span>
                </div>
              )}
              {country.visaOnArrivalCount !== undefined && (
                <div className="tdg-stat-card">
                  <span className="tdg-stat-value" style={{ color: '#ffb300' }}>{country.visaOnArrivalCount}</span>
                  <span className="tdg-stat-label">Visa on Arrival</span>
                </div>
              )}
              {country.eVisaCount !== undefined && (
                <div className="tdg-stat-card">
                  <span className="tdg-stat-value" style={{ color: '#03a9f4' }}>{country.eVisaCount}</span>
                  <span className="tdg-stat-label">e-Visa</span>
                </div>
              )}
            </div>

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
    </div>
  )
}
