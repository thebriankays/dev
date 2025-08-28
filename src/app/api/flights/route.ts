import { NextRequest, NextResponse } from 'next/server'
import * as turf from '@turf/turf'
import { getAirlineByCode, getAircraftImage } from '@/lib/flights/flight-service'

// Cache configuration
// OpenSky API rate limits:
// - Anonymous: 10-second resolution, 400 credits/day
// - Authenticated: 5-second resolution, 4000-8000 credits/day
// But we use position prediction, so we can cache longer
const CACHE_DURATION_ANONYMOUS = 30000 // 30 seconds for anonymous users
const CACHE_DURATION_AUTHENTICATED = 20000 // 20 seconds for authenticated users
const flightCache = new Map<string, { data: any; timestamp: number }>()

// OAuth token cache
let oauthToken: { token: string; expiresAt: number } | null = null

// OpenSky Network API configuration
const OPENSKY_API = 'https://opensky-network.org/api'
const OPENSKY_AUTH_URL =
  'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token'

interface FlightState {
  icao24: string
  callsign: string
  origin_country: string
  time_position: number | null
  last_contact: number
  longitude: number
  latitude: number
  baro_altitude: number | null
  on_ground: boolean
  velocity: number | null
  true_track: number | null
  vertical_rate: number | null
  sensors: number[] | null
  geo_altitude: number | null
  squawk: string | null
  spi: boolean
  position_source: number
  // Additional fields for prediction
  predicted_position?: {
    longitude: number
    latitude: number
  }
  trajectory?: Array<[number, number]>
  // Enhanced fields from database
  airline?: string
  airline_iata?: string
  airline_icao?: string
  aircraft?: string
  registration?: string
  aircraft_image?: string
}

// Helper function to get OAuth2 token
async function getOAuthToken(): Promise<string | null> {
  try {
    // Check if we have a valid cached token
    if (oauthToken && oauthToken.expiresAt > Date.now()) {
      return oauthToken.token
    }

    const clientId = process.env.OPENSKY_CLIENT_ID
    const clientSecret = process.env.OPENSKY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.log('OpenSky OAuth2 credentials not found, using anonymous access')
      return null
    }

    console.log('Requesting new OAuth2 token from OpenSky...')

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    })

    const response = await fetch(OPENSKY_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      console.error('Failed to get OAuth2 token:', response.status, response.statusText)
      return null
    }

    const data = await response.json()

    // Cache the token (expires_in is in seconds, we'll refresh 1 minute before expiry)
    oauthToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    }

    console.log('Successfully obtained OAuth2 token, expires in', data.expires_in, 'seconds')
    return data.access_token
  } catch (error) {
    console.error('Error getting OAuth2 token:', error)
    return null
  }
}

// Get authentication headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  const token = await getOAuthToken()

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    console.log('Using authenticated OpenSky API access with OAuth2')
  } else {
    console.log('Using anonymous OpenSky API access (rate limited)')
  }

  return headers
}

// Helper function to predict flight position using Turf.js
function predictFlightPosition(flight: FlightState, deltaTimeMs: number): [number, number] {
  if (!flight.velocity || !flight.true_track || flight.on_ground) {
    return [flight.longitude, flight.latitude]
  }

  // Convert velocity from m/s to km/h
  const velocityKmPerHour = flight.velocity * 3.6

  // Calculate distance traveled in km
  const distanceKm = velocityKmPerHour * (deltaTimeMs / (1000 * 60 * 60))

  // Create a point from current position
  const currentPoint = turf.point([flight.longitude, flight.latitude])

  // Calculate destination point using Turf.js
  const destination = turf.destination(currentPoint, distanceKm, flight.true_track, {
    units: 'kilometers',
  })

  return destination.geometry.coordinates as [number, number]
}

// Helper function to create interpolated trajectory for smooth animation
function createTrajectory(
  start: [number, number],
  end: [number, number],
  segments: number = 100, // More segments for smoother animation over longer periods
): Array<[number, number]> {
  // Create a great circle line for accurate Earth curvature
  const startPoint = turf.point(start)
  const endPoint = turf.point(end)
  const greatCircle = turf.greatCircle(startPoint, endPoint, { npoints: segments + 1 })

  if (greatCircle.geometry.type === 'LineString') {
    return greatCircle.geometry.coordinates as Array<[number, number]>
  }

  // Fallback to simple interpolation
  const line = turf.lineString([start, end])
  const points: Array<[number, number]> = []

  for (let i = 0; i <= segments; i++) {
    const point = turf.along(line, (i / segments) * turf.length(line), { units: 'kilometers' })
    points.push(point.geometry.coordinates as [number, number])
  }

  return points
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radius = parseFloat(searchParams.get('radius') || '2')

    // Create cache key
    const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}_${radius}`

    console.log(`[${new Date().toISOString()}] Flight API request for ${cacheKey}`)

    // Check cache
    const cached = flightCache.get(cacheKey)
    const now = Date.now()

    // Check if we have valid OAuth token to determine cache duration
    const hasAuth = !!(oauthToken && oauthToken.expiresAt > now)
    const cacheDuration = hasAuth ? CACHE_DURATION_AUTHENTICATED : CACHE_DURATION_ANONYMOUS

    if (cached && now - cached.timestamp < cacheDuration) {
      // Update predicted positions based on elapsed time
      const elapsedTime = now - cached.timestamp
      const updatedFlights = cached.data.flights.map((flight: FlightState) => {
        const predictedPos = predictFlightPosition(flight, elapsedTime)

        // Create smooth trajectory from last known position to predicted position
        const trajectory = createTrajectory(
          [flight.longitude, flight.latitude],
          predictedPos,
          Math.min(300, Math.floor(elapsedTime / 100)), // One point per 100ms, up to 300 points
        )

        return {
          ...flight,
          predicted_position: {
            longitude: predictedPos[0],
            latitude: predictedPos[1],
          },
          trajectory: trajectory,
        }
      })

      return NextResponse.json({
        flights: updatedFlights,
        cached: true,
        timestamp: cached.timestamp,
        elapsed: elapsedTime,
        authenticated: hasAuth,
      })
    }

    // Calculate bounds (smaller area = fewer API credits)
    const bounds = {
      lamin: lat - radius,
      lamax: lat + radius,
      lomin: lng - radius,
      lomax: lng + radius,
    }

    const url = `${OPENSKY_API}/states/all?lamin=${bounds.lamin}&lomin=${bounds.lomin}&lamax=${bounds.lamax}&lomax=${bounds.lomax}`

    // Calculate area to estimate credit usage
    const areaDegrees = (bounds.lamax - bounds.lamin) * (bounds.lomax - bounds.lomin)
    const creditCost = areaDegrees <= 25 ? 1 : areaDegrees <= 100 ? 2 : areaDegrees <= 400 ? 3 : 4

    console.log('Fetching from OpenSky API:', url)
    console.log(
      'Area square degrees:',
      areaDegrees.toFixed(2),
      '- Estimated credit cost:',
      creditCost,
    )

    const headers = await getAuthHeaders()
    const response = await fetch(url, {
      headers,
      next: { revalidate: 5 }, // Next.js caching
    })

    if (!response.ok) {
      // Handle rate limiting
      if (response.status === 429) {
        console.warn('OpenSky API rate limit reached')
        // Return cached data if available
        if (cached) {
          return NextResponse.json({
            flights: cached.data.flights,
            cached: true,
            timestamp: cached.timestamp,
            error: 'Rate limit reached - showing cached data',
            authenticated: hasAuth,
          })
        }
        return NextResponse.json({
          flights: [],
          cached: false,
          timestamp: now,
          error: 'OpenSky API rate limit reached. Please wait before trying again.',
          authenticated: hasAuth,
        })
      }

      // Handle authentication failure
      if (response.status === 401) {
        console.warn('OpenSky API authentication failed, clearing token cache')
        oauthToken = null

        // Try again without auth
        const anonymousResponse = await fetch(url, {
          headers: { Accept: 'application/json' },
          next: { revalidate: 10 },
        })

        if (!anonymousResponse.ok) {
          throw new Error(`API Error: ${anonymousResponse.status}`)
        }

        const data = await anonymousResponse.json()
        return processFlightData(data, cacheKey, now, false)
      }

      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    return processFlightData(data, cacheKey, now, hasAuth)
  } catch (error) {
    console.error('Error fetching flights:', error)

    // Return cached data if available
    const cacheKey = `${request.nextUrl.searchParams.get('lat')}_${request.nextUrl.searchParams.get('lng')}_${request.nextUrl.searchParams.get('radius')}`
    const cached = flightCache.get(cacheKey)

    if (cached) {
      return NextResponse.json({
        flights: cached.data.flights,
        cached: true,
        timestamp: cached.timestamp,
        error: error instanceof Error ? error.message : 'Failed to fetch flight data',
        authenticated: false,
      })
    }

    return NextResponse.json({
      flights: [],
      cached: false,
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Failed to fetch flight data',
      authenticated: false,
    })
  }
}

// Process flight data helper
async function processFlightData(
  data: any,
  cacheKey: string,
  timestamp: number,
  authenticated: boolean,
) {
  if (data.states && Array.isArray(data.states)) {
    const flights: FlightState[] = data.states
      .filter(
        (state: any[]) => {
          const hasCoords = state[5] !== null && state[6] !== null && !isNaN(state[5]) && !isNaN(state[6])
          const validLng = state[5] !== 0 && Math.abs(state[5]) <= 180
          const validLat = state[6] !== 0 && Math.abs(state[6]) <= 90
          
          if (!hasCoords || !validLng || !validLat) {
            console.warn(`Filtering out flight with invalid coords: lng=${state[5]}, lat=${state[6]}`)
            return false
          }
          return true
        }
      )
      .map((state: any[]) => {
        const flight: FlightState = {
          icao24: state[0],
          callsign: state[1]?.trim() || 'N/A',
          origin_country: state[2] || 'Unknown',
          time_position: state[3],
          last_contact: state[4],
          longitude: parseFloat(state[5]),
          latitude: parseFloat(state[6]),
          baro_altitude: state[7],
          on_ground: state[8] === true,
          velocity: state[9] || 0,
          true_track: state[10] || 0,
          vertical_rate: state[11] || 0,
          sensors: state[12],
          geo_altitude: state[13],
          squawk: state[14],
          spi: state[15] || false,
          position_source: state[16] || 0,
        }
        
        // Debug log to check coordinates
        if (Math.random() < 0.1) { // Log 10% of flights to avoid spam
          console.log(`Flight ${flight.callsign}: lng=${flight.longitude}, lat=${flight.latitude}`)
        }

        // Add predicted position (for immediate use)
        flight.predicted_position = {
          longitude: flight.longitude,
          latitude: flight.latitude,
        }

        return flight
      })

    // Process without enrichment for faster initial load
    console.log(`Processed ${flights.length} flights from OpenSky API`)
    if (flights.length > 0) {
      console.log('Sample flight coordinates:')
      flights.slice(0, 5).forEach(f => {
        console.log(`  ${f.callsign}: [${f.longitude}, ${f.latitude}]`)
      })
    }
    
    // Cache the results
    flightCache.set(cacheKey, {
      data: { flights },
      timestamp,
    })

    // Clean old cache entries
    if (flightCache.size > 100) {
      const entries = Array.from(flightCache.entries())
      entries.sort((a, b) => {
        const aTime = a[1]?.timestamp ?? 0
        const bTime = b[1]?.timestamp ?? 0
        return aTime - bTime
      })
      for (let i = 0; i < 50; i++) {
        const entry = entries[i]
        if (entry) {
          flightCache.delete(entry[0])
        }
      }
    }
    
    return NextResponse.json({
      flights,
      cached: false,
      timestamp,
      authenticated,
    })
  }

  return NextResponse.json({
    flights: [],
    cached: false,
    timestamp,
    authenticated,
  })
}

// Get flight details with trajectory to destination
export async function POST(request: NextRequest) {
  try {
    const { icao24, destination } = await request.json()

    if (!icao24) {
      return NextResponse.json({ error: 'ICAO24 identifier required' }, { status: 400 })
    }

    // Fetch current flight state
    const url = `${OPENSKY_API}/states/all?icao24=${icao24}`
    const headers = await getAuthHeaders()
    const response = await fetch(url, { headers })

    if (!response.ok) {
      // Try without auth if 401
      if (response.status === 401) {
        oauthToken = null
        const anonymousResponse = await fetch(url, {
          headers: { Accept: 'application/json' },
        })

        if (!anonymousResponse.ok) {
          throw new Error(`API Error: ${anonymousResponse.status}`)
        }

        const data = await anonymousResponse.json()
        return processFlightDetails(data, destination)
      }

      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    return processFlightDetails(data, destination)
  } catch (error) {
    console.error('Error fetching flight details:', error)
    return NextResponse.json({ error: 'Failed to fetch flight details' }, { status: 500 })
  }
}

// Process flight details helper
async function processFlightDetails(data: any, destination: any) {
  if (data.states && data.states.length > 0) {
    const state = data.states[0]
    const flight: FlightState = {
      icao24: state[0],
      callsign: state[1]?.trim() || 'N/A',
      origin_country: state[2] || 'Unknown',
      time_position: state[3],
      last_contact: state[4],
      longitude: parseFloat(state[5]),
      latitude: parseFloat(state[6]),
      baro_altitude: state[7],
      on_ground: state[8] || false,
      velocity: state[9] || 0,
      true_track: state[10] || 0,
      vertical_rate: state[11] || 0,
      sensors: state[12],
      geo_altitude: state[13],
      squawk: state[14],
      spi: state[15] || false,
      position_source: state[16] || 0,
    }

    // Enrich with database data
    const airline = await getAirlineByCode(flight.callsign)
    if (airline) {
      flight.airline = airline.name
      flight.airline_iata = airline.iata || undefined
      flight.airline_icao = airline.icao || undefined
    }

    // Try to get aircraft image if we have registration (this would need FlightAware data)
    // For now, we'll skip this as we don't have registration from OpenSky

    // If destination provided, create great circle trajectory
    if (destination && destination.lat && destination.lng) {
      const start = turf.point([flight.longitude, flight.latitude])
      const end = turf.point([destination.lng, destination.lat])

      // Create great circle line with many points for smooth animation
      const greatCircle = turf.greatCircle(start, end, { npoints: 100 })

      if (greatCircle.geometry.type === 'LineString') {
        const coords = greatCircle.geometry.coordinates as Array<[number, number]>
        flight.trajectory = coords
      }
    }

    return NextResponse.json({ flight })
  }

  return NextResponse.json({ error: 'Flight not found' }, { status: 404 })
}
