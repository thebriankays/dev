import React from 'react'
import { TravelDataGlobeBlock } from '@/blocks/TravelDataGlobeBlock/Component'

export default function TestGlobePage() {
  return (
    <div className="min-h-screen bg-black">
      <h1 className="text-white text-center py-8 text-3xl">Travel Data Globe Test</h1>
      <TravelDataGlobeBlock 
        blockConfig={{
          globeImageUrl: '/earth-blue-marble.jpg',
          bumpImageUrl: '/earth-topology.png',
          autoRotateSpeed: 0.5,
          atmosphereColor: '#3a7ca5',
          atmosphereAltitude: 0.15,
          enableGlassEffect: true,
          showTravelAdvisories: true,
          showVisaRequirements: true,
          showAirports: true,
          showMichelinRestaurants: true,
        }}
      />
    </div>
  )
}