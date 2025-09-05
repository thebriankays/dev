/**
 * Core types for the Flight Tracker application
 */

export interface Coordinates {
  lat: number
  lng: number
}

export interface AirportData {
  id?: string
  name: string
  city?: string
  country?: string
  iata: string
  icao: string
  latitude: number
  longitude: number
  altitude?: number
  timezone?: string
}

export interface Flight {
  icao24: string
  callsign: string | null
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
  
  // Enhanced fields
  airline?: string
  airline_iata?: string
  airline_icao?: string
  aircraft?: string
  registration?: string
  departureAirport?: string | AirportData
  arrivalAirport?: string | AirportData
  destinationAirport?: string | AirportData
  originAirport?: AirportData
  departureGate?: string
  arrivalGate?: string
  scheduled_departure?: string
  scheduled_arrival?: string
  status?: string
  distance?: number
  
  // FlightAware data
  gateDepartureTime?: string
  takeoffTime?: string
  landingTime?: string
  gateArrivalTime?: string
  elapsedTime?: string
  remainingTime?: string
  totalTravelTime?: string
  flownDistance?: number
  remainingDistance?: number
  taxiOut?: string
  taxiIn?: string
  averageDelay?: string
  plannedSpeed?: string
  plannedAltitude?: string
  
  // Weather data
  weatherOrigin?: any
  weatherDestination?: any
  
  // Animation/prediction fields
  predicted_position?: {
    longitude: number
    latitude: number
  }
  interpolated_position?: {
    longitude: number
    latitude: number
  }
  trajectory?: Array<[number, number]>
  display_longitude?: number
  display_latitude?: number
}

export interface FlightMapProps {
  flights: Flight[]
  selectedFlight: Flight | null
  selectedFlightRoute?: any
  onSelectFlight?: (flight: Flight | null) => void
  onMapMove?: (center: Coordinates, zoom: number) => void
  center?: Coordinates
  zoom?: number
  userLocation?: Coordinates | null
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  weatherData?: any
}

export interface MapProvider {
  name: string
  component: React.ComponentType<FlightMapProps>
  available: boolean
}
