import { NextRequest, NextResponse } from 'next/server'
import { getAirlineByCode } from '@/lib/flights/flight-service'

export async function POST(request: NextRequest) {
  try {
    const { flights } = await request.json()
    
    if (!flights || !Array.isArray(flights)) {
      return NextResponse.json({ error: 'Flights array required' }, { status: 400 })
    }
    
    // Enrich flight data with airline info for the first 20 flights
    const enrichedFlights = await Promise.all(
      flights.slice(0, 20).map(async (flight: any) => {
        try {
          // Get airline from callsign
          let airline = null
          if (flight.callsign) {
            airline = await getAirlineByCode(flight.callsign)
          }
          
          return {
            ...flight,
            airline: airline?.name,
            airline_iata: airline?.iata,
            airline_icao: airline?.icao,
          }
        } catch (error) {
          console.error('Error enriching flight:', flight.icao24, error)
          return flight
        }
      })
    )
    
    // Merge enriched flights with remaining flights
    const remainingFlights = flights.slice(20)
    const allFlights = [...enrichedFlights, ...remainingFlights]
    
    return NextResponse.json({ flights: allFlights })
  } catch (error) {
    console.error('Error enriching flights:', error)
    return NextResponse.json({ error: 'Failed to enrich flight data' }, { status: 500 })
  }
}
