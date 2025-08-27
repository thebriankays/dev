// OpenFlights Data Service
// Provides fast lookups for airline and airport information

interface AirlineInfo {
  name: string
  iata: string | null
  icao: string | null
  callsign: string | null
  country: string
}

interface AirportInfo {
  name: string
  city: string
  country: string
  iata: string | null
  icao: string | null
  lat: number
  lng: number
  tz: string
}

// OpenFlights runtime data will be loaded dynamically
let runtimeData: { airlines: Record<string, AirlineInfo>; airports: Record<string, AirportInfo> } = { airlines: {}, airports: {} }

if (typeof window === 'undefined') {
  try {
    // Use dynamic import for server-side
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    runtimeData = require('./openflights-runtime.json')
  } catch (error) {
    console.log('OpenFlights runtime data not found. Run the data loader first.')
  }
}

class OpenFlightsService {
  private airlines: Record<string, AirlineInfo>
  private airports: Record<string, AirportInfo>
  
  constructor() {
    this.airlines = runtimeData.airlines as Record<string, AirlineInfo>
    this.airports = runtimeData.airports as Record<string, AirportInfo>
  }
  
  /**
   * Find airline by callsign, IATA, or ICAO code
   */
  findAirline(code: string): AirlineInfo | null {
    if (!code) return null
    
    // Try direct lookup
    const upperCode = code.toUpperCase().trim()
    if (this.airlines[upperCode]) {
      return this.airlines[upperCode]
    }
    
    // Try removing numbers from callsign (e.g., "AAL123" -> "AAL")
    const baseCallsign = upperCode.replace(/\d+$/, '')
    if (baseCallsign && this.airlines[baseCallsign]) {
      return this.airlines[baseCallsign]
    }
    
    // Search by callsign prefix
    for (const [key, airline] of Object.entries(this.airlines)) {
      if (airline.callsign && upperCode.startsWith(airline.callsign)) {
        return airline
      }
    }
    
    return null
  }
  
  /**
   * Find airport by IATA or ICAO code
   */
  findAirport(code: string): AirportInfo | null {
    if (!code) return null
    
    const upperCode = code.toUpperCase().trim()
    return this.airports[upperCode] || null
  }
  
  /**
   * Get formatted airport name with code
   */
  getAirportDisplay(code: string): string {
    const airport = this.findAirport(code)
    if (!airport) return code
    
    return `${airport.name} (${code})`
  }
  
  /**
   * Enrich flight data with airline and airport information
   */
  enrichFlight(flight: any): any {
    const enriched = { ...flight }
    
    // Enrich airline data
    if (flight.callsign) {
      const airline = this.findAirline(flight.callsign)
      if (airline) {
        enriched.airline = airline.name
        enriched.airline_iata = airline.iata
        enriched.airline_icao = airline.icao
        enriched.airline_country = airline.country
      }
    }
    
    // Enrich departure airport
    if (flight.departureAirportCode) {
      const airport = this.findAirport(flight.departureAirportCode)
      if (airport) {
        enriched.departureAirport = this.getAirportDisplay(flight.departureAirportCode)
        enriched.departureCity = airport.city
        enriched.departureCountry = airport.country
        enriched.departureTimezone = airport.tz
      }
    }
    
    // Enrich arrival airport
    if (flight.arrivalAirportCode || flight.destinationAirportCode) {
      const code = flight.arrivalAirportCode || flight.destinationAirportCode
      const airport = this.findAirport(code)
      if (airport) {
        enriched.destinationAirport = this.getAirportDisplay(code)
        enriched.arrivalCity = airport.city
        enriched.arrivalCountry = airport.country
        enriched.arrivalTimezone = airport.tz
      }
    }
    
    return enriched
  }
  
  /**
   * Get statistics about the loaded data
   */
  getStats() {
    return {
      airlines: Object.keys(this.airlines).length,
      airports: Object.keys(this.airports).length
    }
  }
}

// Singleton instance
let instance: OpenFlightsService | null = null

export function getOpenFlightsService(): OpenFlightsService {
  if (!instance) {
    instance = new OpenFlightsService()
  }
  return instance
}

// Export types
export type { AirlineInfo, AirportInfo }