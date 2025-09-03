import * as THREE from 'three'

/**
 * Convert latitude/longitude to 3D position on sphere
 */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  
  return new THREE.Vector3(x, y, z)
}

/**
 * Get arc points for visa connections
 */
export function getArcPoints(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  radius: number,
  segments: number = 50
): THREE.Vector3[] {
  const start = latLngToVector3(startLat, startLng, radius)
  const end = latLngToVector3(endLat, endLng, radius)
  
  const points: THREE.Vector3[] = []
  const altitude = 1.2 // Arc height multiplier
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const point = new THREE.Vector3().lerpVectors(start, end, t)
    
    // Add altitude to create arc
    const dist = 1 + Math.sin(t * Math.PI) * altitude * 0.1
    point.multiplyScalar(dist)
    
    points.push(point)
  }
  
  return points
}