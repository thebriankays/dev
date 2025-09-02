import * as THREE from 'three'

/**
 * Convert latitude/longitude to 3D coordinates on a sphere
 */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - lat)
  const theta = THREE.MathUtils.degToRad(lng + 180)
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  
  return new THREE.Vector3(x, y, z)
}

/**
 * Convert 3D coordinates back to latitude/longitude
 */
export function vector3ToLatLng(position: THREE.Vector3): { lat: number; lng: number; altitude: number } {
  const radius = position.length()
  const lat = 90 - THREE.MathUtils.radToDeg(Math.acos(position.y / radius))
  const lng = THREE.MathUtils.radToDeg(Math.atan2(position.z, -position.x)) - 180
  
  return { lat, lng, altitude: radius }
}

/**
 * Create points for a curved arc between two positions on the globe
 */
export function createArcPoints(
  startPos: THREE.Vector3,
  endPos: THREE.Vector3,
  altitude: number = 0.2,
  segments: number = 64
): THREE.Vector3[] {
  // Calculate midpoint
  const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5)
  
  // Push midpoint outward to create arc
  const midLength = midPoint.length()
  midPoint.normalize().multiplyScalar(midLength * (1 + altitude))
  
  // Create quadratic bezier curve
  const curve = new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos)
  
  return curve.getPoints(segments)
}

/**
 * Calculate great circle distance between two lat/lng points
 */
export function greatCircleDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => deg * (Math.PI / 180)
  const R = 6371 // Earth radius in km
  
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

/**
 * Get centroid of a polygon
 */
export function getCentroid(polygon: {
  geometry?: {
    type: string
    coordinates: any // Using any here due to complex nested array types
  }
}): [number, number] | null {
  if (!polygon || !polygon.geometry || !polygon.geometry.coordinates) return null
  
  let coords: number[][] = []
  
  if (polygon.geometry.type === 'Polygon') {
    // Polygon coordinates are [[[lng, lat], [lng, lat], ...]]
    const polygonCoords = polygon.geometry.coordinates as number[][][]
    coords = polygonCoords[0] || []
  } else if (polygon.geometry.type === 'MultiPolygon') {
    // MultiPolygon coordinates are [[[[lng, lat], [lng, lat], ...]]]
    const multiPolygonCoords = polygon.geometry.coordinates as number[][][][]
    // For MultiPolygon, take the largest polygon
    let maxArea = 0
    let largestPolygon: number[][][] = multiPolygonCoords[0] || []
    
    multiPolygonCoords.forEach((poly: number[][][]) => {
      const area = poly[0]?.length || 0
      if (area > maxArea) {
        maxArea = area
        largestPolygon = poly
      }
    })
    
    coords = largestPolygon[0] || []
  }
  
  if (coords.length === 0) return null
  
  // Calculate centroid
  let sumLng = 0
  let sumLat = 0
  
  coords.forEach(([lng, lat]) => {
    sumLng += lng
    sumLat += lat
  })
  
  return [sumLng / coords.length, sumLat / coords.length]
}