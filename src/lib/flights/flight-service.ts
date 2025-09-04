import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Get airline information by IATA or ICAO code
 */
export async function getAirlineByCode(code: string): Promise<Record<string, unknown> | null> {
  if (!code) return null
  
  try {
    const payload = await getPayload({ config })
    
    // Extract potential airline code from callsign
    const airlineCode = code.slice(0, 3).toUpperCase()
    const iataCode = code.slice(0, 2).toUpperCase()
    
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
      return icaoResult.docs[0] as unknown as Record<string, unknown>
    }
    
    // Try IATA code
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
      return iataResult.docs[0] as unknown as Record<string, unknown>
    }
    
    return null
  } catch (error) {
    console.error('Error fetching airline:', error)
    return null
  }
}

/**
 * Get formatted airport display name
 */
export async function getAirportDisplay(code: string): Promise<string> {
  if (!code) return code
  
  try {
    const payload = await getPayload({ config })
    
    // Try IATA code first (3 letters)
    if (code.length === 3) {
      const iataResult = await payload.find({
        collection: 'airports',
        where: {
          iata: {
            equals: code.toUpperCase(),
          },
        },
        limit: 1,
      })
      
      if (iataResult.docs.length > 0 && iataResult.docs[0].name) {
        return iataResult.docs[0].name
      }
    }
    
    // Try ICAO code (4 letters)
    if (code.length === 4) {
      const icaoResult = await payload.find({
        collection: 'airports',
        where: {
          icao: {
            equals: code.toUpperCase(),
          },
        },
        limit: 1,
      })
      
      if (icaoResult.docs.length > 0 && icaoResult.docs[0].name) {
        return icaoResult.docs[0].name
      }
    }
    
    // Return the code if no match found
    return code
  } catch (error) {
    console.error('Error fetching airport:', error)
    return code
  }
}

/**
 * Get aircraft image URL
 * This is a placeholder - in production, this would integrate with aviation photo APIs
 */
export async function getAircraftImage(
  _registration: string | null,
  _icao24?: string | null,
  _aircraftType?: string | null
): Promise<{ url: string; source?: string } | null> {
  // In a production system, this would:
  // 1. Check a local cache/database first
  // 2. Query aviation photo APIs like:
  //    - Planespotters.net API
  //    - JetPhotos API
  //    - Airliners.net
  // 3. Cache the result for future use
  
  // For now, return null to indicate no image available
  return null
}

/**
 * Get airline logo URL
 */
export function getAirlineLogo(
  airline: string | null,
  iata?: string | null,
  icao?: string | null
): string | null {
  if (!airline && !iata && !icao) return null
  
  // Try common airline logo services
  if (iata && iata.length === 2) {
    // Use a CDN that hosts airline logos
    return `https://pics.avs.io/200/200/${iata}.png`
  }
  
  return null
}