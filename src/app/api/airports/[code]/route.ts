import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// Common airport data for quick lookups when not in database
interface CommonAirport {
  name: string
  lat: number
  lon: number
  timezone: string
}

const COMMON_AIRPORTS: Record<string, CommonAirport> = {
  // Major US airports
  'ATL': { name: 'Hartsfield-Jackson Atlanta Intl', lat: 33.6367, lon: -84.4281, timezone: 'America/New_York' },
  'LAX': { name: 'Los Angeles Intl', lat: 33.9425, lon: -118.4081, timezone: 'America/Los_Angeles' },
  'ORD': { name: "Chicago O'Hare Intl", lat: 41.9786, lon: -87.9048, timezone: 'America/Chicago' },
  'DFW': { name: 'Dallas/Fort Worth Intl', lat: 32.8968, lon: -97.0380, timezone: 'America/Chicago' },
  'DEN': { name: 'Denver Intl', lat: 39.8617, lon: -104.6732, timezone: 'America/Denver' },
  'JFK': { name: 'John F Kennedy Intl', lat: 40.6413, lon: -73.7781, timezone: 'America/New_York' },
  'SFO': { name: 'San Francisco Intl', lat: 37.6213, lon: -122.3790, timezone: 'America/Los_Angeles' },
  'SEA': { name: 'Seattle-Tacoma Intl', lat: 47.4502, lon: -122.3088, timezone: 'America/Los_Angeles' },
  'LAS': { name: 'Harry Reid Intl', lat: 36.0840, lon: -115.1537, timezone: 'America/Los_Angeles' },
  'MCO': { name: 'Orlando Intl', lat: 28.4294, lon: -81.3089, timezone: 'America/New_York' },
  'EWR': { name: 'Newark Liberty Intl', lat: 40.6895, lon: -74.1745, timezone: 'America/New_York' },
  'PHX': { name: 'Phoenix Sky Harbor Intl', lat: 33.4343, lon: -112.0116, timezone: 'America/Phoenix' },
  'IAH': { name: 'George Bush Intercontinental', lat: 29.9902, lon: -95.3368, timezone: 'America/Chicago' },
  'MIA': { name: 'Miami Intl', lat: 25.7959, lon: -80.2870, timezone: 'America/New_York' },
  'BOS': { name: 'Logan Intl', lat: 42.3656, lon: -71.0096, timezone: 'America/New_York' },
  'MSP': { name: 'Minneapolis-St Paul Intl', lat: 44.8848, lon: -93.2223, timezone: 'America/Chicago' },
  'DTW': { name: 'Detroit Metro Wayne County', lat: 42.2162, lon: -83.3554, timezone: 'America/Detroit' },
  'FLL': { name: 'Fort Lauderdale-Hollywood Intl', lat: 26.0742, lon: -80.1506, timezone: 'America/New_York' },
  'PHL': { name: 'Philadelphia Intl', lat: 39.8744, lon: -75.2424, timezone: 'America/New_York' },
  'LGA': { name: 'LaGuardia', lat: 40.7769, lon: -73.8740, timezone: 'America/New_York' },
  
  // Major international airports
  'LHR': { name: 'London Heathrow', lat: 51.4700, lon: -0.4543, timezone: 'Europe/London' },
  'CDG': { name: 'Charles de Gaulle', lat: 49.0097, lon: 2.5479, timezone: 'Europe/Paris' },
  'FRA': { name: 'Frankfurt', lat: 50.0379, lon: 8.5622, timezone: 'Europe/Berlin' },
  'AMS': { name: 'Amsterdam Schiphol', lat: 52.3105, lon: 4.7683, timezone: 'Europe/Amsterdam' },
  'MAD': { name: 'Adolfo Suárez Madrid–Barajas', lat: 40.4983, lon: -3.5676, timezone: 'Europe/Madrid' },
  'BCN': { name: 'Barcelona–El Prat', lat: 41.2974, lon: 2.0833, timezone: 'Europe/Madrid' },
  'FCO': { name: 'Leonardo da Vinci–Fiumicino', lat: 41.8003, lon: 12.2389, timezone: 'Europe/Rome' },
  'MUC': { name: 'Munich', lat: 48.3537, lon: 11.7750, timezone: 'Europe/Berlin' },
  'ZRH': { name: 'Zurich', lat: 47.4647, lon: 8.5492, timezone: 'Europe/Zurich' },
  'VIE': { name: 'Vienna Intl', lat: 48.1103, lon: 16.5697, timezone: 'Europe/Vienna' },
  
  // Asia
  'NRT': { name: 'Narita Intl', lat: 35.7653, lon: 140.3854, timezone: 'Asia/Tokyo' },
  'HND': { name: 'Haneda', lat: 35.5494, lon: 139.7798, timezone: 'Asia/Tokyo' },
  'PEK': { name: 'Beijing Capital Intl', lat: 40.0799, lon: 116.6031, timezone: 'Asia/Shanghai' },
  'PVG': { name: 'Shanghai Pudong Intl', lat: 31.1443, lon: 121.8083, timezone: 'Asia/Shanghai' },
  'HKG': { name: 'Hong Kong Intl', lat: 22.3080, lon: 113.9185, timezone: 'Asia/Hong_Kong' },
  'ICN': { name: 'Incheon Intl', lat: 37.4602, lon: 126.4407, timezone: 'Asia/Seoul' },
  'SIN': { name: 'Singapore Changi', lat: 1.3644, lon: 103.9915, timezone: 'Asia/Singapore' },
  'BKK': { name: 'Suvarnabhumi', lat: 13.6900, lon: 100.7501, timezone: 'Asia/Bangkok' },
  'KUL': { name: 'Kuala Lumpur Intl', lat: 2.7456, lon: 101.7072, timezone: 'Asia/Kuala_Lumpur' },
  'DXB': { name: 'Dubai Intl', lat: 25.2532, lon: 55.3657, timezone: 'Asia/Dubai' },
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase()
    const payload = await getPayload({ config })
    
    // Check database first
    const result = await payload.find({
      collection: 'airports',
      where: {
        or: [
          { iata: { equals: code } },
          { icao: { equals: code } }
        ]
      },
      limit: 1
    })
    
    if (result.docs.length > 0) {
      const airport = result.docs[0]
      return NextResponse.json({
        code: airport.iata || airport.icao,
        name: airport.name,
        city: airport.city,
        country: typeof airport.country === 'object' ? airport.country.name : airport.country,
        latitude: airport.latitude,
        longitude: airport.longitude,
        elevation: airport.elevation,
        timezone: airport.timezone ? (typeof airport.timezone === 'object' ? (airport.timezone as any).name : airport.timezone) : undefined,
        type: airport.type
      })
    }
    
    // Fallback to common airports
    if (COMMON_AIRPORTS[code]) {
      const airport = COMMON_AIRPORTS[code]
      return NextResponse.json({
        code,
        name: airport.name,
        latitude: airport.lat,
        longitude: airport.lon,
        timezone: airport.timezone,
        source: 'fallback'
      })
    }
    
    // Try to fetch from external API if not found
    try {
      // You could integrate with an airport data API here
      // For now, return not found
      return NextResponse.json({ error: 'Airport not found' }, { status: 404 })
    } catch (error) {
      console.error('Error fetching airport data:', error)
      return NextResponse.json({ error: 'Airport not found' }, { status: 404 })
    }
    
  } catch (error) {
    console.error('Error getting airport data:', error)
    return NextResponse.json({ error: 'Failed to get airport data' }, { status: 500 })
  }
}