import { NextRequest, NextResponse } from 'next/server'
import { getOpenFlightsService } from '@/data/openflights/service'

// Fallback to HexDB if OpenFlights data not available
import {
  getAirlineFromCallsign as getAirlineData,
  getAirlineFromCallsignPrefix,
} from '@/lib/hexdb'

export async function POST(request: NextRequest) {
  try {
    const { flights } = await request.json()
    
    if (!flights || !Array.isArray(flights)) {
      return NextResponse.json({ error: 'Flights array required' }, { status: 400 })
    }
    
    // Try to get OpenFlights service
    let openFlightsService: any = null
    try {
      openFlightsService = getOpenFlightsService()
      console.log('OpenFlights data loaded:', openFlightsService.getStats())
    } catch (error) {
      console.log('OpenFlights data not available, falling back to HexDB')
    }
    
    // Enrich flight data with airline info for the first 30 flights (more capacity with local data)
    const enrichedFlights = await Promise.all(
      flights.slice(0, 30).map(async (flight: any) => {
        try {
          // Try OpenFlights first (faster, no API call)
          if (openFlightsService && flight.callsign) {
            const enriched = openFlightsService.enrichFlight(flight)
            if (enriched.airline) {
              return enriched
            }
          }
          
          // Fallback to HexDB
          let airline = null
          if (flight.callsign) {
            airline = await getAirlineData(flight.callsign)
            if (!airline) {
              // Fallback to prefix lookup
              const fallbackAirline = getAirlineFromCallsignPrefix(flight.callsign)
              if (fallbackAirline) {
                airline = {
                  name: fallbackAirline.name,
                  iata: fallbackAirline.iata,
                }
              }
            }
          }
          
          return {
            ...flight,
            airline: airline?.name || flight.airline,
            airline_iata: airline?.iata || flight.airline_iata,
          }
        } catch (error) {
          console.error('Error enriching flight:', flight.icao24, error)
          return flight
        }
      })
    )
    
    // Process remaining flights with OpenFlights if available
    const remainingFlights = flights.slice(30).map((flight: any) => {
      if (openFlightsService && flight.callsign) {
        return openFlightsService.enrichFlight(flight)
      }
      return flight
    })
    
    const allFlights = [...enrichedFlights, ...remainingFlights]
    
    return NextResponse.json({ flights: allFlights })
  } catch (error) {
    console.error('Error enriching flights:', error)
    return NextResponse.json({ error: 'Failed to enrich flight data' }, { status: 500 })
  }
}
