'use client'

import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import type { VisaRequirement } from '@/blocks/TravelDataGlobeBlock/types'

interface VisaArcsProps {
  visaRequirements: VisaRequirement[]
  passportCountry: string | null
  polygons: any[]
  radius: number
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

// Get country centroid
const getCountryCentroid = (countryName: string, polygons: any[]): [number, number] | null => {
  const poly = polygons.find(p => 
    p.properties?.name?.toLowerCase() === countryName.toLowerCase()
  )
  
  if (!poly?.geometry?.coordinates) return null
  
  try {
    // Simple centroid calculation for the first polygon
    const coords = poly.geometry.type === 'Polygon' 
      ? poly.geometry.coordinates[0]
      : poly.geometry.coordinates[0][0]
    
    let sumLat = 0, sumLng = 0
    coords.forEach(([lng, lat]: number[]) => {
      sumLat += lat
      sumLng += lng
    })
    
    return [sumLat / coords.length, sumLng / coords.length]
  } catch {
    return null
  }
}

// Create arc points between two positions
const createArcPoints = (start: THREE.Vector3, end: THREE.Vector3, height: number = 0.3): THREE.Vector3[] => {
  const points: THREE.Vector3[] = []
  const segments = 32
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    
    // Interpolate between start and end
    const point = new THREE.Vector3().lerpVectors(start, end, t)
    
    // Add arc height
    const arcHeight = Math.sin(t * Math.PI) * height
    point.normalize().multiplyScalar(point.length() + arcHeight)
    
    points.push(point)
  }
  
  return points
}

const VISA_COLORS = {
  visa_free: '#4caf50',
  visa_on_arrival: '#8bc34a',
  e_visa: '#03a9f4',
  eta: '#00bcd4',
  visa_required: '#f4511e',
  no_admission: '#b71c1c',
}

export const VisaArcs: React.FC<VisaArcsProps> = ({
  visaRequirements,
  passportCountry,
  polygons,
  radius
}) => {
  const arcs = useMemo(() => {
    if (!passportCountry || !visaRequirements.length) return []
    
    const arcsData: Array<{
      points: THREE.Vector3[]
      color: string
      requirement: string
    }> = []
    
    // Get passport country position
    const passportPos = getCountryCentroid(passportCountry, polygons)
    if (!passportPos) return []
    
    const startPos = latLngToVector3(passportPos[0], passportPos[1], radius)
    
    // Create arcs to visa-free and visa-on-arrival countries
    visaRequirements
      .filter(req => 
        req.requirement === 'visa_free' || 
        req.requirement === 'visa_on_arrival' ||
        req.requirement === 'e_visa'
      )
      .forEach(req => {
        const destPos = getCountryCentroid(req.destinationCountry, polygons)
        if (!destPos) return
        
        const endPos = latLngToVector3(destPos[0], destPos[1], radius)
        const points = createArcPoints(startPos, endPos, radius * 0.2)
        
        arcsData.push({
          points,
          color: VISA_COLORS[req.requirement] || '#ffffff',
          requirement: req.requirement
        })
      })
    
    return arcsData
  }, [visaRequirements, passportCountry, polygons, radius])
  
  return (
    <group>
      {arcs.map((arc, index) => (
        <Line
          key={index}
          points={arc.points}
          color={arc.color}
          lineWidth={1.5}
          transparent
          opacity={0.6}
        />
      ))}
    </group>
  )
}
