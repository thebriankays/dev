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

const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return new THREE.Vector3(x, y, z)
}

const createCountryOutline = (
  coordinates: number[][][],
  radius: number,
  color: string,
  name: string
): THREE.Line | null => {
  try {
    const outer = coordinates[0]
    if (!outer || outer.length < 3) return null
    const points: THREE.Vector3[] = []
    outer.forEach(([lng, lat]) => points.push(latLngToVector3(lat, lng, radius)))
    if (points.length > 0) points.push(points[0].clone())
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.85 })
    const line = new THREE.Line(geometry, material)
    line.name = name
    line.userData.countryName = name
    return line
  } catch (e) {
    console.warn(`Failed outline for ${name}:`, e)
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
  const countryOutlines = useMemo(() => {
    const outlines: THREE.Line[] = []
    polygons.forEach((polygon) => {
      if (!polygon.geometry?.coordinates || !polygon.properties?.name) return
      const color = getColor(polygon)
      if (polygon.geometry.type === 'Polygon') {
        const line = createCountryOutline(polygon.geometry.coordinates as any, radius * 1.001, color, polygon.properties.name)
        if (line) outlines.push(line)
      } else if (polygon.geometry.type === 'MultiPolygon') {
        ;(polygon.geometry.coordinates as any[]).forEach((poly, idx) => {
          const line = createCountryOutline(poly, radius * 1.001, color, `${polygon.properties.name}_${idx}`)
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
      {countryOutlines.map((outline, i) => {
        const countryName: string = outline.userData?.countryName || outline.name?.replace(/_\d+$/, '') || 'Unknown'
        return (
          <primitive
            key={i}
            object={outline}
            onPointerOver={(e: any) => { e.stopPropagation(); onCountryHover?.(countryName); document.body.style.cursor = 'pointer' }}
            onPointerOut={(e: any) => { e.stopPropagation(); onCountryHover?.(null); document.body.style.cursor = 'auto' }}
            onClick={(e: any) => { e.stopPropagation(); onCountryClick?.(countryName) }}
          />
        )
      })}
    </group>
  )
}
