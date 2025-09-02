'use client'

import React from 'react'
import * as THREE from 'three'
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

// Simple fallback globe without textures
const SimpleFallbackGlobe: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial 
          color="#2a4858"
          specular={new THREE.Color('#111111')}
          shininess={5}
        />
      </mesh>
      {/* Simple cloud layer */}
      <mesh scale={[1.01, 1.01, 1.01]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.1}
        />
      </mesh>
      {/* Atmosphere */}
      <mesh scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color="#4a90e2"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  )
}

const TravelDataGlobe: React.FC<TravelDataGlobeProps> = (props) => {
  const [texturesLoaded, setTexturesLoaded] = React.useState(false)
  
  // Check if textures exist
  React.useEffect(() => {
    const checkTextures = async () => {
      try {
        // Try to preload the textures
        const earthImg = new Image()
        const bumpImg = new Image()
        
        earthImg.src = props.globeImageUrl
        bumpImg.src = props.bumpImageUrl
        
        await Promise.all([
          new Promise((resolve, reject) => {
            earthImg.onload = resolve
            earthImg.onerror = reject
          }),
          new Promise((resolve, reject) => {
            bumpImg.onload = resolve
            bumpImg.onerror = reject
          })
        ])
        
        setTexturesLoaded(true)
      } catch (_error) {
        console.warn('Globe textures not found, using fallback globe')
        setTexturesLoaded(false)
      }
    }
    
    checkTextures()
  }, [props.globeImageUrl, props.bumpImageUrl])
  
  // If textures aren't available, show simple globe
  if (!texturesLoaded) {
    return <SimpleFallbackGlobe />
  }
  
  // Pass visaArcs as visaRequirements and set other missing props for manual component
  const modifiedProps = {
    ...props,
    visaRequirements: props.visaArcs || [],
    passportCountry: null,
    atmosphereAltitude: 0.15
  }
  
  return <TravelDataGlobeManual {...modifiedProps} />
}

export default TravelDataGlobe
