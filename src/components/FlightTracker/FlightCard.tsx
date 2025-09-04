'use client'

import React, { useEffect, useRef, memo, useState } from 'react'
import Image from 'next/image'
import { Glass } from './Glass'
import { gsap } from 'gsap'
import { Flight } from './types'
import { getAircraftImage, getAirlineLogo } from './utils/aircraftImage'

interface FlightCardProps {
  flight: Flight
  onClose: () => void
}

const FlightCardComponent: React.FC<FlightCardProps> = ({ flight, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [aircraftImage, setAircraftImage] = useState<string | null>(null)
  const [airlineLogo, setAirlineLogo] = useState<string | null>(null)

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' }
      )
    }
  }, [])

  // Load aircraft image
  useEffect(() => {
    const loadImage = async () => {
      const image = await getAircraftImage(
        flight.registration, 
        flight.icao24, 
        flight.aircraft
      )
      if (image) {
        setAircraftImage(image.url)
      }
    }
    loadImage()
  }, [flight.registration, flight.icao24, flight.aircraft])

  // Get airline logo
  useEffect(() => {
    const logo = getAirlineLogo(
      flight.airline, 
      flight.airline_iata, 
      flight.airline_icao
    )
    setAirlineLogo(logo)
  }, [flight.airline, flight.airline_iata, flight.airline_icao])

  const handleClose = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        opacity: 0,
        y: 20,
        scale: 0.95,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: onClose
      })
    } else {
      onClose()
    }
  }

  const getCountryFlag = (countryName: string) => {
    // Map country names to ISO2 codes for flag files
    const countryToIso2: Record<string, string> = {
      'united states': 'us',
      'united states of america': 'us',
      'usa': 'us',
      'united kingdom': 'gb',
      'uk': 'gb',
      'great britain': 'gb',
      'germany': 'de',
      'france': 'fr',
      'spain': 'es',
      'italy': 'it',
      'canada': 'ca',
      'mexico': 'mx',
      'brazil': 'br',
      'argentina': 'ar',
      'japan': 'jp',
      'china': 'cn',
      'south korea': 'kr',
      'australia': 'au',
      'new zealand': 'nz',
      'india': 'in',
      'russia': 'ru',
      'netherlands': 'nl',
      'belgium': 'be',
      'switzerland': 'ch',
      'austria': 'at',
      'poland': 'pl',
      'turkey': 'tr',
      'greece': 'gr',
      'portugal': 'pt',
      'sweden': 'se',
      'norway': 'no',
      'denmark': 'dk',
      'finland': 'fi',
      'ireland': 'ie',
      'singapore': 'sg',
      'malaysia': 'my',
      'thailand': 'th',
      'indonesia': 'id',
      'philippines': 'ph',
      'vietnam': 'vn',
      'south africa': 'za',
      'egypt': 'eg',
      'israel': 'il',
      'saudi arabia': 'sa',
      'united arab emirates': 'ae',
      'qatar': 'qa',
    }
    
    const normalized = countryName.toLowerCase().trim()
    const iso2 = countryToIso2[normalized]
    
    if (iso2) {
      return `/flags/${iso2}.svg`
    }
    
    // Fallback: try to use first two letters of country name
    const fallbackCode = normalized.substring(0, 2)
    return `/flags/${fallbackCode}.svg`
  }

  const formatAltitude = (altitude: number | null) => {
    if (!altitude) return 'N/A'
    return `${Math.round(altitude * 3.28084).toLocaleString()} ft`
  }

  const formatSpeed = (velocity: number | null) => {
    if (!velocity) return 'N/A'
    const mph = Math.round(velocity * 2.23694)
    return `${mph} mph`
  }

  const formatHeading = (track: number | null) => {
    if (track === null || track === undefined) return 'N/A'
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(track / 45) % 8
    return `${Math.round(track)}° ${directions[index]}`
  }

  const formatTimeSince = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp)
    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  }

  const getDepartureCode = () => {
    const airport = flight.departureAirport
    if (!airport) return 'DEP'
    
    // Extract IATA/ICAO code from string like "Los Angeles Intl (LAX)"
    const match = airport.match(/\(([A-Z]{3,4})\)/)
    if (match) return match[1]
    
    // If it's already a code (3-4 letters), return it
    if (airport.length <= 4 && /^[A-Z]{3,4}$/.test(airport)) {
      return airport
    }
    
    // Otherwise take first 3 letters
    return airport.substring(0, 3).toUpperCase()
  }

  const getArrivalCode = () => {
    const airport = flight.destinationAirport
    if (!airport) return 'ARR'
    
    // Extract IATA/ICAO code from string like "Los Angeles Intl (LAX)"
    const match = airport.match(/\(([A-Z]{3,4})\)/)
    if (match) return match[1]
    
    // If it's already a code (3-4 letters), return it
    if (airport.length <= 4 && /^[A-Z]{3,4}$/.test(airport)) {
      return airport
    }
    
    // Otherwise take first 3 letters
    return airport.substring(0, 3).toUpperCase()
  }

  return (
    <Glass
      ref={cardRef}
      className="flight-card"
      variant="card"
      rounded="lg"
      blur={16}
      style={{ 
        position: 'relative', 
        zIndex: 10,
        minHeight: 'auto',
        width: '100%'
      }}
    >
      <div className="flight-tracker-card">
        <div className="flight-tracker-card__header">
          <div className="flight-tracker-card__header-info">
            <h3 className="flight-tracker-card__title">
              {flight.callsign || flight.icao24}
              <Image
                src={getCountryFlag(flight.origin_country)}
                alt={flight.origin_country}
                width={24}
                height={18}
                className="flight-tracker-card__flag"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            </h3>
            {flight.airline && (
              <div className="flight-tracker-card__airline">
                {airlineLogo && (
                  <Image 
                    src={airlineLogo} 
                    alt={flight.airline}
                    width={24}
                    height={24}
                    className="flight-tracker-card__airline-logo"
                    style={{ objectFit: 'contain' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                    unoptimized // Since we're using external CDN
                  />
                )}
                <span>{flight.airline}</span>
              </div>
            )}
          </div>
          <button
            className="flight-tracker-card__close"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flight-tracker-card__content">
          {/* Route Display */}
          {(flight.departureAirport || flight.destinationAirport) && (
            <div className="flight-tracker-card__route">
              <div className="flight-tracker-card__airport">
                <div className="flight-tracker-card__airport-code">{getDepartureCode()}</div>
                {flight.departureAirport && (
                  <div className="flight-tracker-card__airport-name">
                    {flight.departureAirport}
                  </div>
                )}
              </div>
              
              <div className="flight-tracker-card__route-line">
                <svg width="100%" height="20" viewBox="0 0 200 20">
                  <line x1="10" y1="10" x2="190" y2="10" stroke="#60a5fa" strokeWidth="2" strokeDasharray="5,5" />
                </svg>
                {!flight.on_ground && (
                  <div 
                    className="flight-tracker-card__plane-icon"
                    style={{ left: '50%' }}
                  >
                    ✈️
                  </div>
                )}
              </div>
              
              <div className="flight-tracker-card__airport">
                <div className="flight-tracker-card__airport-code">{getArrivalCode()}</div>
                {flight.destinationAirport && (
                  <div className="flight-tracker-card__airport-name">
                    {flight.destinationAirport}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Flight Status */}
          <div className="flight-tracker-card__section">
            <h4>Flight Status</h4>
            <div className="flight-tracker-card__data-grid">
              <div className="flight-tracker-card__data-item">
                <span className="flight-tracker-card__label">Status</span>
                <span className="flight-tracker-card__value">
                  {flight.on_ground ? '🛬 On Ground' : '✈️ In Flight'}
                </span>
              </div>
              
              <div className="flight-tracker-card__data-item">
                <span className="flight-tracker-card__label">Last Contact</span>
                <span className="flight-tracker-card__value">
                  {formatTimeSince(flight.last_contact)}
                </span>
              </div>
            </div>
          </div>

          {/* Aircraft Details */}
          <div className="flight-tracker-card__section">
            <h4>Aircraft Details</h4>
            
            <div className="flight-tracker-card__data-grid">
              <div className="flight-tracker-card__data-item">
                <span className="flight-tracker-card__label">Speed</span>
                <span className="flight-tracker-card__value">
                  {formatSpeed(flight.velocity)}
                </span>
              </div>
              
              <div className="flight-tracker-card__data-item">
                <span className="flight-tracker-card__label">Altitude</span>
                <span className="flight-tracker-card__value">
                  {formatAltitude(flight.baro_altitude || flight.geo_altitude)}
                </span>
              </div>

              <div className="flight-tracker-card__data-item">
                <span className="flight-tracker-card__label">Heading</span>
                <span className="flight-tracker-card__value">
                  {formatHeading(flight.true_track)}
                </span>
              </div>

              <div className="flight-tracker-card__data-item">
                <span className="flight-tracker-card__label">Vertical Rate</span>
                <span className="flight-tracker-card__value">
                  {flight.vertical_rate ? `${Math.round(flight.vertical_rate * 196.85)} fpm` : 'Level'}
                </span>
              </div>
            </div>
          </div>

          {/* Aircraft Image */}
          {aircraftImage && (
            <div className="flight-tracker-card__section">
              <div className="flight-tracker-card__aircraft-image">
                <Image 
                  src={aircraftImage} 
                  alt={flight.aircraft || 'Aircraft'}
                  width={400}
                  height={300}
                  style={{ width: '100%', height: 'auto', borderRadius: '0.5rem' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                  unoptimized // Since we might be using external images
                />
                {flight.registration && (
                  <div className="flight-tracker-card__registration" style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                    Registration: {flight.registration}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Info */}
          <div className="flight-tracker-card__section">
            <h4>Technical Information</h4>
            
            <div className="flight-tracker-card__data-grid">
              <div className="flight-tracker-card__data-item">
                <span className="flight-tracker-card__label">ICAO24</span>
                <span className="flight-tracker-card__value">
                  {flight.icao24}
                </span>
              </div>
              
              <div className="flight-tracker-card__data-item">
                <span className="flight-tracker-card__label">Squawk</span>
                <span className="flight-tracker-card__value">
                  {flight.squawk || 'N/A'}
                </span>
              </div>

              {flight.aircraft && (
                <div className="flight-tracker-card__data-item">
                  <span className="flight-tracker-card__label">Aircraft Type</span>
                  <span className="flight-tracker-card__value">
                    {flight.aircraft}
                  </span>
                </div>
              )}

              {flight.registration && (
                <div className="flight-tracker-card__data-item">
                  <span className="flight-tracker-card__label">Registration</span>
                  <span className="flight-tracker-card__value">
                    {flight.registration}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Glass>
  )
}

export const FlightCard = memo(FlightCardComponent, (prevProps, nextProps) => {
  // Only re-render if the flight ICAO24 changes or onClose changes
  return prevProps.flight.icao24 === nextProps.flight.icao24 && 
         prevProps.onClose === nextProps.onClose &&
         prevProps.flight.callsign === nextProps.flight.callsign
})

export default FlightCard