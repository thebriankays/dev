'use client'

import React from 'react'
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
  selectedCountryCode: string | null
  hoveredCountry: string | null
  passportCountry: string | null
  currentView: 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'
  visaArcs: VisaData[]
  focusTarget: { lat: number; lng: number } | null
  showMarkers: boolean
}

const TravelDataGlobe: React.FC<TravelDataGlobeProps> = (props) => {
  return (
    <TravelDataGlobeManual
      {...props}
      visaRequirements={props.visaArcs || []}
      atmosphereAltitude={0.15}
    />
  )
}

export default TravelDataGlobe
