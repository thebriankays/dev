'use client'

import React, { forwardRef } from 'react'
import TravelDataGlobeManual, { GlobeMethods } from './TravelDataGlobeManual'
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
  atmosphereAltitude: number
  
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

const TravelDataGlobe = forwardRef<GlobeMethods | undefined, TravelDataGlobeProps>((props, ref) => {
  // Simply forward all props to the manual implementation
  return <TravelDataGlobeManual ref={ref} {...props} />
})

TravelDataGlobe.displayName = 'TravelDataGlobe'

export default TravelDataGlobe