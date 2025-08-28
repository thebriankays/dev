import { NextRequest, NextResponse } from 'next/server'

// Search for specific flight using FlightStats
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;
    
    console.log('Search request received for:', query);
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query required' },
        { status: 400 }
      )
    }
    
    const searchQuery = query.trim().toUpperCase()
    
    // Try FlightStats API
    try {
      const flightStatsResponse = await fetch(`${request.nextUrl.origin}/api/flights/flightstats?flightCode=${searchQuery}`)
      
      if (flightStatsResponse.ok) {
        const flightStatsData = await flightStatsResponse.json()
        
        if (flightStatsData && !flightStatsData.error) {
          console.log('Found flight in FlightStats:', flightStatsData)
          
          // Create a flight object with FlightStats data
          // Note: FlightStats doesn't provide real-time position, so we'll return what we have
          const flight = {
            icao24: searchQuery.toLowerCase(), // Use query as mock ICAO24
            callsign: searchQuery,
            origin_country: flightStatsData.departureCountry || 'United States',
            time_position: Math.floor(Date.now() / 1000),
            last_contact: Math.floor(Date.now() / 1000),
            // We don't have real position from FlightStats, so we'll need to handle this in the UI
            longitude: null,
            latitude: null,
            baro_altitude: null,
            on_ground: flightStatsData.status === 'Landed' || flightStatsData.status === 'Scheduled',
            velocity: null,
            true_track: null,
            vertical_rate: 0,
            sensors: null,
            geo_altitude: null,
            squawk: null,
            spi: false,
            position_source: 0,
            // Add all FlightStats data
            airline: flightStatsData.airline,
            airline_iata: flightStatsData.airline_iata,
            airline_icao: flightStatsData.airline_icao,
            flightNumber: flightStatsData.flightNumber,
            departureAirport: flightStatsData.departureAirport,
            departureAirportCode: flightStatsData.departureAirportCode,
            arrivalAirport: flightStatsData.arrivalAirport || flightStatsData.destinationAirport,
            arrivalAirportCode: flightStatsData.arrivalAirportCode,
            destinationAirport: flightStatsData.arrivalAirport || flightStatsData.destinationAirport,
            departureGate: flightStatsData.departureGate,
            arrivalGate: flightStatsData.arrivalGate,
            departureTerminal: flightStatsData.departureTerminal,
            arrivalTerminal: flightStatsData.arrivalTerminal,
            baggage: flightStatsData.baggage,
            status: flightStatsData.status,
            statusCode: flightStatsData.statusCode,
            scheduled_departure: flightStatsData.scheduled_departure || flightStatsData.departureTime,
            scheduled_arrival: flightStatsData.scheduled_arrival || flightStatsData.arrivalTime,
            actual_departure: flightStatsData.actual_departure,
            gate_departure: flightStatsData.gate_departure || flightStatsData.gateDepartureTime,
            distance: flightStatsData.distance,
            flightDistance: flightStatsData.flightDistance,
            duration: flightStatsData.duration,
            aircraft: flightStatsData.aircraft,
            registration: flightStatsData.registration,
            // Flag that this is from FlightStats (not real-time position)
            dataSource: 'flightstats',
            isMockData: flightStatsData.isMockData,
            mockReason: flightStatsData.mockReason,
          }
          
          return NextResponse.json({ flight })
        }
      }
    } catch (error) {
      console.error('Error fetching from FlightStats:', error)
    }
    
    return NextResponse.json(
      { error: 'Flight not found', message: 'Unable to find flight information. The flight may not exist or may not be scheduled today.' },
      { status: 404 }
    )
    
  } catch (error) {
    console.error('Error searching for flight:', error)
    return NextResponse.json(
      { error: 'Failed to search for flight' },
      { status: 500 }
    )
  }
}
