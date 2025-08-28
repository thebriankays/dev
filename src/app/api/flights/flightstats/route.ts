import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// Helper functions
async function getAirlineByCode(code: string) {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'airlines',
    where: {
      or: [
        { iata: { equals: code } },
        { icao: { equals: code } },
      ],
    },
    limit: 1,
  })
  return result.docs.length > 0 ? result.docs[0] : null
}

async function getAirportDisplay(code: string) {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'airports',
    where: {
      or: [
        { iata: { equals: code } },
        { icao: { equals: code } },
      ],
    },
    limit: 1,
  })
  return result.docs.length > 0 ? result.docs[0].name : code
}

async function getAircraftImage(registration: string) {
  // This would typically fetch from an aviation photo API
  // For now, return a placeholder
  return null
}

// FlightStats API - Returns mock data since real scraping is complex
// In production, you would use the official FlightStats API

// Cache for FlightStats data to reduce requests
const flightStatsCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function getFlightStatsData(flightCode: string): Promise<any> {
  const payload = await getPayload({ config })

  try {
    // Check database cache first
    const cached = await payload.find({
      collection: 'flight-cache',
      where: {
        and: [
          { flightCode: { equals: flightCode } },
          { cacheExpiry: { greater_than: new Date().toISOString() } },
          { source: { equals: 'flightstats' } },
        ],
      },
      limit: 1,
    })

    if (cached.docs.length > 0 && cached.docs[0]) {
      const cachedData = cached.docs[0] as any
      console.log('Returning cached FlightStats data from DB for:', flightCode)
      // If the cached data has actual flight information (not just mock), return it
      if (cachedData.rawData && cachedData.rawData.departureAirportCode) {
        return cachedData.rawData
      }
    }

    // Check memory cache next
    const memoryCached = flightStatsCache.get(flightCode)
    if (memoryCached && Date.now() - memoryCached.timestamp < CACHE_DURATION) {
      console.log('Returning cached FlightStats data from memory for:', flightCode)
      return memoryCached.data
    }

    // Since FlightStats requires complex authentication and scraping,
    // we'll return structured mock data based on common routes
    console.log('Generating flight data for:', flightCode)
    return getMockFlightData(flightCode)
    
  } catch (error) {
    console.error('Error getting FlightStats data:', error)
    return getMockFlightData(flightCode)
  }
}

// Enhanced mock data generator with more realistic data
function getMockFlightData(code: string) {
  // Parse flight code
  const codeMatch = code.match(/^([A-Z]{2,3})(\d+)$/i)
  if (!codeMatch) {
    return null
  }

  const airlineCode = codeMatch[1].toUpperCase()
  const flightNumber = codeMatch[2]

  // Common airline mappings
  const airlines: Record<string, { name: string; iata: string; icao: string }> = {
    'AA': { name: 'American Airlines', iata: 'AA', icao: 'AAL' },
    'AAL': { name: 'American Airlines', iata: 'AA', icao: 'AAL' },
    'UA': { name: 'United Airlines', iata: 'UA', icao: 'UAL' },
    'UAL': { name: 'United Airlines', iata: 'UA', icao: 'UAL' },
    'DL': { name: 'Delta Air Lines', iata: 'DL', icao: 'DAL' },
    'DAL': { name: 'Delta Air Lines', iata: 'DL', icao: 'DAL' },
    'WN': { name: 'Southwest Airlines', iata: 'WN', icao: 'SWA' },
    'SWA': { name: 'Southwest Airlines', iata: 'WN', icao: 'SWA' },
    'B6': { name: 'JetBlue Airways', iata: 'B6', icao: 'JBU' },
    'JBU': { name: 'JetBlue Airways', iata: 'B6', icao: 'JBU' },
    'AS': { name: 'Alaska Airlines', iata: 'AS', icao: 'ASA' },
    'ASA': { name: 'Alaska Airlines', iata: 'AS', icao: 'ASA' },
    'NK': { name: 'Spirit Airlines', iata: 'NK', icao: 'NKS' },
    'NKS': { name: 'Spirit Airlines', iata: 'NK', icao: 'NKS' },
    'F9': { name: 'Frontier Airlines', iata: 'F9', icao: 'FFT' },
    'FFT': { name: 'Frontier Airlines', iata: 'F9', icao: 'FFT' },
  }

  const airline = airlines[airlineCode] || { 
    name: 'Unknown Airline', 
    iata: airlineCode.substring(0, 2), 
    icao: airlineCode 
  }

  // Common routes based on flight number patterns
  const routes = [
    // Transcontinental
    { 
      dep: 'JFK', depName: 'John F Kennedy International Airport', depCity: 'New York', depState: 'NY',
      arr: 'LAX', arrName: 'Los Angeles International Airport', arrCity: 'Los Angeles', arrState: 'CA',
      distance: '2475', duration: { hours: 5, minutes: 30 },
      gates: { dep: 'T4-B22', depTerm: '4', arr: 'T6-65A', arrTerm: '6' },
      baggage: '7'
    },
    // Chicago hub
    { 
      dep: 'ORD', depName: "Chicago O'Hare International Airport", depCity: 'Chicago', depState: 'IL',
      arr: 'DFW', arrName: 'Dallas/Fort Worth International Airport', arrCity: 'Dallas', arrState: 'TX',
      distance: '925', duration: { hours: 2, minutes: 45 },
      gates: { dep: 'C16', depTerm: '1', arr: 'A15', arrTerm: 'A' },
      baggage: '23'
    },
    // East Coast shuttle
    { 
      dep: 'BOS', depName: 'Boston Logan International Airport', depCity: 'Boston', depState: 'MA',
      arr: 'DCA', arrName: 'Ronald Reagan Washington National Airport', arrCity: 'Washington', arrState: 'DC',
      distance: '399', duration: { hours: 1, minutes: 30 },
      gates: { dep: 'B32', depTerm: 'B', arr: 'C35', arrTerm: 'C' },
      baggage: '3'
    },
    // West Coast
    { 
      dep: 'SFO', depName: 'San Francisco International Airport', depCity: 'San Francisco', depState: 'CA',
      arr: 'SEA', arrName: 'Seattle-Tacoma International Airport', arrCity: 'Seattle', arrState: 'WA',
      distance: '679', duration: { hours: 2, minutes: 15 },
      gates: { dep: 'E11', depTerm: '3', arr: 'N12', arrTerm: 'N' },
      baggage: '14'
    },
    // Southern route
    { 
      dep: 'ATL', depName: 'Hartsfield-Jackson Atlanta International Airport', depCity: 'Atlanta', depState: 'GA',
      arr: 'MIA', arrName: 'Miami International Airport', arrCity: 'Miami', arrState: 'FL',
      distance: '594', duration: { hours: 2, minutes: 0 },
      gates: { dep: 'D12', depTerm: 'D', arr: 'D46', arrTerm: 'D' },
      baggage: '18'
    }
  ]

  // Select route based on flight number
  const routeIndex = parseInt(flightNumber) % routes.length
  const route = routes[routeIndex]

  // Aircraft types
  const aircraft = [
    { name: 'Boeing 737-800', iata: '738' },
    { name: 'Airbus A320', iata: '320' },
    { name: 'Boeing 777-300ER', iata: '77W' },
    { name: 'Airbus A321', iata: '321' },
    { name: 'Boeing 787-9 Dreamliner', iata: '789' }
  ]
  const aircraftIndex = parseInt(flightNumber) % aircraft.length
  const selectedAircraft = aircraft[aircraftIndex]

  // Generate times based on current time
  const now = new Date()
  const scheduledDep = new Date(now)
  scheduledDep.setHours(10, 30, 0, 0) // 10:30 AM scheduled
  
  const scheduledArr = new Date(scheduledDep)
  scheduledArr.setHours(scheduledArr.getHours() + route.duration.hours)
  scheduledArr.setMinutes(scheduledArr.getMinutes() + route.duration.minutes)

  // Add some realistic delay
  const delayMinutes = Math.floor(Math.random() * 30) - 10 // -10 to +20 minutes
  const actualDep = new Date(scheduledDep.getTime() + delayMinutes * 60000)
  const actualArr = new Date(scheduledArr.getTime() + delayMinutes * 60000)

  return {
    flightCode: code.toUpperCase(),
    source: 'flightstats',
    airline: airline.name,
    airlineIata: airline.iata,
    airlineIcao: airline.icao,
    flightNumber,
    
    departureAirport: route.depName,
    departureAirportCode: route.dep,
    departureCity: route.depCity,
    departureState: route.depState,
    departureCountry: 'US',
    departureGate: route.gates.dep,
    departureTerminal: route.gates.depTerm,
    
    arrivalAirport: route.arrName,
    arrivalAirportCode: route.arr,
    arrivalCity: route.arrCity,
    arrivalState: route.arrState,
    arrivalCountry: 'US',
    arrivalGate: route.gates.arr,
    arrivalTerminal: route.gates.arrTerm,
    baggage: route.baggage,
    
    status: delayMinutes > 15 ? 'Delayed' : 'On Time',
    statusCode: 'A',
    
    scheduledDepartureTime: scheduledDep.toISOString(),
    scheduledArrivalTime: scheduledArr.toISOString(),
    gateDepartureTime: actualDep.toISOString(),
    actualDepartureTime: new Date(actualDep.getTime() + 15 * 60000).toISOString(), // 15 min after gate
    landingTime: new Date(actualArr.getTime() - 10 * 60000).toISOString(), // 10 min before gate
    gateArrivalTime: actualArr.toISOString(),
    
    duration: route.duration,
    totalTravelTime: `${route.duration.hours}h ${route.duration.minutes}m`,
    distance: route.distance,
    
    aircraft: selectedAircraft.name,
    aircraftIata: selectedAircraft.iata,
    registration: `N${Math.floor(100 + parseInt(flightNumber) % 900)}${airline.iata}`,
    
    // Flag as demonstration data
    isMockData: true,
    mockReason: 'FlightStats API integration required for real-time data',
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const callsign = searchParams.get('callsign')
    const flightCode = searchParams.get('flightCode')

    if (!callsign && !flightCode) {
      return NextResponse.json({ error: 'Callsign or flight code required' }, { status: 400 })
    }

    const code = (callsign || flightCode || '').toUpperCase()
    const flightData = await getFlightStatsData(code)

    if (!flightData) {
      return NextResponse.json(
        {
          error: 'Flight data not found',
          message: 'Unable to retrieve flight information from FlightStats',
        },
        { status: 404 },
      )
    }

    // Get additional data from our database
    const payload = await getPayload({ config })
    const airline = await getAirlineByCode(flightData.airlineIata || flightData.airlineIcao || code)

    // Get airport data if available
    let departureAirportData = null
    let arrivalAirportData = null

    if (flightData.departureAirportCode) {
      const depResult = await payload.find({
        collection: 'airports',
        where: {
          or: [
            { iata: { equals: flightData.departureAirportCode } },
            { icao: { equals: flightData.departureAirportCode } },
          ],
        },
        limit: 1,
      })
      if (depResult.docs.length > 0) {
        departureAirportData = depResult.docs[0]
      }
    }

    if (flightData.arrivalAirportCode) {
      const arrResult = await payload.find({
        collection: 'airports',
        where: {
          or: [
            { iata: { equals: flightData.arrivalAirportCode } },
            { icao: { equals: flightData.arrivalAirportCode } },
          ],
        },
        limit: 1,
      })
      if (arrResult.docs.length > 0) {
        arrivalAirportData = arrResult.docs[0]
      }
    }

    // Format the response
    const formattedData: any = {
      flight: flightData.flightCode,
      airline: airline?.name || flightData.airline,
      airline_iata: airline?.iata || flightData.airlineIata,
      airline_icao: airline?.icao || flightData.airlineIcao,
      flightNumber: flightData.flightNumber,
      departureAirport: departureAirportData?.name || flightData.departureAirport,
      destinationAirport: arrivalAirportData?.name || flightData.arrivalAirport,
      departureAirportCode: flightData.departureAirportCode,
      arrivalAirportCode: flightData.arrivalAirportCode,
      scheduled_departure: flightData.scheduledDepartureTime,
      scheduled_arrival: flightData.scheduledArrivalTime,
      actual_departure: flightData.actualDepartureTime,
      gate_departure: flightData.gateDepartureTime,
      status: flightData.status,
      statusCode: flightData.statusCode,
      aircraft: flightData.aircraft,
      aircraftIata: flightData.aircraftIata,
      registration: flightData.registration,
      distance: flightData.distance,
      duration: flightData.duration,
      departureGate: flightData.departureGate,
      arrivalGate: flightData.arrivalGate,
      departureTerminal: flightData.departureTerminal,
      arrivalTerminal: flightData.arrivalTerminal,
      baggage: flightData.baggage,
      flightStatus: flightData.status,
      flightDuration: flightData.duration,
      flightDistance: flightData.distance,
      departureTime: flightData.scheduledDepartureTime,
      arrivalTime: flightData.scheduledArrivalTime,
      gateDepartureTime: flightData.gateDepartureTime,
      takeoffTime: flightData.actualDepartureTime,
      landingTime: flightData.landingTime,
      gateArrivalTime: flightData.gateArrivalTime,
      departureCity: flightData.departureCity,
      departureState: flightData.departureState,
      departureCountry: flightData.departureCountry,
      arrivalCity: flightData.arrivalCity,
      arrivalState: flightData.arrivalState,
      arrivalCountry: flightData.arrivalCountry,
      totalTravelTime: flightData.totalTravelTime,
      isMockData: flightData.isMockData,
      mockReason: flightData.mockReason,
      dataSource: 'flightstats',
    }

    // Save to cache
    try {
      const cacheExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      const existing = await payload.find({
        collection: 'flight-cache',
        where: { 
          and: [
            { flightCode: { equals: code } },
            { source: { equals: 'flightstats' } }
          ]
        },
        limit: 1,
      })

      const cacheData = {
        flightCode: code,
        source: 'flightstats' as const,
        airline: formattedData.airline,
        aircraft: formattedData.aircraft,
        registration: formattedData.registration,
        departureAirport: formattedData.departureAirport,
        departureAirportCode: formattedData.departureAirportCode,
        arrivalAirport: formattedData.destinationAirport,
        arrivalAirportCode: formattedData.arrivalAirportCode,
        departureGate: formattedData.departureGate,
        arrivalGate: formattedData.arrivalGate,
        departureTerminal: formattedData.departureTerminal,
        arrivalTerminal: formattedData.arrivalTerminal,
        baggage: formattedData.baggage,
        status: formattedData.status,
        distance: formattedData.distance ? parseInt(formattedData.distance) : null,
        duration: formattedData.duration,
        scheduledDepartureTime: formattedData.scheduled_departure,
        scheduledArrivalTime: formattedData.scheduled_arrival,
        rawData: flightData,
        lastUpdated: new Date().toISOString(),
        cacheExpiry: cacheExpiry.toISOString(),
      }

      if (existing.docs.length > 0 && existing.docs[0]) {
        await payload.update({
          collection: 'flight-cache',
          id: existing.docs[0].id,
          data: cacheData,
        })
      } else {
        await payload.create({
          collection: 'flight-cache',
          data: cacheData,
        })
      }
    } catch (error) {
      console.error('Error saving to flight cache:', error)
    }

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Error in FlightStats endpoint:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch flight data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
