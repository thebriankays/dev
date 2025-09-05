import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getFlightPath } from '@/utils/flight-calculations'

// Helper to parse time strings like "2h 30m" to minutes
function parseTimeString(timeStr: string): number | null {
  if (!timeStr) return null
  const match = timeStr.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/i)
  if (!match) return null
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  return hours * 60 + minutes
}

interface FlightData {
  icao24: string
  callsign?: string | null
  [key: string]: unknown
}

interface AirlineData {
  name?: string
  iata?: string
  icao?: string
  [key: string]: unknown
}

interface FlightAwareData {
  departureAirport?: string
  destinationAirport?: string
  route?: string
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  try {
    const { flights } = await request.json()
    
    if (!flights || !Array.isArray(flights)) {
      return NextResponse.json({ error: 'Flights array required' }, { status: 400 })
    }
    
    const payload = await getPayload({ config })
    
    // Enrich flight data with airline info and FlightAware data for first 10 flights (reduced for performance)
    const enrichedFlights = await Promise.all(
      flights.slice(0, 10).map(async (flight: FlightData) => {
        try {
          // Get airline from callsign
          let airline: AirlineData | null = null
          if (flight.callsign) {
            const airlineCode = flight.callsign.slice(0, 3)
            
            // Try ICAO code first
            const icaoResult = await payload.find({
              collection: 'airlines',
              where: {
                icao: {
                  equals: airlineCode,
                },
              },
              limit: 1,
            })
            
            if (icaoResult.docs.length > 0) {
              airline = icaoResult.docs[0] as unknown as AirlineData
            } else {
              // Try IATA code
              const iataCode = airlineCode.slice(0, 2)
              const iataResult = await payload.find({
                collection: 'airlines',
                where: {
                  iata: {
                    equals: iataCode,
                  },
                },
                limit: 1,
              })
              
              if (iataResult.docs.length > 0) {
                airline = iataResult.docs[0] as unknown as AirlineData
              }
            }
          }
          
          // Get FlightAware scraped data if we have a valid callsign
          // This calls our internal scraper that scrapes FlightAware's website
          let flightAwareData: FlightAwareData = {}
          if (flight.callsign && flight.callsign.trim() && flight.callsign !== 'N/A') {
            try {
              const flightAwareResponse = await fetch(`${request.nextUrl.origin}/api/flights/flightaware?callsign=${encodeURIComponent(flight.callsign.trim())}`)
              if (flightAwareResponse.ok) {
                const faData = await flightAwareResponse.json()
                if (faData && !faData.error) {
                  flightAwareData = {
                    // Basic flight info
                    departureAirport: faData.departureAirport,
                    destinationAirport: faData.destinationAirport,
                    route: faData.route,
                    aircraft: faData.aircraft,
                    registration: faData.registration,
                    status: faData.status,
                    
                    // Gate information
                    departureGate: faData.departureGate,
                    arrivalGate: faData.arrivalGate,
                    
                    // Distance and duration
                    distance: faData.distance,
                    duration: faData.duration,
                    
                    // Departure times
                    scheduled_departure: faData.scheduled_departure,
                    gateDepartureTime: faData.gateDepartureTime,
                    takeoffTime: faData.takeoffTime,
                    actual_departure: faData.actual_departure,
                    
                    // Arrival times  
                    scheduled_arrival: faData.scheduled_arrival,
                    landingTime: faData.landingTime,
                    gateArrivalTime: faData.gateArrivalTime,
                    
                    // Progress and status
                    elapsedTime: faData.elapsedTime,
                    remainingTime: faData.remainingTime,
                    totalTravelTime: faData.totalTravelTime,
                    flownDistance: faData.flownDistance,
                    remainingDistance: faData.remainingDistance,
                    
                    // Flight status details
                    flightProgressStatus: faData.flightProgressStatus,
                    flightProgressTimeRemaining: faData.flightProgressTimeRemaining,
                    
                    // Taxi times and delays
                    taxiOut: faData.taxiOut,
                    taxiIn: faData.taxiIn,
                    averageDelay: faData.averageDelay,
                    
                    // Additional metadata
                    friendlyFlightIdentifier: faData.friendlyFlightIdentifier,
                    callsign: faData.callsign,
                    iataCode: faData.iataCode,
                    airlineLogoUrl: faData.airlineLogoUrl,
                    
                    // City and state info
                    departureCity: faData.departureCity,
                    departureState: faData.departureState,
                    arrivalCity: faData.arrivalCity,
                    arrivalState: faData.arrivalState,
                    
                    // Airport codes
                    departureAirportCode: faData.departureAirportCode,
                    arrivalAirportCode: faData.arrivalAirportCode,
                    
                    // Aircraft details
                    aircraftImage: faData.aircraftImage,
                    plannedSpeed: faData.plannedSpeed,
                    plannedAltitude: faData.plannedAltitude,
                    
                    // Mock data flag (if present)
                    isMockData: faData.isMockData,
                    mockReason: faData.mockReason
                  }
                }
              }
            } catch (_faError) {
              console.log('FlightAware scraping failed for', flight.callsign, '- continuing without route data')
            }
          }
          
          // Smart calculations if we have departure and arrival codes
          let smartCalculations: Record<string, unknown> = {}
          if (flightAwareData.departureAirportCode && flightAwareData.arrivalAirportCode) {
            try {
              // Get cached flight path or calculate new one
              const flightPath = await getFlightPath(
                flightAwareData.departureAirportCode as string,
                flightAwareData.arrivalAirportCode as string,
                payload
              )
              
              if (flightPath) {
                smartCalculations = {
                  calculatedDistance: flightPath.distance,
                  calculatedDuration: `${flightPath.duration.hours}h ${flightPath.duration.minutes}m`,
                  flightPath: flightPath.path,
                  calculatedHeading: flightPath.heading,
                  estimatedCruiseAltitude: flightPath.cruiseAltitude
                }
                
                // If we don't have actual values, use calculated ones
                if (!flightAwareData.distance) {
                  flightAwareData.distance = flightPath.distance
                }
                if (!flightAwareData.duration) {
                  flightAwareData.duration = `${flightPath.duration.hours}h ${flightPath.duration.minutes}m`
                }
                if (!flightAwareData.plannedAltitude) {
                  flightAwareData.plannedAltitude = flightPath.cruiseAltitude
                }
              }
            } catch (calcError) {
              console.log('Smart calculation error:', calcError)
            }
          }
          
          // Estimate remaining time if we have elapsed time and total duration
          if (flightAwareData.elapsedTime && !flightAwareData.remainingTime) {
            try {
              const elapsed = parseTimeString(flightAwareData.elapsedTime as string)
              const total = flightAwareData.duration || smartCalculations.calculatedDuration
              if (elapsed && total) {
                const totalMinutes = typeof total === 'string' ? parseTimeString(total) : (total.hours * 60 + total.minutes)
                if (totalMinutes) {
                  const remaining = totalMinutes - elapsed
                  if (remaining > 0) {
                    flightAwareData.remainingTime = `${Math.floor(remaining / 60)}h ${remaining % 60}m`
                  }
                }
              }
            } catch (_) {}
          }
          
          return {
            ...flight,
            airline: airline?.name,
            airline_iata: airline?.iata,
            airline_icao: airline?.icao,
            ...flightAwareData,
            ...smartCalculations
          }
        } catch (error) {
          console.error('Error enriching flight:', flight.icao24, error)
          return flight
        }
      })
    )
    
    // Merge enriched flights with remaining flights
    const remainingFlights = flights.slice(10)
    const allFlights = [...enrichedFlights, ...remainingFlights]
    
    return NextResponse.json({ flights: allFlights })
  } catch (error) {
    console.error('Error enriching flights:', error)
    return NextResponse.json({ error: 'Failed to enrich flight data' }, { status: 500 })
  }
}
