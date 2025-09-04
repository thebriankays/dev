export interface Flight {
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
  // Extended fields for prediction and visualization
  predicted_position?: {
    longitude: number
    latitude: number
  }
  interpolated_position?: {
    longitude: number
    latitude: number
  }
  trajectory?: Array<[number, number]>
  // Additional fields for detailed flight info
  departureAirport?: string
  destinationAirport?: string
  // HexDB enriched data
  registration?: string
  aircraft?: string
  aircraft_type?: string
  operator?: string
  airline?: string
  airline_iata?: string
  airline_icao?: string
  photo_url?: string
  // Schedule data (if available from other sources)
  scheduled_departure?: string
  actual_departure?: string
  scheduled_arrival?: string
  estimated_arrival?: string
  // FlightAware enhanced data
  departure_delay?: number
  arrival_delay?: number
  departureGate?: string
  arrivalGate?: string
  route?: string
  flightDuration?: {
    hours: number
    minutes: number
  }
  flightDistance?: number
  flightStatus?: string
  aircraftImage?: string
  // Additional properties from FlightAware
  distance?: string | number
  duration?: {
    hours: number
    minutes: number
  }
  altitude?: number | null  // Note: different from baro_altitude
  speed?: number | string
}

export interface Coordinates {
  lat: number
  lng: number
}

export interface FlightMapProps {
  flights: Flight[]
  selectedFlight: Flight | null
  onSelectFlight: (flight: Flight) => void
  userLocation: Coordinates | null
}

export interface FlightTrackerProps {
  enableSearch?: boolean
  enableGeolocation?: boolean
  defaultLocation?: Coordinates
  searchRadius?: number
}