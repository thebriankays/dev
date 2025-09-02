'use client'

import React, { forwardRef } from 'react'
import TravelDataGlobeManual from './TravelDataGlobeManual'
import type {
  PolyAdv,
  VisaPolygon,
  AirportData,
  CountryBorder,
  VisaData,
  MichelinRestaurantData,
} from '@/blocks/TravelDataGlobeBlock/types'

interface TravelDataGlobeProps {
  polygons: Array<PolyAdv | VisaPolygon>
  borders: CountryBorder
  airports: AirportData[]
  restaurants: MichelinRestaurantData[]
  
  globeImageUrl: string
  bumpImageUrl: string
  
  autoRotateSpeed: number
  atmosphereColor: string
  
  onCountryClick: (name: string) => void
  onAirportClick: (airport: AirportData) => void
  onRestaurantClick: (restaurant: MichelinRestaurantData) => void
  onCountryHover: (name: string | null) => void
  
  selectedCountry: string | null
  hoveredCountry: string | null
  currentView: 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'
  visaArcs: VisaData[]
  showMarkers: boolean
}

// Re-export GlobeMethods type
export interface GlobeMethods {
  pauseAnimation: () => void
  resumeAnimation: () => void
  setPointOfView: (coords: { lat: number; lng: number; altitude?: number }) => void
  getGlobeRadius: () => number
  getCoords: (lat: number, lng: number, altitude?: number) => { x: number; y: number; z: number }
  toGeoCoords: (coords: { x: number; y: number; z: number }) => { lat: number; lng: number; altitude: number }
  focusOnLocation: (polygon: { geometry?: { type: string; coordinates: any } }) => void
}

const TravelDataGlobe = forwardRef<GlobeMethods | undefined, TravelDataGlobeProps>((props, ref) => {
  // Simply forward all props to the manual implementation
  // Rename borders to _borders to match the manual component's interface
  const { borders, ...otherProps } = props
  return <TravelDataGlobeManual ref={ref} {...otherProps} _borders={borders} />
})

TravelDataGlobe.displayName = 'TravelDataGlobe'

export default TravelDataGlobe