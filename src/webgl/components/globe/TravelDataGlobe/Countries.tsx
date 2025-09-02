'use client'

import React, { useMemo } from 'react'
import * as THREE from 'three'
import type { PolyAdv, VisaPolygon } from '@/blocks/TravelDataGlobeBlock/types'

interface CountriesProps {
  polygons: Array<PolyAdv | VisaPolygon>
  radius: number
  getColor: (poly: PolyAdv | VisaPolygon) => string
  onCountryClick?: (name: string) => void
  onCountryHover?: (name: string | null) => void
}

// Convert lat/lng to 3D position on sphere
const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  
  return new THREE.Vector3(x, y, z)
}

// Simple line-based country outlines for now
const createCountryOutline = (
  coordinates: number[][][],
  radius: number,
  color: string,
  name: string
): THREE.Line | null => {
  try {
    // Use the outer ring
    const outerRing = coordinates[0]
    if (!outerRing || outerRing.length < 3) return null
    
    const points: THREE.Vector3[] = []
    
    // Convert coordinates to 3D points on sphere
    outerRing.forEach(([lng, lat]) => {
      points.push(latLngToVector3(lat, lng, radius))
    })
    
    // Close the loop
    if (points.length > 0) {
      points.push(points[0].clone())
    }
    
    // Create line geometry
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    
    // Create material
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    })
    
    const line = new THREE.Line(geometry, material)
    line.name = name
    
    return line
  } catch (error) {
    console.warn(`Failed to create outline for ${name}:`, error)
    return null
  }
}

export const Countries: React.FC<CountriesProps> = ({
  polygons,
  radius,
  getColor,
  onCountryClick,
  onCountryHover
}) => {
  // Create country outlines
  const countryOutlines = useMemo(() => {
    const outlines: THREE.Line[] = []
    
    polygons.forEach((polygon) => {
      if (!polygon.geometry?.coordinates || !polygon.properties?.name) return
      
      const color = getColor(polygon)
      
      if (polygon.geometry.type === 'Polygon') {
        const line = createCountryOutline(
          polygon.geometry.coordinates,
          radius * 1.001, // Slightly above globe surface
          color,
          polygon.properties.name
        )
        if (line) outlines.push(line)
      } else if (polygon.geometry.type === 'MultiPolygon') {
        polygon.geometry.coordinates.forEach((poly, idx) => {
          const line = createCountryOutline(
            poly,
            radius * 1.001,
            color,
            `${polygon.properties.name}_${idx}`
          )
          if (line) {
            line.userData.countryName = polygon.properties.name
            outlines.push(line)
          }
        })
      }
    })
    
    return outlines
  }, [polygons, radius, getColor])
  
  return (
    <group>
      {countryOutlines.map((outline, index) => (
        <primitive key={index} object={outline} />
      ))}
    </group>
  )
}
