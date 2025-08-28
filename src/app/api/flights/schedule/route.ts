import { NextRequest, NextResponse } from 'next/server'
import { getAirlineByCode } from '@/lib/flights/flight-service'

// Try to get real data from FlightStats first
async function getFlightStatsData(callsign: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/flights/flightstats?callsign=${callsign}`)
    if (response.ok) {
      const data = await response.json()
      if (data && !data.error) {
        return data
      }
    }
  } catch (error) {
    console.error('Error fetching FlightStats data:', error)
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const callsign = searchParams.get('callsign')
    const icao24 = searchParams.get('icao24')
    
    if (!callsign && !icao24) {
      return NextResponse.json({ error: 'Callsign or ICAO24 required' }, { status: 400 })
    }
    
    // Try to get real data from FlightStats first
    if (callsign) {
      const flightStatsData = await getFlightStatsData(callsign)
      if (flightStatsData) {
        console.log('Schedule API: Using FlightStats data for', callsign)
        return NextResponse.json(flightStatsData)
      }
    }
    
    // If FlightStats fails, return a message indicating real-time data is needed
    console.log('Schedule API: No real-time data available for', callsign)
    
    // Get airline information from database
    const airline = await getAirlineByCode(callsign || '')
    
    return NextResponse.json({
      flight: callsign,
      airline: airline?.name,
      airline_iata: airline?.iata,
      airline_icao: airline?.icao,
      message: 'Real-time schedule data not available. This requires integration with aviation data providers like FlightStats API or FlightRadar24.',
      status: 'NO_DATA',
      // Provide links to where users can find flight information
      external_links: {
        flightaware: `https://flightaware.com/live/flight/${callsign}`,
        flightradar24: `https://www.flightradar24.com/data/flights/${callsign?.toLowerCase()}`,
      }
    })
    
  } catch (error) {
    console.error('Error fetching flight schedule:', error)
    return NextResponse.json({ error: 'Failed to fetch flight schedule' }, { status: 500 })
  }
}
