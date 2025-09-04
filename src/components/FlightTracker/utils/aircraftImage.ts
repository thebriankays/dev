// Aircraft image utilities

// Get aircraft image from photo API
export async function getAircraftImage(
  registration: string | undefined,
  icao24: string,
  aircraft: string | undefined
): Promise<{ url: string } | null> {
  try {
    // Try to get image from photo API
    if (registration || icao24) {
      const response = await fetch(`/api/flights/photo?${registration ? `registration=${registration}` : `icao24=${icao24}`}`)
      if (response.ok) {
        const data = await response.json()
        if (data.photo_url) {
          return { url: data.photo_url }
        }
      }
    }
    
    // Fallback to generic aircraft type images
    if (aircraft) {
      const lowerAircraft = aircraft.toLowerCase()
      
      // Map of common aircraft types to fallback images
      const aircraftImages: Record<string, string> = {
        'a319': 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?w=800&q=80',
        'a320': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
        'a321': 'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=800&q=80',
        'a330': 'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=800&q=80',
        'a350': 'https://images.unsplash.com/photo-1610642372651-fe6e7bc209e0?w=800&q=80',
        'a380': 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800&q=80',
        '737': 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800&q=80',
        '747': 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800&q=80',
        '777': 'https://images.unsplash.com/photo-1594058573823-d8edf1ad3380?w=800&q=80',
        '787': 'https://images.unsplash.com/photo-1623040522601-cc2c736ce562?w=800&q=80',
      }
      
      // Check each aircraft type
      for (const [key, url] of Object.entries(aircraftImages)) {
        if (lowerAircraft.includes(key)) {
          return { url }
        }
      }
    }
    
    // Return null if no image found
    return null
    
  } catch (error) {
    console.error('Error getting aircraft image:', error)
    return null
  }
}

// Get airline logo from CDN
export function getAirlineLogo(
  airline: string | undefined,
  iata: string | undefined,
  icao: string | undefined
): string | null {
  // Try IATA code first (most common for logos)
  if (iata && iata.length === 2) {
    // Use a CDN that hosts airline logos
    return `https://pics.avs.io/200/200/${iata.toUpperCase()}.png`
  }
  
  // Map common ICAO codes to IATA codes
  const icaoToIata: Record<string, string> = {
    'AAL': 'AA', // American Airlines
    'ACA': 'AC', // Air Canada
    'AFR': 'AF', // Air France
    'ASA': 'AS', // Alaska Airlines
    'JBU': 'B6', // JetBlue
    'BAW': 'BA', // British Airways
    'DAL': 'DL', // Delta
    'UAE': 'EK', // Emirates
    'DLH': 'LH', // Lufthansa
    'KLM': 'KL', // KLM
    'QTR': 'QR', // Qatar Airways
    'SIA': 'SQ', // Singapore Airlines
    'UAL': 'UA', // United
    'SWA': 'WN', // Southwest
  }
  
  // Try ICAO mapping
  if (icao && icaoToIata[icao.toUpperCase()]) {
    const iataCode = icaoToIata[icao.toUpperCase()]
    return `https://pics.avs.io/200/200/${iataCode}.png`
  }
  
  // No logo found
  return null
}