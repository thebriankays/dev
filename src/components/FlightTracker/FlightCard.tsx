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
    // First check if we have a specific departure code
    if ('departureAirportCode' in flight && flight.departureAirportCode) {
      return flight.departureAirportCode as string
    }
    
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
    // First check if we have a specific arrival code
    if ('arrivalAirportCode' in flight && flight.arrivalAirportCode) {
      return flight.arrivalAirportCode as string
    }
    
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
              {'friendlyFlightIdentifier' in flight && flight.friendlyFlightIdentifier ? (
                <span>{flight.friendlyFlightIdentifier}</span>
              ) : (
                flight.callsign || flight.icao24
              )}
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
                {'departureGate' in flight && flight.departureGate && (
                  <div className="flight-tracker-card__gate">Gate {flight.departureGate as string}</div>
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
                {'arrivalGate' in flight && flight.arrivalGate && (
                  <div className="flight-tracker-card__gate">Gate {flight.arrivalGate as string}</div>
                )}
              </div>
            </div>
          )}

          {/* Flight Times - Departure */}
          {(('gateDepartureTime' in flight && flight.gateDepartureTime) || 
            ('takeoffTime' in flight && flight.takeoffTime) || 
            ('scheduled_departure' in flight && flight.scheduled_departure)) ? (
            <div className="flight-tracker-card__section">
              <h4>Departure Times</h4>
              <div className="flight-tracker-card__data-grid">
                {'scheduled_departure' in flight && flight.scheduled_departure ? (
                  <div className="flight-tracker-card__data-item">
                    <span className="flight-tracker-card__label">Scheduled Departure</span>
                    <span className="flight-tracker-card__value">
                      {flight.scheduled_departure as string}
                    </span>
                  </div>
                ) : null}
                {'gateDepartureTime' in flight && flight.gateDepartureTime ? (
                  <div className="flight-tracker-card__data-item">
                    <span className="flight-tracker-card__label">Gate Departure</span>
                    <span className="flight-tracker-card__value">
                      {flight.gateDepartureTime as string}
                    </span>
                  </div>
                ) : null}
                {'takeoffTime' in flight && flight.takeoffTime ? (
                  <div className="flight-tracker-card__data-item">
                    <span className="flight-tracker-card__label">Takeoff</span>
                    <span className="flight-tracker-card__value">
                      {flight.takeoffTime as string}
                    </span>
                  </div>
                ) : null}
                {'taxiOut' in flight && flight.taxiOut ? (
                  <div className="flight-tracker-card__data-item">
                    <span className="flight-tracker-card__label">Taxi Time</span>
                    <span className="flight-tracker-card__value">
                      {flight.taxiOut as string} minutes
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Flight Times - Arrival */}
          {(('landingTime' in flight && flight.landingTime) || 
            ('gateArrivalTime' in flight && flight.gateArrivalTime) || 
            ('scheduled_arrival' in flight && flight.scheduled_arrival)) ? (
            <div className="flight-tracker-card__section">
              <h4>Arrival Times</h4>
              <div className="flight-tracker-card__data-grid">
                {'scheduled_arrival' in flight && flight.scheduled_arrival ? (
                  <div className="flight-tracker-card__data-item">
                    <span className="flight-tracker-card__label">Scheduled Arrival</span>
                    <span className="flight-tracker-card__value">
                      {flight.scheduled_arrival as string}
                    </span>
                  </div>
                ) : null}
                {'landingTime' in flight && flight.landingTime ? (
                  <div className="flight-tracker-card__data-item">
                    <span className="flight-tracker-card__label">Landing</span>
                    <span className="flight-tracker-card__value">
                      {flight.landingTime as string}
                    </span>
                  </div>
                ) : null}
                {'gateArrivalTime' in flight && flight.gateArrivalTime ? (
                  <div className="flight-tracker-card__data-item">
                    <span className="flight-tracker-card__label">Gate Arrival</span>
                    <span className="flight-tracker-card__value">
                      {flight.gateArrivalTime as string}
                    </span>
                  </div>
                ) : null}
                {'taxiIn' in flight && flight.taxiIn ? (
                  <div className="flight-tracker-card__data-item">
                    <span className="flight-tracker-card__label">Taxi Time</span>
                    <span className="flight-tracker-card__value">
                      {flight.taxiIn as string} minutes
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Flight Progress with Visual Progress Bar */}
          {(('elapsedTime' in flight && flight.elapsedTime) || 
            ('remainingTime' in flight && flight.remainingTime) || 
            ('totalTravelTime' in flight && flight.totalTravelTime)) ? (
            <div className="flight-tracker-card__section">
              <h4>Flight Progress</h4>
              
              {/* FlightAware-style Progress Bar */}
              {'elapsedTime' in flight && 'remainingTime' in flight && flight.elapsedTime && flight.remainingTime ? (
                <div style={{ margin: '1rem 0' }}>
                  {(() => {
                    // Calculate progress percentage
                    const elapsed = 'elapsedTime' in flight ? flight.elapsedTime as string : null;
                    const remaining = 'remainingTime' in flight ? flight.remainingTime as string : null;
                    
                    // Parse time strings (e.g., "2h 14m")
                    const parseTime = (timeStr: string) => {
                      const hours = timeStr.match(/(\d+)h/);
                      const minutes = timeStr.match(/(\d+)m/);
                      return (hours ? parseInt(hours[1]) * 60 : 0) + (minutes ? parseInt(minutes[1]) : 0);
                    };
                    
                    const elapsedMinutes = elapsed ? parseTime(elapsed) : 0;
                    const remainingMinutes = remaining ? parseTime(remaining) : 0;
                    const totalMinutes = elapsedMinutes + remainingMinutes;
                    const progressPercentage = totalMinutes > 0 ? (elapsedMinutes / totalMinutes) * 100 : 0;
                    
                    // Determine flight status color
                    const isDelayed = 'status' in flight && flight.status && typeof flight.status === 'string' && flight.status.toLowerCase().includes('delay');
                    const isOnTime = !isDelayed && !flight.on_ground;
                    const trackColor = isDelayed ? '#ef4444' : isOnTime ? '#10b981' : '#6b7280';
                    
                    return (
                      <div className="flight-progress-container">
                        {/* Progress Track */}
                        <div style={{ 
                          position: 'relative', 
                          background: 'rgba(255,255,255,0.1)', 
                          borderRadius: '15px', 
                          height: '30px', 
                          overflow: 'visible',
                          border: '2px solid rgba(255,255,255,0.2)'
                        }}>
                          {/* Track Marker (start) */}
                          <span style={{
                            position: 'absolute',
                            left: '0',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '8px',
                            height: '8px',
                            background: '#60a5fa',
                            borderRadius: '50%',
                            zIndex: 3
                          }}>&nbsp;</span>
                          
                          {/* Progress Completed */}
                          <div 
                            style={{ 
                              width: `${Math.min(progressPercentage, 100)}%`, 
                              height: '100%', 
                              background: `linear-gradient(90deg, ${trackColor}, ${trackColor}dd)`,
                              borderRadius: '13px',
                              position: 'relative',
                              transition: 'width 0.8s ease'
                            }}
                          >
                            {/* Airplane SVG Icon */}
                            {!flight.on_ground && progressPercentage > 5 && (
                              <div style={{
                                position: 'absolute',
                                right: '-12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 4
                              }}>
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  viewBox="0 0 25 26" 
                                  width="24px" 
                                  height="26px"
                                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                                >
                                  <defs>
                                    <style>{`.cls-1{fill:${trackColor};}.cls-2{fill:${trackColor};}`}</style>
                                  </defs>
                                  <g>
                                    <g>
                                      <path className="cls-1" d="M12.51,25.75c-.26,0-.74-.71-.86-1.41l-3.33.86L8,25.29l.08-1.41.11-.07c1.13-.68,2.68-1.64,3.2-2-.37-1.06-.51-3.92-.43-8.52v0L8,13.31C5.37,14.12,1.2,15.39,1,15.5a.5.5,0,0,1-.21,0,.52.52,0,0,1-.49-.45,1,1,0,0,1,.52-1l1.74-.91c1.36-.71,3.22-1.69,4.66-2.43a4,4,0,0,1,0-.52c0-.69,0-1,0-1.14l.25-.13H7.16A1.07,1.07,0,0,1,8.24,7.73,1.12,1.12,0,0,1,9.06,8a1.46,1.46,0,0,1,.26.87L9.08,9h.25c0,.14,0,.31,0,.58l1.52-.84c0-1.48,0-7.06,1.1-8.25a.74.74,0,0,1,1.13,0c1.15,1.19,1.13,6.78,1.1,8.25l1.52.84c0-.32,0-.48,0-.58l.25-.13H15.7A1.46,1.46,0,0,1,16,8a1.11,1.11,0,0,1,.82-.28,1.06,1.06,0,0,1,1.08,1.16V9c0,.19,0,.48,0,1.17a4,4,0,0,1,0,.52c1.75.9,4.4,2.29,5.67,3l.73.38a.9.9,0,0,1,.5,1,.55.55,0,0,1-.5.47h0l-.11,0c-.28-.11-4.81-1.49-7.16-2.2H14.06v0c.09,4.6-.06,7.46-.43,8.52.52.33,2.07,1.29,3.2,2l.11.07L17,25.29l-.33-.09-3.33-.86c-.12.7-.6,1.41-.86,1.41h0Z"></path>
                                      <path className="cls-2" d="M12.51.5C13.93.5,14,7,13.93,8.91c.3.16,1.64.91,2,1.1,0-.6,0-.85,0-1s0-.09,0-.13a1.18,1.18,0,0,1,.19-.7A.88.88,0,0,1,16.78,8h0a.82.82,0,0,1,.83.91s0,.07,0,.13,0,.44,0,1.17a3.21,3.21,0,0,1-.06.66c2.33,1.19,6.51,3.39,6.56,3.42.59.3.4,1,.11,1h-.07c-.37-.14-7.18-2.21-7.18-2.21l-3.18,0c0,.22.22,7.56-.48,8.91,0,0,2,1.26,3.39,2.08l.06.93L13.15,24a2.14,2.14,0,0,1-.64,1.47A2.14,2.14,0,0,1,11.87,24L8.26,25,8.31,24c1.38-.82,3.39-2.08,3.39-2.08-.7-1.35-.48-8.69-.48-8.91L8,13.06S1.17,15.13.86,15.27l-.11,0c-.32,0-.43-.73.14-1S5.13,12,7.46,10.85a3.21,3.21,0,0,1-.06-.66c0-.73,0-1,0-1.17s0-.09,0-.13A.82.82,0,0,1,8.24,8h0a.88.88,0,0,1,.65.21,1.18,1.18,0,0,1,.19.7s0,.07,0,.13,0,.39,0,1c.36-.19,1.71-.94,2-1.1C11.05,7,11.09.5,12.51.5m0-.5a1,1,0,0,0-.74.34c-1.16,1.2-1.2,6.3-1.18,8.28L10,8.93l-.46.25V8.91a1.68,1.68,0,0,0-.33-1.06,1.34,1.34,0,0,0-1-.36,1.31,1.31,0,0,0-1.33,1.4V9h0v0c0,.16,0,.46,0,1.14,0,.13,0,.26,0,.38l-4.5,2.35-1.74.91A1.2,1.2,0,0,0,0,15.15a.77.77,0,0,0,.73.64.74.74,0,0,0,.31-.07c.29-.12,4.35-1.35,7-2.17l2.6,0c-.1,5.54.17,7.46.38,8.2-.64.4-2,1.25-3,1.86l-.22.13,0,.26-.06.93,0,.81.7-.31,3.06-.79c.19.67.63,1.35,1,1.35s.86-.68,1-1.35l3.06.79.7.31,0-.81L17.2,24l0-.26L17,23.6c-1-.61-2.4-1.47-3-1.86.21-.74.48-2.66.38-8.2l2.6,0c2.72.83,6.81,2.07,7.07,2.18a.68.68,0,0,0,.25,0,.79.79,0,0,0,.74-.67,1.15,1.15,0,0,0-.63-1.29l-.71-.37c-1.23-.65-3.78-2-5.53-2.88,0-.12,0-.25,0-.38,0-.67,0-1,0-1.14h0V8.92a1.32,1.32,0,0,0-1.32-1.44,1.35,1.35,0,0,0-1,.36,1.67,1.67,0,0,0-.33,1V9h0v.22L15,8.93l-.57-.32c0-2,0-7.08-1.18-8.28A1,1,0,0,0,12.51,0Z"></path>
                                    </g>
                                  </g>
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* End Marker */}
                          <span style={{
                            position: 'absolute',
                            right: '0',
                            top: '50%',
                            transform: 'translate(50%, -50%)',
                            width: '8px',
                            height: '8px',
                            background: '#60a5fa',
                            borderRadius: '50%',
                            zIndex: 3
                          }}>&nbsp;</span>
                        </div>
                        
                        {/* Progress Labels */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '0.75rem',
                          fontSize: '0.875rem'
                        }}>
                          <span style={{ color: '#60a5fa', fontWeight: '600' }}>
                            <strong>{elapsed || 'N/A'}</strong> elapsed
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                            <strong>{('totalTravelTime' in flight && flight.totalTravelTime) ? String(flight.totalTravelTime) : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}</strong> total
                          </span>
                          <span style={{ color: '#60a5fa', fontWeight: '600' }}>
                            <strong>{remaining || 'N/A'}</strong> remaining
                          </span>
                        </div>
                        
                        {/* Distance Labels */}
                        {(('flownDistance' in flight && flight.flownDistance) || ('remainingDistance' in flight && flight.remainingDistance)) ? (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '0.5rem',
                            fontSize: '0.8rem',
                            color: 'rgba(255,255,255,0.6)'
                          }}>
                            {'flownDistance' in flight && flight.flownDistance ? (
                              <span>
                                <strong>{typeof flight.flownDistance === 'number' 
                                  ? flight.flownDistance.toLocaleString()
                                  : String(flight.flownDistance)} mi</strong> flown
                              </span>
                            ) : null}
                            {'remainingDistance' in flight && flight.remainingDistance ? (
                              <span>
                                <strong>{typeof flight.remainingDistance === 'number'
                                  ? flight.remainingDistance.toLocaleString()
                                  : String(flight.remainingDistance)} mi</strong> to go
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>
              ) : null}
              
              <div className="flight-tracker-card__data-grid">
                {'elapsedTime' in flight && flight.elapsedTime ? (
                  <div className="flight-tracker-card__data-item">
                    <span className="flight-tracker-card__label">Elapsed Time</span>
                    <span className="flight-tracker-card__value">
                      {flight.elapsedTime as string}
                    </span>
                  </div>
                ) : null}
                {'remainingTime' in flight && flight.remainingTime ? (
                  <div className="flight-tracker-card__data-item">
                    <span className="flight-tracker-card__label">Remaining Time</span>
                    <span className="flight-tracker-card__value">
                      {flight.remainingTime as string}
                    </span>
                  </div>
                ) : null}
                {'totalTravelTime' in flight && flight.totalTravelTime ? (
                  <div className="flight-tracker-card__data-item">
                    <span className="flight-tracker-card__label">Total Travel Time</span>
                    <span className="flight-tracker-card__value">
                      {flight.totalTravelTime as string}
                    </span>
                  </div>
                ) : null}
                {'flownDistance' in flight && flight.flownDistance ? (
                  <div className="flight-tracker-card__data-item">
                    <span className="flight-tracker-card__label">Distance Flown</span>
                    <span className="flight-tracker-card__value">
                      {String(flight.flownDistance)} miles
                    </span>
                  </div>
                ) : null}
                {'remainingDistance' in flight && flight.remainingDistance ? (
                  <div className="flight-tracker-card__data-item">
                    <span className="flight-tracker-card__label">Distance Remaining</span>
                    <span className="flight-tracker-card__value">
                      {String(flight.remainingDistance)} miles
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Flight Route Information - FlightAware Data */}
          {'route' in flight && flight.route ? (
            <div className="flight-tracker-card__section">
              <h4>Flight Route</h4>
              <div className="flight-tracker-card__data-item">
                <span className="flight-tracker-card__label">Route</span>
                <span className="flight-tracker-card__value" style={{ fontFamily: 'monospace' }}>
                  {flight.route as string}
                </span>
              </div>
              {'distance' in flight && flight.distance ? (
                <div className="flight-tracker-card__data-item">
                  <span className="flight-tracker-card__label">Distance</span>
                  <span className="flight-tracker-card__value">
                    {typeof flight.distance === 'number' 
                      ? `${flight.distance} miles` 
                      : flight.distance}
                  </span>
                </div>
              ) : null}
              {'duration' in flight && flight.duration ? (
                <div className="flight-tracker-card__data-item">
                  <span className="flight-tracker-card__label">Flight Time</span>
                  <span className="flight-tracker-card__value">
                    {typeof flight.duration === 'object' && flight.duration !== null && 'hours' in flight.duration && 'minutes' in flight.duration
                      ? `${flight.duration.hours}h ${flight.duration.minutes}m`
                      : flight.duration}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Flight Status */}
          <div className="flight-tracker-card__section">
            <h4>Flight Status</h4>
            <div className="flight-tracker-card__data-grid">
              <div className="flight-tracker-card__data-item">
                <span className="flight-tracker-card__label">Status</span>
                <span className="flight-tracker-card__value">
                  {('status' in flight && flight.status) ? flight.status as string : (flight.on_ground ? '🛬 On Ground' : '✈️ In Flight')}
                </span>
              </div>
              
              {'flightProgressStatus' in flight && flight.flightProgressStatus ? (
                <div className="flight-tracker-card__data-item">
                  <span className="flight-tracker-card__label">Progress</span>
                  <span className="flight-tracker-card__value">
                    {flight.flightProgressStatus as string}
                  </span>
                </div>
              ) : null}

              {'flightProgressTimeRemaining' in flight && flight.flightProgressTimeRemaining ? (
                <div className="flight-tracker-card__data-item">
                  <span className="flight-tracker-card__label">ETA</span>
                  <span className="flight-tracker-card__value">
                    {flight.flightProgressTimeRemaining as string}
                  </span>
                </div>
              ) : null}
              
              <div className="flight-tracker-card__data-item">
                <span className="flight-tracker-card__label">Last Contact</span>
                <span className="flight-tracker-card__value">
                  {formatTimeSince(flight.last_contact)}
                </span>
              </div>

              {'averageDelay' in flight && flight.averageDelay ? (
                <div className="flight-tracker-card__data-item">
                  <span className="flight-tracker-card__label">Average Delay</span>
                  <span className="flight-tracker-card__value">
                    {flight.averageDelay as string}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Delay Information */}
            {('isMockData' in flight && flight.isMockData && 'mockReason' in flight && flight.mockReason) ? (
              <div style={{ 
                background: 'rgba(255, 193, 7, 0.2)', 
                border: '1px solid rgba(255, 193, 7, 0.5)',
                borderRadius: '0.5rem', 
                padding: '0.75rem', 
                marginTop: '1rem',
                fontSize: '0.875rem',
                color: '#ffc107'
              }}>
                <strong>📍 Demo Data:</strong> {flight.mockReason as string}
              </div>
            ) : null}
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

              {'plannedSpeed' in flight && flight.plannedSpeed ? (
                <div className="flight-tracker-card__data-item">
                  <span className="flight-tracker-card__label">Planned Speed</span>
                  <span className="flight-tracker-card__value">
                    {flight.plannedSpeed} mph
                  </span>
                </div>
              ) : null}

              {'plannedAltitude' in flight && flight.plannedAltitude ? (
                <div className="flight-tracker-card__data-item">
                  <span className="flight-tracker-card__label">Planned Altitude</span>
                  <span className="flight-tracker-card__value">
                    {flight.plannedAltitude.toLocaleString()} ft
                  </span>
                </div>
              ) : null}
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