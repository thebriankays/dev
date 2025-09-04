import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

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

export async function POST(request: NextRequest) {
  try {
    const { flights } = await request.json()
    
    if (!flights || !Array.isArray(flights)) {
      return NextResponse.json({ error: 'Flights array required' }, { status: 400 })
    }
    
    const payload = await getPayload({ config })
    
    // Enrich flight data with airline info for the first 20 flights
    const enrichedFlights = await Promise.all(
      flights.slice(0, 20).map(async (flight: FlightData) => {
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
