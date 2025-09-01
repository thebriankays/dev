// Import types from the payload-main directory
import type { Feature, Polygon, MultiPolygon } from 'geojson'

// Travel advisory types
export interface PolyAdv
  extends Feature<Polygon | MultiPolygon, { name: string; iso_a2?: string }> {
  level: 1 | 2 | 3 | 4
  dateAdded?: string
  country?: { name: string; code?: string; flag?: string }
}

// Visa types
export type VisaRequirementCode =
  | 'visa_free'
  | 'visa_on_arrival'
  | 'e_visa'
  | 'eta'
  | 'visa_required'
  | 'no_admission'

export interface VisaPolygon extends Feature<Polygon | MultiPolygon, { name: string }> {
  requirement: VisaRequirementCode
  days?: number
  notes?: string
}

export interface AdvisoryCountry {
  country: string
  countryFlag?: string
  level: 1 | 2 | 3 | 4
  advisoryText?: string
  dateAdded: string
}

export interface CountryVisaData {
  countryId: string
  countryName: string
  countryCode?: string
  countryFlag?: string
  totalDestinations: number
  visaRequirements: VisaData[]
}

export interface TravelAdvisory {
  name: string
  level: 1 | 2 | 3 | 4
  description: string
  dateAdded?: string
  country?: { name: string; code?: string; flag?: string }
}

export interface VisaData {
  passportCountry: string
  destinationCountry: string
  destinationCountryCode?: string
  destinationCountryFlag?: string
  requirement: VisaRequirementCode
  allowedStay?: string
  notes?: string
}

export interface VisaRequirement {
  destinationCountry: string
  requirement: VisaRequirementCode
  days?: number
  notes?: string
}

// Airport types
export interface AirportData {
  code: string
  name: string
  location: {
    lat: number
    lng: number
    city: string
    country: string
    countryFlag?: string
  }
}

// Country border type
export type CountryBorder = Feature<Polygon | MultiPolygon, { iso_a2: string; name?: string }>

// Restaurant types
export interface MichelinRestaurantData {
  id: string
  name: string
  rating: number
  cuisine: string
  location: {
    lat: number
    lng: number
    city: string
    country: string
    countryFlag?: string
  }
  greenStar?: boolean
  description?: string
}

export interface TravelDataGlobeBlockConfig {
  globeImageUrl?: string
  bumpImageUrl?: string
  autoRotateSpeed?: number
  atmosphereColor?: string
  atmosphereAltitude?: number
  enableGlassEffect?: boolean
  enabledViews?: Array<'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'>
  initialView?: 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'
  marqueeText?: string
  tabIndicatorColor?: string
}

export interface TravelDataGlobeBlockProps {
  blockConfig: TravelDataGlobeBlockConfig
  polygons: Array<PolyAdv | VisaPolygon>
  borders: CountryBorder
  airports: AirportData[]
  restaurants: MichelinRestaurantData[]
  travelAdvisories: AdvisoryCountry[]
  visaRequirements: CountryVisaData[]
}