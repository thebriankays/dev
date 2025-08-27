export interface Destination {
  id: string
  name: string
  position: [number, number] // [latitude, longitude]
  visitors: number
  category: 'city' | 'beach' | 'mountain' | 'historic' | 'nature'
  description?: string
  image?: string
  popularActivities?: string[]
}

export interface FlightRoute {
  id: string
  from: string // destination id
  to: string // destination id
  frequency: number // flights per week
  popularity: number // 0-100
  averagePrice?: number
  duration?: number // in hours
}

export interface FilterOptions {
  categories: string[]
  minVisitors: number
  showRoutes: boolean
  searchQuery?: string
}

export interface GlobeControls {
  enableRotate: boolean
  enableZoom: boolean
  enablePan: boolean
  minDistance: number
  maxDistance: number
  rotateSpeed: number
  zoomSpeed: number
  panSpeed: number
}

export interface ParticleOptions {
  count: number
  size: number
  speed: number
  color: string
  opacity: number
  trail: boolean
  trailLength: number
}