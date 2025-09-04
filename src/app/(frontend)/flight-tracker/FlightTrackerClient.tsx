'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamic import to avoid SSR issues with map components
const FlightTracker = dynamic(
  () => import('@/components/FlightTracker').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Flight Tracker...</p>
        </div>
      </div>
    )
  }
)

interface FlightTrackerClientProps {
  enableSearch?: boolean
  enableGeolocation?: boolean
  defaultLocation?: { lat: number; lng: number }
  searchRadius?: number
}

export default function FlightTrackerClient({
  enableSearch = true,
  enableGeolocation = true,
  defaultLocation = { lat: 40.7128, lng: -74.0060 }, // Default to NYC
  searchRadius = 2
}: FlightTrackerClientProps) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Initializing Flight Tracker...</p>
          </div>
        </div>
      }>
        <FlightTracker
          enableSearch={enableSearch}
          enableGeolocation={enableGeolocation}
          defaultLocation={defaultLocation}
          searchRadius={searchRadius}
        />
      </Suspense>
    </div>
  )
}