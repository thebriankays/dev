/**
 * Smart flight calculation utilities for estimating flight times, paths, and other metrics
 * based on departure/arrival airports and distance
 */

interface Airport {
  iata?: string
  icao?: string
  name: string
  latitude: number
  longitude: number
  elevation?: number
  timezone?: any
}

interface FlightEstimates {
  distance: number // miles
  duration: { hours: number; minutes: number }
  estimatedDepartureTime?: Date
  estimatedArrivalTime?: Date
  flightPath: Array<[number, number]> // [lng, lat] pairs
  cruiseAltitude: number // feet
  cruiseSpeed: number // mph
  climbTime: number // minutes
  descentTime: number // minutes
  cruiseTime: number // minutes
  fuelEstimate?: number // gallons
  heading: number // degrees
  timezone?: {
    departure: string
    arrival: string
    offset: number // hours difference
  }
}

/**
 * Calculate the great circle distance between two points
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate bearing/heading between two points
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRad(lon2 - lon1)
  const y = Math.sin(dLon) * Math.cos(toRad(lat2))
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon)
  const bearing = toDeg(Math.atan2(y, x))
  return (bearing + 360) % 360
}

/**
 * Generate intermediate points along great circle path
 */
export function generateFlightPath(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number, 
  numPoints: number = 100
): Array<[number, number]> {
  const points: Array<[number, number]> = []
  const d = calculateDistance(lat1, lon1, lat2, lon2)
  const bearing = calculateBearing(lat1, lon1, lat2, lon2)
  
  // Add departure point
  points.push([lon1, lat1])
  
  // Generate intermediate points
  for (let i = 1; i < numPoints - 1; i++) {
    const fraction = i / (numPoints - 1)
    const point = intermediatePoint(lat1, lon1, lat2, lon2, fraction)
    points.push([point.lon, point.lat])
  }
  
  // Add arrival point
  points.push([lon2, lat2])
  
  return points
}

/**
 * Calculate intermediate point along great circle
 */
function intermediatePoint(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number, 
  fraction: number
): { lat: number; lon: number } {
  const φ1 = toRad(lat1)
  const λ1 = toRad(lon1)
  const φ2 = toRad(lat2)
  const λ2 = toRad(lon2)
  
  const Δφ = φ2 - φ1
  const Δλ = λ2 - λ1
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2)
    + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const δ = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  const A = Math.sin((1 - fraction) * δ) / Math.sin(δ)
  const B = Math.sin(fraction * δ) / Math.sin(δ)
  
  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2)
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2)
  const z = A * Math.sin(φ1) + B * Math.sin(φ2)
  
  const φ3 = Math.atan2(z, Math.sqrt(x * x + y * y))
  const λ3 = Math.atan2(y, x)
  
  return {
    lat: toDeg(φ3),
    lon: toDeg(λ3)
  }
}

/**
 * Estimate flight duration based on distance and aircraft type
 */
export function estimateFlightDuration(
  distance: number,
  aircraftType?: string
): { hours: number; minutes: number; cruiseSpeed: number } {
  // Default cruise speeds (mph) for different aircraft types
  const cruiseSpeeds: Record<string, number> = {
    // Wide-body jets
    'Boeing 777': 560,
    'Boeing 787': 560,
    'Boeing 747': 565,
    'Airbus A350': 560,
    'Airbus A380': 560,
    'Airbus A330': 540,
    
    // Narrow-body jets
    'Boeing 737': 515,
    'Boeing 737 MAX': 520,
    'Airbus A320': 515,
    'Airbus A321': 515,
    'Airbus A319': 515,
    
    // Regional jets
    'Embraer E175': 470,
    'Embraer E190': 480,
    'CRJ900': 470,
    'CRJ700': 460,
    
    // Turboprops
    'ATR 72': 315,
    'Dash 8': 310,
    
    // Default
    'default': 520
  }
  
  // Get cruise speed for aircraft type
  let cruiseSpeed = cruiseSpeeds.default
  if (aircraftType) {
    // Try exact match first
    cruiseSpeed = cruiseSpeeds[aircraftType] || cruiseSpeed
    
    // Try partial match
    if (cruiseSpeed === cruiseSpeeds.default) {
      for (const [type, speed] of Object.entries(cruiseSpeeds)) {
        if (aircraftType.includes(type) || type.includes(aircraftType)) {
          cruiseSpeed = speed
          break
        }
      }
    }
  }
  
  // Calculate flight phases
  const climbDistance = 150 // miles
  const descentDistance = 120 // miles
  const cruiseDistance = Math.max(0, distance - climbDistance - descentDistance)
  
  // Time calculations
  const climbTime = (climbDistance / 400) * 60 // Climb at ~400 mph
  const cruiseTime = (cruiseDistance / cruiseSpeed) * 60
  const descentTime = (descentDistance / 350) * 60 // Descent at ~350 mph
  
  // Add taxi time
  const taxiTime = 25 // minutes total (15 out + 10 in)
  
  const totalMinutes = Math.round(climbTime + cruiseTime + descentTime + taxiTime)
  
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    cruiseSpeed
  }
}

/**
 * Estimate cruise altitude based on distance and direction
 */
export function estimateCruiseAltitude(distance: number, heading: number): number {
  // RVSM rules: 
  // Eastbound (0-179°): odd thousands (FL290, FL310, FL330, etc.)
  // Westbound (180-359°): even thousands (FL280, FL300, FL320, etc.)
  
  let baseAltitude: number
  
  // Short flights stay lower
  if (distance < 200) {
    baseAltitude = 25000
  } else if (distance < 500) {
    baseAltitude = 31000
  } else if (distance < 1000) {
    baseAltitude = 35000
  } else if (distance < 2000) {
    baseAltitude = 37000
  } else {
    baseAltitude = 39000
  }
  
  // Apply RVSM rules
  const isEastbound = heading >= 0 && heading < 180
  if (isEastbound) {
    // Round to nearest odd thousand
    baseAltitude = Math.round(baseAltitude / 2000) * 2000 + 1000
  } else {
    // Round to nearest even thousand
    baseAltitude = Math.round(baseAltitude / 2000) * 2000
  }
  
  // Ensure it's within typical cruise range
  return Math.min(Math.max(baseAltitude, 25000), 41000)
}

/**
 * Smart flight estimation based on airports
 */
export async function calculateFlightEstimates(
  departureAirport: Airport,
  arrivalAirport: Airport,
  departureTime?: Date,
  aircraftType?: string
): Promise<FlightEstimates> {
  // Calculate distance
  const distance = calculateDistance(
    departureAirport.latitude,
    departureAirport.longitude,
    arrivalAirport.latitude,
    arrivalAirport.longitude
  )
  
  // Calculate heading
  const heading = calculateBearing(
    departureAirport.latitude,
    departureAirport.longitude,
    arrivalAirport.latitude,
    arrivalAirport.longitude
  )
  
  // Generate flight path
  const flightPath = generateFlightPath(
    departureAirport.latitude,
    departureAirport.longitude,
    arrivalAirport.latitude,
    arrivalAirport.longitude
  )
  
  // Estimate duration
  const { hours, minutes, cruiseSpeed } = estimateFlightDuration(distance, aircraftType)
  
  // Estimate cruise altitude
  const cruiseAltitude = estimateCruiseAltitude(distance, heading)
  
  // Calculate phase times
  const climbTime = Math.round((150 / 400) * 60) // 150 miles at 400 mph
  const descentTime = Math.round((120 / 350) * 60) // 120 miles at 350 mph
  const cruiseTime = (hours * 60 + minutes) - climbTime - descentTime - 25 // minus taxi time
  
  // Estimate fuel (rough calculation)
  const fuelPerHour = aircraftType?.includes('777') ? 2100 : 
                      aircraftType?.includes('737') ? 850 : 1200
  const fuelEstimate = Math.round(fuelPerHour * (hours + minutes / 60))
  
  const estimates: FlightEstimates = {
    distance: Math.round(distance),
    duration: { hours, minutes },
    flightPath,
    cruiseAltitude,
    cruiseSpeed,
    climbTime,
    descentTime,
    cruiseTime: Math.max(0, cruiseTime),
    fuelEstimate,
    heading: Math.round(heading)
  }
  
  // Calculate times if departure time provided
  if (departureTime) {
    estimates.estimatedDepartureTime = departureTime
    estimates.estimatedArrivalTime = new Date(
      departureTime.getTime() + (hours * 60 + minutes) * 60 * 1000
    )
  }
  
  return estimates
}

/**
 * Helper functions
 */
function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

function toDeg(rad: number): number {
  return rad * (180 / Math.PI)
}

/**
 * Cache flight path data
 */
export interface CachedFlightPath {
  departureIATA: string
  arrivalIATA: string
  distance: number
  duration: { hours: number; minutes: number }
  path: Array<[number, number]>
  cruiseAltitude: number
  heading: number
  lastUpdated: Date
}

/**
 * Get or calculate flight path with caching
 */
export async function getFlightPath(
  departureCode: string,
  arrivalCode: string,
  payload: any
): Promise<CachedFlightPath | null> {
  try {
    // Check cache first
    const cacheKey = `${departureCode}-${arrivalCode}`
    const cached = await payload.find({
      collection: 'mapDataCache',
      where: {
        type: { equals: 'flight-path' },
        key: { equals: cacheKey }
      },
      limit: 1
    })
    
    if (cached.docs.length > 0 && cached.docs[0].data) {
      const cacheAge = Date.now() - new Date(cached.docs[0].updatedAt).getTime()
      const thirtyDays = 30 * 24 * 60 * 60 * 1000
      
      if (cacheAge < thirtyDays) {
        return cached.docs[0].data as CachedFlightPath
      }
    }
    
    // Get airports
    const [departure, arrival] = await Promise.all([
      payload.find({
        collection: 'airports',
        where: {
          or: [
            { iata: { equals: departureCode } },
            { icao: { equals: departureCode } }
          ]
        },
        limit: 1
      }),
      payload.find({
        collection: 'airports',
        where: {
          or: [
            { iata: { equals: arrivalCode } },
            { icao: { equals: arrivalCode } }
          ]
        },
        limit: 1
      })
    ])
    
    if (departure.docs.length === 0 || arrival.docs.length === 0) {
      return null
    }
    
    const depAirport = departure.docs[0]
    const arrAirport = arrival.docs[0]
    
    // Calculate estimates
    const estimates = await calculateFlightEstimates(
      {
        iata: depAirport.iata,
        icao: depAirport.icao,
        name: depAirport.name,
        latitude: depAirport.latitude,
        longitude: depAirport.longitude
      },
      {
        iata: arrAirport.iata,
        icao: arrAirport.icao,
        name: arrAirport.name,
        latitude: arrAirport.latitude,
        longitude: arrAirport.longitude
      }
    )
    
    const flightPath: CachedFlightPath = {
      departureIATA: departureCode,
      arrivalIATA: arrivalCode,
      distance: estimates.distance,
      duration: estimates.duration,
      path: estimates.flightPath,
      cruiseAltitude: estimates.cruiseAltitude,
      heading: estimates.heading,
      lastUpdated: new Date()
    }
    
    // Cache the result
    if (cached.docs.length > 0) {
      await payload.update({
        collection: 'mapDataCache',
        id: cached.docs[0].id,
        data: {
          type: 'flight-path',
          key: cacheKey,
          data: flightPath
        }
      })
    } else {
      await payload.create({
        collection: 'mapDataCache',
        data: {
          type: 'flight-path',
          key: cacheKey,
          data: flightPath
        }
      })
    }
    
    return flightPath
  } catch (error) {
    console.error('Error calculating flight path:', error)
    return null
  }
}