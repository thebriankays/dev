export interface Destination {
  id: string
  name: string
  position: {
    lat: number
    lng: number
  }
  visitors?: number
  category: 'city' | 'beach' | 'mountain' | 'historic' | 'adventure'
  description?: string
  imageUrl?: string
}

export interface FlightRoute {
  id: string
  from: string
  to: string
  flights?: number
  type: 'direct' | 'popular' | 'seasonal'
}

export interface GlobeSettings {
  interactive?: boolean
  autoRotate?: boolean
  rotationSpeed?: number
  showAtmosphere?: boolean
  showClouds?: boolean
  showNightLights?: boolean
  enableFilters?: boolean
}

export interface Appearance {
  globeColor?: string
  landColor?: string
  atmosphereColor?: string
  markerColor?: string
  routeColor?: string
}

export interface CustomTextures {
  earthTexture?: string
  bumpTexture?: string
  specularTexture?: string
  cloudTexture?: string
}

// Travel Advisory Types (from old website)
export interface AdvisoryCountry {
  name: string
  level: 1 | 2 | 3 | 4
  description: string
  dateAdded?: string
  country?: {
    code?: string
    name?: string
    flag?: string
  }
}

export interface PolyAdv {
  type: 'Feature'
  properties: {
    name: string
    [key: string]: any // Allow additional properties
  }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
  level: 1 | 2 | 3 | 4
  dateAdded?: string
  country?: {
    code?: string
    name?: string
    flag?: string
  }
}

// Visa Types
export type VisaRequirementCode = 
  | 'visa_free'
  | 'visa_on_arrival'
  | 'e_visa'
  | 'eta'
  | 'visa_required'
  | 'no_admission'

export interface VisaPolygon {
  type: 'Feature'
  properties: {
    name: string
    [key: string]: any // Allow additional properties
  }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
  requirement: VisaRequirementCode
}

export interface CountryVisaData {
  countryId: string
  countryName: string
  countryCode: string
  visaFreeCount: number
  totalDestinations: number
  visaRequirements: Array<{
    destinationCountry: string
    requirement: VisaRequirementCode
  }>
}

export interface VisaData {
  passportCountry: string
  destinationCountry: string
  requirement: VisaRequirementCode
}

// Airport Types
export interface AirportData {
  id: string
  name: string
  iataCode?: string
  icaoCode?: string
  city?: string
  country?: {
    code?: string
    name?: string
    flag?: string
  }
  location: {
    lat: number
    lng: number
  }
  type?: string
}

// Restaurant Types
export interface MichelinRestaurantData {
  id: string
  name: string
  rating?: number // 1, 2, or 3 stars
  greenStar?: boolean
  city?: string
  country?: {
    code?: string
    name?: string
    flag?: string
  }
  location: {
    lat: number
    lng: number
  }
  cuisine?: string
  priceRange?: string
  description?: string
  website?: string
  link?: string
}

// Country Border Type
export interface CountryBorder {
  type: 'Feature'
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
  properties: Record<string, any>
}

// Filter Options
export interface FilterOptions {
  categories: string[]
  minVisitors: number
  showRoutes: boolean
}

// Props Types
export interface TravelGlobeProps {
  enabledViews: Array<'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'>
  initialView: 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'
  advisoryPolygons: PolyAdv[]
  advisories: AdvisoryCountry[]
  visaPolygons: VisaPolygon[]
  countries: CountryVisaData[]
  airports: AirportData[]
  michelinRestaurants: MichelinRestaurantData[]
  borders: CountryBorder
  globeImageUrl: string
  bumpImageUrl: string
  autoRotateSpeed: number
  atmosphereColor: string
  atmosphereAltitude: number
  glassTabTint?: 'none' | 'light' | 'medium' | 'dark'
  glassTabOpacity?: number
  glassTabBlur?: number
  glassTabGlimmer?: boolean
  glassTabInteriorShadow?: boolean
  glassTabBorderStyle?: 'none' | 'subtle' | 'prominent'
  tabIndicatorColor?: string
  glassPanelTint?: 'none' | 'light' | 'medium' | 'dark'
  glassPanelOpacity?: number
  glassPanelBlur?: number
  glassPanelBorderStyle?: 'none' | 'subtle' | 'prominent'
}
