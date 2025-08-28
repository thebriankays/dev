import React from 'react'
import dynamic from 'next/dynamic'
import type { TravelGlobeBlockProps, TravelAdvisory, VisaRequirement, MichelinRestaurant, AirportData, FlightRoute, CountryFeature } from './types'

// Dynamic import to avoid SSR issues
const TravelGlobeClient = dynamic(() => import('./TravelGlobe.client'), {
  ssr: false,
  loading: () => (
    <div className="travel-globe-loading">
      <div className="travel-globe-spinner" />
      <p>Loading globe...</p>
    </div>
  ),
})

// Mock data for demonstration
// In production, this would come from Payload collections

const mockAdvisories: TravelAdvisory[] = [
  { countryCode: 'US', countryName: 'United States', level: 1, description: 'Exercise normal precautions', updated: '2024-01-15', risks: [] },
  { countryCode: 'GB', countryName: 'United Kingdom', level: 1, description: 'Exercise normal precautions', updated: '2024-01-15' },
  { countryCode: 'FR', countryName: 'France', level: 2, description: 'Exercise increased caution due to terrorism', updated: '2024-01-15', risks: ['Terrorism'] },
  { countryCode: 'JP', countryName: 'Japan', level: 1, description: 'Exercise normal precautions', updated: '2024-01-15' },
  { countryCode: 'AU', countryName: 'Australia', level: 1, description: 'Exercise normal precautions', updated: '2024-01-15' },
  { countryCode: 'BR', countryName: 'Brazil', level: 2, description: 'Exercise increased caution due to crime', updated: '2024-01-15', risks: ['Crime'] },
  { countryCode: 'IN', countryName: 'India', level: 2, description: 'Exercise increased caution', updated: '2024-01-15' },
  { countryCode: 'RU', countryName: 'Russia', level: 4, description: 'Do not travel', updated: '2024-01-15', risks: ['Armed conflict'] },
  { countryCode: 'CN', countryName: 'China', level: 3, description: 'Reconsider travel', updated: '2024-01-15' },
  { countryCode: 'ZA', countryName: 'South Africa', level: 2, description: 'Exercise increased caution', updated: '2024-01-15' },
]

const mockVisaRequirements: VisaRequirement[] = [
  { countryCode: 'US', countryName: 'United States', requirement: 'visa_required', duration: 90, details: 'B1/B2 visa required' },
  { countryCode: 'GB', countryName: 'United Kingdom', requirement: 'visa_free', duration: 180, details: 'Visa-free for 6 months' },
  { countryCode: 'FR', countryName: 'France', requirement: 'visa_free', duration: 90, details: 'Schengen 90/180 rule' },
  { countryCode: 'JP', countryName: 'Japan', requirement: 'visa_free', duration: 90, details: 'Visa-free for tourism' },
  { countryCode: 'AU', countryName: 'Australia', requirement: 'eta', duration: 90, details: 'ETA required' },
  { countryCode: 'BR', countryName: 'Brazil', requirement: 'visa_on_arrival', duration: 90, details: 'Visa on arrival available' },
  { countryCode: 'IN', countryName: 'India', requirement: 'e_visa', duration: 60, details: 'E-visa available online' },
  { countryCode: 'CN', countryName: 'China', requirement: 'visa_required', duration: 30, details: 'Tourist visa required' },
  { countryCode: 'AE', countryName: 'UAE', requirement: 'visa_on_arrival', duration: 30, details: 'Visa on arrival' },
  { countryCode: 'TH', countryName: 'Thailand', requirement: 'visa_free', duration: 30, details: 'Visa exemption for 30 days' },
]

const mockRestaurants: MichelinRestaurant[] = [
  { id: '1', name: 'The French Laundry', city: 'Yountville', country: 'USA', latitude: 38.4044, longitude: -122.3649, stars: 3, cuisine: 'French', chef: 'Thomas Keller', address: '6640 Washington St' },
  { id: '2', name: 'Eleven Madison Park', city: 'New York', country: 'USA', latitude: 40.7417, longitude: -73.9872, stars: 3, cuisine: 'Contemporary', chef: 'Daniel Humm', address: '11 Madison Ave' },
  { id: '3', name: 'Osteria Francescana', city: 'Modena', country: 'Italy', latitude: 44.6464, longitude: 10.9252, stars: 3, cuisine: 'Italian', chef: 'Massimo Bottura', address: 'Via Stella 22' },
  { id: '4', name: 'El Celler de Can Roca', city: 'Girona', country: 'Spain', latitude: 41.9931, longitude: 2.8080, stars: 3, cuisine: 'Catalan', chef: 'Joan Roca', address: 'Can Sunyer 48' },
  { id: '5', name: 'Sukiyabashi Jiro', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.7646, stars: 3, cuisine: 'Sushi', chef: 'Jiro Ono', address: 'Ginza' },
  { id: '6', name: 'Guy Savoy', city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, stars: 3, cuisine: 'French', chef: 'Guy Savoy', address: 'Monnaie de Paris' },
  { id: '7', name: 'The Fat Duck', city: 'Bray', country: 'UK', latitude: 51.5085, longitude: -0.7013, stars: 3, cuisine: 'Molecular', chef: 'Heston Blumenthal', address: 'High Street' },
  { id: '8', name: 'Alinea', city: 'Chicago', country: 'USA', latitude: 41.9135, longitude: -87.6485, stars: 3, cuisine: 'Modernist', chef: 'Grant Achatz', address: '1723 N Halsted St' },
]

const mockAirports: AirportData[] = [
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA', latitude: 40.6413, longitude: -73.7781, type: 'international', terminals: 6, passengers: 62500000 },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA', latitude: 33.9425, longitude: -118.4081, type: 'international', terminals: 9, passengers: 88000000 },
  { code: 'LHR', name: 'Heathrow', city: 'London', country: 'UK', latitude: 51.4700, longitude: -0.4543, type: 'international', terminals: 4, passengers: 80000000 },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', latitude: 49.0097, longitude: 2.5479, type: 'international', terminals: 3, passengers: 76000000 },
  { code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan', latitude: 35.7720, longitude: 140.3929, type: 'international', terminals: 3, passengers: 44000000 },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE', latitude: 25.2532, longitude: 55.3657, type: 'international', terminals: 3, passengers: 89000000 },
  { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'Singapore', latitude: 1.3644, longitude: 103.9915, type: 'international', terminals: 4, passengers: 68000000 },
  { code: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'Australia', latitude: -33.9461, longitude: 151.1772, type: 'international', terminals: 3, passengers: 44000000 },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany', latitude: 50.0379, longitude: 8.5622, type: 'international', terminals: 2, passengers: 70000000 },
  { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'China', latitude: 22.3080, longitude: 113.9185, type: 'international', terminals: 2, passengers: 71000000 },
]

const mockFlightRoutes: FlightRoute[] = [
  { id: '1', from: 'JFK', to: 'LHR', type: 'direct', frequency: 50 },
  { id: '2', from: 'LAX', to: 'NRT', type: 'direct', frequency: 30 },
  { id: '3', from: 'LHR', to: 'CDG', type: 'direct', frequency: 60 },
  { id: '4', from: 'DXB', to: 'SIN', type: 'direct', frequency: 40 },
  { id: '5', from: 'SYD', to: 'LAX', type: 'direct', frequency: 20 },
  { id: '6', from: 'FRA', to: 'JFK', type: 'direct', frequency: 35 },
  { id: '7', from: 'HKG', to: 'SIN', type: 'direct', frequency: 55 },
  { id: '8', from: 'CDG', to: 'DXB', type: 'direct', frequency: 25 },
  { id: '9', from: 'NRT', to: 'SYD', type: 'direct', frequency: 15 },
  { id: '10', from: 'LHR', to: 'JFK', type: 'direct', frequency: 50 },
]

// Component that loads GeoJSON and renders the globe
export const TravelGlobeComponent: React.FC<TravelGlobeBlockProps> = (props) => {
  const [countryPolygons, setCountryPolygons] = React.useState<CountryFeature[]>([])
  const [loading, setLoading] = React.useState(true)
  
  // Load country GeoJSON data
  React.useEffect(() => {
    // Try to load country borders GeoJSON
    // You can use a CDN or serve it from public folder
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(data => {
        // Convert TopoJSON to GeoJSON if needed
        // For now, using a simplified approach
        // In production, use topojson-client library
        console.log('Loaded country data:', data)
        
        // Fallback to simple mock polygons for testing
        // In production, properly parse the TopoJSON
        setCountryPolygons(mockCountryPolygons)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load country data:', err)
        // Use mock data as fallback
        setCountryPolygons(mockCountryPolygons)
        setLoading(false)
      })
  }, [])
  
  if (loading) {
    return (
      <div className="travel-globe-loading">
        <div className="travel-globe-spinner" />
        <p>Loading geographic data...</p>
      </div>
    )
  }
  
  return (
    <TravelGlobeClient
      enabledViews={props.enabledViews || ['travelAdvisory', 'visaRequirements', 'michelinRestaurants', 'airports']}
      initialView={props.initialView || 'travelAdvisory'}
      
      // Use provided data or mock data
      advisories={props.advisories || mockAdvisories}
      visaData={props.visaRequirements || mockVisaRequirements}
      restaurants={props.restaurants || mockRestaurants}
      airports={props.airports || mockAirports}
      flightRoutes={props.flightRoutes || mockFlightRoutes}
      countryPolygons={countryPolygons}
      
      // Globe settings with defaults - using your actual texture files!
      globeSettings={{
        imageUrl: props.globeSettings?.imageUrl || '/earth-blue-marble.jpg',
        bumpUrl: props.globeSettings?.bumpUrl || '/earth-bump.jpg',
        rotationSpeed: props.globeSettings?.rotationSpeed || 0.5,
        showClouds: props.globeSettings?.showClouds,
        showAtmosphere: props.globeSettings?.showAtmosphere !== false,
        atmosphereColor: props.globeSettings?.atmosphereColor || '#3a7ca5',
      }}
      
      // Glass effects
      glassEffect={props.glassEffect}
      fluidOverlay={props.fluidOverlay}
    />
  )
}

// Simplified mock country polygons for testing
// In production, load real GeoJSON data
const mockCountryPolygons: CountryFeature[] = [
  {
    type: 'Feature',
    properties: {
      NAME: 'United States',
      ISO_A2: 'US',
      ISO_A3: 'USA',
      POP_EST: 331000000,
      GDP_MD_EST: 21433000,
      CONTINENT: 'North America'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-125, 48], [-125, 25], [-66, 25], [-66, 48], [-125, 48]
      ]]
    }
  },
  {
    type: 'Feature',
    properties: {
      NAME: 'United Kingdom',
      ISO_A2: 'GB',
      ISO_A3: 'GBR',
      POP_EST: 67886000,
      GDP_MD_EST: 2827000,
      CONTINENT: 'Europe'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-8, 50], [-8, 59], [2, 59], [2, 50], [-8, 50]
      ]]
    }
  },
  // Add more countries as needed...
  // In production, load complete GeoJSON with all countries
]

export default TravelGlobeComponent
