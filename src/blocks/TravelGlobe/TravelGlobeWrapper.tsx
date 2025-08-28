'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { TravelGlobeBlockProps } from './types'

// Dynamic import with ssr: false in a Client Component
const TravelGlobeClient = dynamic(() => import('./TravelGlobe.client'), {
  ssr: false,
  loading: () => (
    <div className="travel-globe-loading">
      <div className="travel-globe-spinner" />
      <p>Loading globe...</p>
    </div>
  ),
})

interface TravelGlobeWrapperProps extends TravelGlobeBlockProps {
  // Additional props that include fetched data
  advisories?: any[]
  visaData?: any[]
  restaurants?: any[]
  airports?: any[]
  flightRoutes?: any[]
  countryPolygons?: any[]
}

export const TravelGlobeWrapper: React.FC<TravelGlobeWrapperProps> = (props) => {
  return <TravelGlobeClient {...props} />
}

export default TravelGlobeWrapper