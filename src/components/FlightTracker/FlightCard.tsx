'use client'

import React, { useEffect, useRef, memo, useState } from 'react'
import Image from 'next/image'
import { Glass } from './Glass'
import { gsap } from 'gsap'
import { Flight } from './types'
import { getAirlineLogo } from './utils/aircraftImage'

interface FlightCardProps {
  flight: Flight
  onClose: () => void
}

const FlightCardComponent: React.FC<FlightCardProps> = ({ flight, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [airlineLogo, setAirlineLogo] = useState<string | null>(null)
  const [flightDetails, setFlightDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' }
      )
    }
  }, [])

  // Get airline logo
  useEffect(() => {
    const logo = getAirlineLogo(
      flight.airline,
      flight.airline_iata,
      flight.airline_icao
    )
    setAirlineLogo(logo)
  }, [flight.airline, flight.airline_iata, flight.airline_icao])

  // Fetch FlightAware details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!flight.callsign) return
      
      setLoadingDetails(true)
      try {
        const response = await fetch(`/api/flights/flightaware?callsign=${flight.callsign}`)
        if (response.ok) {
          const data = await response.json()
          setFlightDetails(data)
        }
      } catch (error) {
        console.error('Error fetching flight details:', error)
      } finally {
        setLoadingDetails(false)
      }
    }
    
    fetchDetails()
  }, [flight.callsign])

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

  // Utility helpers
  const getDepartureCode = () => {
    if (flight.originAirport && typeof flight.originAirport === 'object') {
      return flight.originAirport.iata || flight.originAirport.icao
    }
    if (flight.departureAirport && typeof flight.departureAirport === 'string') {
      const match = flight.departureAirport.match(/\(([A-Z]{3,4})\)/)
      if (match) return match[1]
    }
    return 'DEP'
  }

  const getArrivalCode = () => {
    if (flight.destinationAirport && typeof flight.destinationAirport === 'object') {
      return flight.destinationAirport.iata || flight.destinationAirport.icao
    }
    if (flight.arrivalAirport && typeof flight.arrivalAirport === 'string') {
      const match = flight.arrivalAirport.match(/\(([A-Z]{3,4})\)/)
      if (match) return match[1]
    }
    return 'ARR'
  }

  const formatAltitude = (alt: number | null) =>
    alt ? `${Math.round(alt * 3.28084).toLocaleString()} ft` : 'N/A'
  const formatSpeed = (vel: number | null) =>
    vel ? `${Math.round(vel * 2.23694)} mph` : 'N/A'
  const formatHeading = (track: number | null) => {
    if (track === null || track === undefined) return 'N/A'
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(track / 45) % 8
    return `${Math.round(track)}° ${directions[index]}`
  }

  // Calculate progress
  const calculateProgress = () => {
    if (!flight.originAirport || !flight.destinationAirport) return null
    if (typeof flight.originAirport !== 'object' || typeof flight.destinationAirport !== 'object') return null
    
    const R = 3959 // Earth's radius in miles
    const lat1 = (flight.originAirport.latitude * Math.PI) / 180
    const lat2 = (flight.destinationAirport.latitude * Math.PI) / 180
    const deltaLat = ((flight.destinationAirport.latitude - flight.originAirport.latitude) * Math.PI) / 180
    const deltaLon = ((flight.destinationAirport.longitude - flight.originAirport.longitude) * Math.PI) / 180

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const totalDistance = Math.round(R * c)
    
    // Calculate distance from current position to destination
    const lat3 = (flight.latitude * Math.PI) / 180
    const deltaLat2 = ((flight.destinationAirport.latitude - flight.latitude) * Math.PI) / 180
    const deltaLon2 = ((flight.destinationAirport.longitude - flight.longitude) * Math.PI) / 180
    
    const a2 = Math.sin(deltaLat2 / 2) * Math.sin(deltaLat2 / 2) +
      Math.cos(lat3) * Math.cos(lat2) * Math.sin(deltaLon2 / 2) * Math.sin(deltaLon2 / 2)
    const c2 = 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2))
    const remainingDistance = Math.round(R * c2)
    
    const flownDistance = totalDistance - remainingDistance
    const progress = (flownDistance / totalDistance) * 100

    return { totalDistance, flownDistance, remainingDistance, progress }
  }

  const progress = calculateProgress()

  return (
    <Glass ref={cardRef} className="flight-tracker-card" variant="card" rounded="md">
      <div className="flight-tracker-card__header">
        <div className="flight-tracker-card__title">
          <h3>{flight.callsign || flight.icao24}</h3>
          {flight.airline && <span className="flight-tracker-card__subtitle">{flight.airline}</span>}
        </div>
        <button className="flight-tracker-card__close" onClick={handleClose} aria-label="Close">
          &times;
        </button>
      </div>
      
      <div className="flight-tracker-card__body">
        {/* Route Information */}
        <div className="flight-tracker-card__section flight-tracker-card__section--flex">
          <div className="flight-tracker-card__info">
            <div className="flight-tracker-card__route">
              <div className="flight-tracker-card__airport">
                <span className="flight-tracker-card__airport-code">{getDepartureCode()}</span>
                {flight.originAirport && typeof flight.originAirport === 'object' && (
                  <span className="flight-tracker-card__airport-city">
                    {flight.originAirport.city}
                  </span>
                )}
              </div>
              <div className="flight-tracker-card__route-arrow">→</div>
              <div className="flight-tracker-card__airport">
                <span className="flight-tracker-card__airport-code">{getArrivalCode()}</span>
                {flight.destinationAirport && typeof flight.destinationAirport === 'object' && (
                  <span className="flight-tracker-card__airport-city">
                    {flight.destinationAirport.city}
                  </span>
                )}
              </div>
            </div>
          </div>
          {airlineLogo && (
            <div className="flight-tracker-card__logo">
              <Image 
                src={airlineLogo} 
                alt={flight.airline || 'Airline'} 
                width={64} 
                height={64} 
                unoptimized 
              />
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="flight-tracker-card__section">
            <div className="flight-tracker-card__progress">
              <div className="flight-tracker-card__progress-labels">
                <span>{progress.flownDistance} mi flown</span>
                <span>{progress.remainingDistance} mi to go</span>
              </div>
              <div className="flight-tracker-card__progress-bar">
                <div 
                  className="flight-tracker-card__progress-fill" 
                  style={{ width: `${Math.min(100, Math.max(0, progress.progress))}%` }}
                >
                  <span className="flight-tracker-card__progress-plane">✈</span>
                </div>
              </div>
              <div className="flight-tracker-card__progress-info">
                <span>Total: {progress.totalDistance} mi</span>
              </div>
            </div>
          </div>
        )}

        {/* FlightAware Details - Departure & Arrival Times */}
        {flightDetails && !loadingDetails && (
          <>
            {/* Departure Times */}
            {(flightDetails.gateDepartureTime || flightDetails.takeoffTime) && (
              <div className="flight-tracker-card__section">
                <h4>Departure Times</h4>
                <div className="flight-tracker-card__data-grid">
                  {flightDetails.gateDepartureTime && (
                    <div className="flight-tracker-card__data-item">
                      <span className="flight-tracker-card__label">Gate Departure</span>
                      <span className="flight-tracker-card__value">
                        {flightDetails.gateDepartureTime}
                      </span>
                      {flightDetails.scheduled_departure && (
                        <span className="flight-tracker-card__subvalue">
                          Scheduled: {flightDetails.scheduled_departure}
                        </span>
                      )}
                    </div>
                  )}
                  {flightDetails.takeoffTime && (
                    <div className="flight-tracker-card__data-item">
                      <span className="flight-tracker-card__label">Takeoff</span>
                      <span className="flight-tracker-card__value">
                        {flightDetails.takeoffTime}
                      </span>
                    </div>
                  )}
                  {flightDetails.taxiOut && (
                    <div className="flight-tracker-card__data-item">
                      <span className="flight-tracker-card__label">Taxi Time</span>
                      <span className="flight-tracker-card__value">{flightDetails.taxiOut} minutes</span>
                    </div>
                  )}
                  {flightDetails.departureGate && (
                    <div className="flight-tracker-card__data-item">
                      <span className="flight-tracker-card__label">Gate</span>
                      <span className="flight-tracker-card__value">{flightDetails.departureGate}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Arrival Times */}
            {(flightDetails.landingTime || flightDetails.gateArrivalTime) && (
              <div className="flight-tracker-card__section">
                <h4>Arrival Times</h4>
                <div className="flight-tracker-card__data-grid">
                  {flightDetails.landingTime && (
                    <div className="flight-tracker-card__data-item">
                      <span className="flight-tracker-card__label">Landing</span>
                      <span className="flight-tracker-card__value">
                        {flightDetails.landingTime}
                      </span>
                      {flightDetails.scheduled_arrival && (
                        <span className="flight-tracker-card__subvalue">
                          Scheduled: {flightDetails.scheduled_arrival}
                        </span>
                      )}
                    </div>
                  )}
                  {flightDetails.gateArrivalTime && (
                    <div className="flight-tracker-card__data-item">
                      <span className="flight-tracker-card__label">Gate Arrival</span>
                      <span className="flight-tracker-card__value">
                        {flightDetails.gateArrivalTime}
                      </span>
                    </div>
                  )}
                  {flightDetails.taxiIn && (
                    <div className="flight-tracker-card__data-item">
                      <span className="flight-tracker-card__label">Taxi Time</span>
                      <span className="flight-tracker-card__value">{flightDetails.taxiIn} minutes</span>
                    </div>
                  )}
                  {flightDetails.arrivalGate && (
                    <div className="flight-tracker-card__data-item">
                      <span className="flight-tracker-card__label">Gate</span>
                      <span className="flight-tracker-card__value">{flightDetails.arrivalGate}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Flight Progress Times */}
            {(flightDetails.elapsedTime || flightDetails.remainingTime || flightDetails.totalTravelTime) && (
              <div className="flight-tracker-card__section">
                <h4>Flight Progress</h4>
                <div className="flight-tracker-card__data-grid">
                  {flightDetails.elapsedTime && (
                    <div className="flight-tracker-card__data-item">
                      <span className="flight-tracker-card__label">Elapsed</span>
                      <span className="flight-tracker-card__value">{flightDetails.elapsedTime}</span>
                    </div>
                  )}
                  {flightDetails.remainingTime && (
                    <div className="flight-tracker-card__data-item">
                      <span className="flight-tracker-card__label">Remaining</span>
                      <span className="flight-tracker-card__value">{flightDetails.remainingTime}</span>
                    </div>
                  )}
                  {flightDetails.totalTravelTime && (
                    <div className="flight-tracker-card__data-item">
                      <span className="flight-tracker-card__label">Total Time</span>
                      <span className="flight-tracker-card__value">{flightDetails.totalTravelTime}</span>
                    </div>
                  )}
                  {flightDetails.averageDelay && (
                    <div className="flight-tracker-card__data-item">
                      <span className="flight-tracker-card__label">Average Delay</span>
                      <span className="flight-tracker-card__value">{flightDetails.averageDelay}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {loadingDetails && (
          <div className="flight-tracker-card__section">
            <div className="flight-tracker-card__loading">
              <span className="flight-tracker-card__loading-spinner"></span>
              Loading flight details...
            </div>
          </div>
        )}

        {/* Weather Information */}
        {(flight.weatherOrigin || flight.weatherDestination) && (
          <div className="flight-tracker-card__section">
            <h4>Weather</h4>
            <div className="flight-tracker-card__data-grid">
              {flight.weatherOrigin && (
                <div className="flight-tracker-card__data-item">
                  <span className="flight-tracker-card__label">Origin ({getDepartureCode()})</span>
                  <span className="flight-tracker-card__value">
                    {flight.weatherOrigin.temp}°F, {flight.weatherOrigin.description}
                    {flight.weatherOrigin.icon && (
                      <Image 
                        src={`https://openweathermap.org/img/wn/${flight.weatherOrigin.icon}.png`}
                        alt={flight.weatherOrigin.description}
                        width={24}
                        height={24}
                        style={{ display: 'inline-block', marginLeft: 8 }}
                        unoptimized
                      />
                    )}
                  </span>
                </div>
              )}
              {flight.weatherDestination && (
                <div className="flight-tracker-card__data-item">
                  <span className="flight-tracker-card__label">Destination ({getArrivalCode()})</span>
                  <span className="flight-tracker-card__value">
                    {flight.weatherDestination.temp}°F, {flight.weatherDestination.description}
                    {flight.weatherDestination.icon && (
                      <Image 
                        src={`https://openweathermap.org/img/wn/${flight.weatherDestination.icon}.png`}
                        alt={flight.weatherDestination.description}
                        width={24}
                        height={24}
                        style={{ display: 'inline-block', marginLeft: 8 }}
                        unoptimized
                      />
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flight Metrics */}
        <div className="flight-tracker-card__section">
          <h4>Flight Metrics</h4>
          <div className="flight-tracker-card__data-grid">
            <div className="flight-tracker-card__data-item">
              <span className="flight-tracker-card__label">Altitude</span>
              <span className="flight-tracker-card__value">{formatAltitude(flight.baro_altitude)}</span>
            </div>
            <div className="flight-tracker-card__data-item">
              <span className="flight-tracker-card__label">Speed</span>
              <span className="flight-tracker-card__value">{formatSpeed(flight.velocity)}</span>
            </div>
            <div className="flight-tracker-card__data-item">
              <span className="flight-tracker-card__label">Heading</span>
              <span className="flight-tracker-card__value">{formatHeading(flight.true_track)}</span>
            </div>
            <div className="flight-tracker-card__data-item">
              <span className="flight-tracker-card__label">Vertical Rate</span>
              <span className="flight-tracker-card__value">
                {flight.vertical_rate ? `${Math.round(flight.vertical_rate * 196.85)} fpm` : 'Level'}
              </span>
            </div>
            <div className="flight-tracker-card__data-item">
              <span className="flight-tracker-card__label">Status</span>
              <span className="flight-tracker-card__value">
                {flight.on_ground ? 'On Ground' : 'Airborne'}
              </span>
            </div>
          </div>
        </div>

        {/* Technical Information */}
        <div className="flight-tracker-card__section">
          <h4>Technical Information</h4>
          <div className="flight-tracker-card__data-grid">
            <div className="flight-tracker-card__data-item">
              <span className="flight-tracker-card__label">ICAO24</span>
              <span className="flight-tracker-card__value">{flight.icao24}</span>
            </div>
            <div className="flight-tracker-card__data-item">
              <span className="flight-tracker-card__label">Squawk</span>
              <span className="flight-tracker-card__value">{flight.squawk || 'N/A'}</span>
            </div>
            {flight.aircraft && (
              <div className="flight-tracker-card__data-item">
                <span className="flight-tracker-card__label">Aircraft</span>
                <span className="flight-tracker-card__value">{flight.aircraft}</span>
              </div>
            )}
            {flight.registration && (
              <div className="flight-tracker-card__data-item">
                <span className="flight-tracker-card__label">Registration</span>
                <span className="flight-tracker-card__value">{flight.registration}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Glass>
  )
}

export const FlightCard = memo(
  FlightCardComponent,
  (prevProps, nextProps) =>
    prevProps.flight.icao24 === nextProps.flight.icao24 &&
    prevProps.onClose === nextProps.onClose &&
    prevProps.flight.callsign === nextProps.flight.callsign
)

export default FlightCard
