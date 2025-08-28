export interface Destination {
  id: string
  name: string
  position: {
    lat: number
    lng: number
  }
  category?: 'city' | 'airport' | 'restaurant' | 'landmark'
  description?: string
}

export interface FlightRoute {
  id: string
  from: string  // Airport code
  to: string    // Airport code
  type?: 'direct' | 'connecting' | 'seasonal'
  frequency?: number // Flights per week
}

// Travel Advisory data
export interface TravelAdvisory {
  countryCode: string
  countryName: string
  level: 1 | 2 | 3 | 4  // 1=safe, 4=do not travel
  description: string
  updated: string
  risks?: string[]
}

// Visa requirement data
export interface VisaRequirement {
  countryCode: string
  countryName: string
  requirement: 'visa_free' | 'visa_on_arrival' | 'e_visa' | 'eta' | 'visa_required' | 'no_admission'
  duration?: number // Days allowed
  details?: string
  cost?: number
}

// Michelin restaurant data
export interface MichelinRestaurant {
  id: string
  name: string
  city: string
  country: string
  latitude: number
  longitude: number
  stars: 1 | 2 | 3
  cuisine: string
  chef?: string
  address: string
  phone?: string
  website?: string
  priceRange?: string
}

// Airport data
export interface AirportData {
  code: string // IATA code
  name: string
  city: string
  country: string
  latitude: number
  longitude: number
  type: 'international' | 'domestic' | 'regional'
  terminals?: number
  passengers?: number // Annual
  hub?: string[] // Airlines using as hub
}

// GeoJSON types for country polygons
export interface CountryFeature {
  type: 'Feature'
  properties: {
    NAME: string
    ISO_A2: string
    ISO_A3: string
    POP_EST?: number
    GDP_MD_EST?: number
    CONTINENT?: string
  }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: any
  }
}

// Globe settings
export interface GlobeSettings {
  imageUrl?: string
  bumpUrl?: string
  cloudsUrl?: string
  rotationSpeed?: number
  showAtmosphere?: boolean
  showClouds?: boolean
  atmosphereColor?: string
}

// Main block type
export interface TravelGlobeBlockProps {
  enabledViews?: ('travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports')[]
  initialView?: 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'
  
  // Data collections (would be relationships in Payload)
  advisories?: TravelAdvisory[]
  visaRequirements?: VisaRequirement[]
  restaurants?: MichelinRestaurant[]
  airports?: AirportData[]
  flightRoutes?: FlightRoute[]
  
  // Globe configuration
  globeSettings?: GlobeSettings
  
  // Glass effects (from blockWrapperOptions)
  glassEffect?: {
    enabled?: boolean
    variant?: 'card' | 'panel' | 'subtle' | 'frost' | 'liquid'
    intensity?: number
  }
  
  fluidOverlay?: {
    enabled?: boolean
    intensity?: number
  }
}
