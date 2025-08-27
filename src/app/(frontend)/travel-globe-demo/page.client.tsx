'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import './demo.scss'

const TravelDataGlobeWrapper = dynamic(
  () => import('@/webgl/components/globe').then(mod => mod.TravelDataGlobeWrapper),
  { 
    ssr: false,
    loading: () => (
      <div className="globe-loading">
        <div className="globe-spinner" />
        <p>Loading Globe...</p>
      </div>
    )
  }
)

// Extended demo data
const demoDestinations = [
  // Major Cities
  { id: 'nyc', name: 'New York City', position: [40.7128, -74.0060] as [number, number], visitors: 62800000, category: 'city' as const, description: 'The city that never sleeps' },
  { id: 'paris', name: 'Paris', position: [48.8566, 2.3522] as [number, number], visitors: 38000000, category: 'city' as const, description: 'City of Light' },
  { id: 'tokyo', name: 'Tokyo', position: [35.6762, 139.6503] as [number, number], visitors: 31900000, category: 'city' as const, description: 'Modern metropolis' },
  { id: 'london', name: 'London', position: [51.5074, -0.1278] as [number, number], visitors: 30000000, category: 'city' as const, description: 'Historic capital' },
  { id: 'dubai', name: 'Dubai', position: [25.2048, 55.2708] as [number, number], visitors: 16700000, category: 'city' as const, description: 'Desert oasis' },
  { id: 'singapore', name: 'Singapore', position: [1.3521, 103.8198] as [number, number], visitors: 14700000, category: 'city' as const, description: 'Garden city' },
  { id: 'sydney', name: 'Sydney', position: [-33.8688, 151.2093] as [number, number], visitors: 13900000, category: 'city' as const, description: 'Harbor city' },
  
  // Historic Sites
  { id: 'rome', name: 'Rome', position: [41.9028, 12.4964] as [number, number], visitors: 10000000, category: 'historic' as const, description: 'Eternal city' },
  { id: 'athens', name: 'Athens', position: [37.9838, 23.7275] as [number, number], visitors: 6500000, category: 'historic' as const, description: 'Cradle of democracy' },
  { id: 'cairo', name: 'Cairo', position: [30.0444, 31.2357] as [number, number], visitors: 8000000, category: 'historic' as const, description: 'Ancient pyramids' },
  
  // Beach Destinations
  { id: 'bali', name: 'Bali', position: [-8.4095, 115.1889] as [number, number], visitors: 6300000, category: 'beach' as const, description: 'Island paradise' },
  { id: 'maldives', name: 'Maldives', position: [3.2028, 73.2207] as [number, number], visitors: 1700000, category: 'beach' as const, description: 'Tropical haven' },
  { id: 'cancun', name: 'Cancun', position: [21.1619, -86.8515] as [number, number], visitors: 5000000, category: 'beach' as const, description: 'Caribbean coast' },
  
  // Mountain Destinations
  { id: 'swiss-alps', name: 'Swiss Alps', position: [46.8182, 8.2275] as [number, number], visitors: 3500000, category: 'mountain' as const, description: 'Alpine wonderland' },
  { id: 'himalayas', name: 'Himalayas', position: [28.5983, 83.9311] as [number, number], visitors: 2000000, category: 'mountain' as const, description: 'Roof of the world' },
  
  // Nature
  { id: 'amazon', name: 'Amazon', position: [-3.4653, -62.2159] as [number, number], visitors: 1200000, category: 'nature' as const, description: 'Rainforest' },
  { id: 'serengeti', name: 'Serengeti', position: [-2.3333, 34.8333] as [number, number], visitors: 800000, category: 'nature' as const, description: 'Wildlife sanctuary' },
]

const demoRoutes = [
  // Major routes
  { id: 'nyc-london', from: 'nyc', to: 'london', frequency: 185, popularity: 95 },
  { id: 'london-paris', from: 'london', to: 'paris', frequency: 120, popularity: 90 },
  { id: 'tokyo-singapore', from: 'tokyo', to: 'singapore', frequency: 90, popularity: 85 },
  { id: 'dubai-london', from: 'dubai', to: 'london', frequency: 75, popularity: 80 },
  { id: 'nyc-paris', from: 'nyc', to: 'paris', frequency: 65, popularity: 75 },
  { id: 'sydney-singapore', from: 'sydney', to: 'singapore', frequency: 55, popularity: 70 },
  { id: 'london-dubai', from: 'london', to: 'dubai', frequency: 45, popularity: 65 },
  { id: 'paris-rome', from: 'paris', to: 'rome', frequency: 40, popularity: 60 },
  { id: 'tokyo-sydney', from: 'tokyo', to: 'sydney', frequency: 35, popularity: 55 },
  { id: 'singapore-bali', from: 'singapore', to: 'bali', frequency: 30, popularity: 50 },
]

export default function TravelGlobeDemoClient() {
  const [selectedDestination, setSelectedDestination] = useState<any>(null)
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [settings, setSettings] = useState({
    autoRotate: true,
    showAtmosphere: true,
    showClouds: true,
    showNightLights: true,
  })

  const handleDestinationClick = (destination: any) => {
    setSelectedDestination(destination)
    setSelectedRoute(null)
  }

  const handleRouteClick = (route: any) => {
    setSelectedRoute(route)
    setSelectedDestination(null)
  }

  return (
    <main className="travel-globe-demo">
      <div className="demo-header">
        <h1>Travel Data Globe</h1>
        <p>Interactive 3D visualization of global travel destinations and flight routes</p>
      </div>

      <div className="globe-container">
        <TravelDataGlobeWrapper
          destinations={demoDestinations}
          routes={demoRoutes}
          autoRotate={settings.autoRotate}
          showAtmosphere={settings.showAtmosphere}
          showClouds={settings.showClouds}
          showNightLights={settings.showNightLights}
          onDestinationClick={handleDestinationClick}
          onRouteClick={handleRouteClick}
        />
      </div>

      {/* Settings Panel */}
      <div className="settings-panel">
        <h3>Display Settings</h3>
        <label>
          <input
            type="checkbox"
            checked={settings.autoRotate}
            onChange={(e) => setSettings({ ...settings, autoRotate: e.target.checked })}
          />
          Auto Rotate
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.showAtmosphere}
            onChange={(e) => setSettings({ ...settings, showAtmosphere: e.target.checked })}
          />
          Atmosphere Glow
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.showClouds}
            onChange={(e) => setSettings({ ...settings, showClouds: e.target.checked })}
          />
          Cloud Layer
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.showNightLights}
            onChange={(e) => setSettings({ ...settings, showNightLights: e.target.checked })}
          />
          Night Lights
        </label>
      </div>

      {/* Info Panel */}
      {(selectedDestination || selectedRoute) && (
        <div className="info-panel">
          {selectedDestination && (
            <>
              <h3>{selectedDestination.name}</h3>
              <p className="info-description">{selectedDestination.description}</p>
              <div className="info-stats">
                <div className="stat">
                  <span className="stat-label">Annual Visitors</span>
                  <span className="stat-value">
                    {(selectedDestination.visitors / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Category</span>
                  <span className="stat-value">{selectedDestination.category}</span>
                </div>
              </div>
            </>
          )}
          
          {selectedRoute && (
            <>
              <h3>Flight Route</h3>
              <p className="route-info">
                {selectedRoute.from.toUpperCase()} → {selectedRoute.to.toUpperCase()}
              </p>
              <div className="info-stats">
                <div className="stat">
                  <span className="stat-label">Weekly Flights</span>
                  <span className="stat-value">{selectedRoute.frequency}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Popularity</span>
                  <span className="stat-value">{selectedRoute.popularity}%</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="instructions">
        <h4>Controls:</h4>
        <ul>
          <li>Click and drag to rotate the globe</li>
          <li>Scroll to zoom in/out</li>
          <li>Click on markers to view destination details</li>
          <li>Use filters to explore specific categories</li>
        </ul>
      </div>
    </main>
  )
}