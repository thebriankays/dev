import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { FlightMapProps } from './types'

// Dynamic import for map providers to reduce initial bundle size
const MapboxMap = dynamic(() => import('./MapboxMap'), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map...</div>,
})

interface ExtendedFlightMapProps extends FlightMapProps {
  selectedFlightRoute?: any
  weatherData?: any
}

const FlightMap2D: React.FC<ExtendedFlightMapProps> = (props) => {
  const [mapProvider] = useState<'mapbox'>('mapbox')

  // Use Mapbox as the primary map provider
  return <MapboxMap {...props} />
}

export default FlightMap2D
