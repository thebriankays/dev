import React from 'react'
import { TravelGlobeClient } from './TravelGlobe.client'

// TODO: Uncomment after running 'pnpm generate:types'
// import type { TravelGlobeBlock as TravelGlobeBlockType } from '@/payload-types'

// Temporary type until payload types are regenerated
type TravelGlobeBlockType = any

// Default mock data for demonstration
const mockDestinations = [
  { id: 'nyc', name: 'New York', position: { lat: 40.7128, lng: -74.0060 }, category: 'city' },
  { id: 'london', name: 'London', position: { lat: 51.5074, lng: -0.1278 }, category: 'city' },
  { id: 'paris', name: 'Paris', position: { lat: 48.8566, lng: 2.3522 }, category: 'city' },
  { id: 'tokyo', name: 'Tokyo', position: { lat: 35.6762, lng: 139.6503 }, category: 'city' },
  { id: 'sydney', name: 'Sydney', position: { lat: -33.8688, lng: 151.2093 }, category: 'city' },
]

const mockRoutes = [
  { id: 'nyc-london', from: 'nyc', to: 'london', type: 'direct' },
  { id: 'london-paris', from: 'london', to: 'paris', type: 'direct' },
  { id: 'paris-tokyo', from: 'paris', to: 'tokyo', type: 'popular' },
]

export const TravelGlobeComponent: React.FC<TravelGlobeBlockType> = (props) => {
  // Transform the block data to match the expected props
  const transformedProps = {
    ...props,
    enabledViews: ['travelAdvisory', 'visaRequirements', 'michelinRestaurants', 'airports'] as const,
    initialView: 'travelAdvisory' as const,
    
    // Use provided data or mock data
    destinations: props.destinations || mockDestinations,
    routes: props.routes || mockRoutes,
    
    // Mock data for now - in production these would come from collections
    advisoryPolygons: [],
    advisories: [],
    visaPolygons: [],
    countries: [],
    airports: [],
    michelinRestaurants: [],
    borders: { type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: [] }, properties: {} },
    
    // Globe settings with defaults
    globeImageUrl: '/textures/globe/earth-day.jpg',
    bumpImageUrl: '/textures/globe/earth-bump.jpg',
    autoRotateSpeed: props.globeSettings?.rotationSpeed || 0.5,
    atmosphereColor: props.appearance?.atmosphereColor || '#60a5fa',
    atmosphereAltitude: 0.15,
    
    // Glass settings
    glassTabTint: props.glassEffect?.variant === 'dark' ? 'dark' : 
                  props.glassEffect?.variant === 'light' ? 'light' : 'medium',
    glassTabOpacity: props.glassEffect?.opacity || 0.85,
    glassTabBlur: props.glassEffect?.blur || 12,
    glassTabGlimmer: props.glassEffect?.shimmer || true,
    glassTabInteriorShadow: true,
    glassTabBorderStyle: props.glassEffect?.borderStyle === 'none' ? 'none' :
                         props.glassEffect?.borderStyle === 'thin' ? 'subtle' : 'prominent',
    tabIndicatorColor: props.appearance?.markerColor || '#81d6e3',
    
    glassPanelTint: props.glassEffect?.variant === 'dark' ? 'dark' :
                    props.glassEffect?.variant === 'light' ? 'light' : 'medium',
    glassPanelOpacity: props.glassEffect?.opacity ? props.glassEffect.opacity * 0.7 : 0.6,
    glassPanelBlur: props.glassEffect?.blur ? props.glassEffect.blur * 0.67 : 8,
    glassPanelBorderStyle: props.glassEffect?.borderStyle === 'none' ? 'none' :
                           props.glassEffect?.borderStyle === 'thin' ? 'subtle' : 'prominent',
  }

  return <TravelGlobeClient {...transformedProps} />
}

export default TravelGlobeComponent
