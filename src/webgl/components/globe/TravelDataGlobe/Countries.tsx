'use client'

import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
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

// Convert GeoJSON coordinates to vertices on sphere
const geoJsonToVertices = (coordinates: number[][], radius: number): THREE.Vector3[] => {
  return coordinates.map(([lng, lat]) => latLngToVector3(lat, lng, radius))
}

// Create a mesh for a single polygon
const createPolygonMesh = (
  coordinates: number[][][],
  radius: number,
  color: string,
  name: string
): THREE.Mesh | null => {
  try {
    const vertices: THREE.Vector3[] = []
    const indices: number[] = []
    
    // Process each ring (outer boundary and holes)
    coordinates.forEach((ring, ringIndex) => {
      if (ringIndex === 0) {
        // Outer ring - create vertices
        const ringVertices = geoJsonToVertices(ring, radius)
        vertices.push(...ringVertices)
        
        // Simple triangulation for convex polygons
        // For complex polygons, you'd need a proper triangulation algorithm
        if (ringVertices.length >= 3) {
          for (let i = 1; i < ringVertices.length - 1; i++) {
            indices.push(0, i, i + 1)
          }
        }
      }
    })
    
    if (vertices.length < 3) return null
    
    // Create geometry
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(vertices.length * 3)
    vertices.forEach((v, i) => {
      positions[i * 3] = v.x
      positions[i * 3 + 1] = v.y
      positions[i * 3 + 2] = v.z
    })
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    if (indices.length > 0) {
      geometry.setIndex(indices)
    }
    geometry.computeVertexNormals()
    
    // Create material
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = name
    
    return mesh
  } catch (error) {
    console.warn(`Failed to create mesh for ${name}:`, error)
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
  const groupRef = useRef<THREE.Group>(null)
  const hoveredRef = useRef<string | null>(null)
  
  // Create country meshes
  const countryMeshes = useMemo(() => {
    const meshes: THREE.Mesh[] = []
    
    polygons.forEach((polygon) => {
      if (!polygon.geometry?.coordinates || !polygon.properties?.name) return
      
      const color = getColor(polygon)
      
      if (polygon.geometry.type === 'Polygon') {
        const mesh = createPolygonMesh(
          polygon.geometry.coordinates,
          radius * 1.001, // Slightly above globe surface
          color,
          polygon.properties.name
        )
        if (mesh) meshes.push(mesh)
      } else if (polygon.geometry.type === 'MultiPolygon') {
        polygon.geometry.coordinates.forEach((poly, idx) => {
          const mesh = createPolygonMesh(
            poly,
            radius * 1.001,
            color,
            `${polygon.properties.name}_${idx}`
          )
          if (mesh) {
            mesh.userData.countryName = polygon.properties.name
            meshes.push(mesh)
          }
        })
      }
    })
    
    return meshes
  }, [polygons, radius, getColor])
  
  // Handle raycasting for hover/click
  useFrame(({ raycaster, camera, pointer }) => {
    if (!groupRef.current) return
    
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(groupRef.current.children, true)
    
    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh
      const countryName = mesh.userData.countryName || mesh.name
      
      if (hoveredRef.current !== countryName) {
        hoveredRef.current = countryName
        onCountryHover?.(countryName)
      }
      
      document.body.style.cursor = 'pointer'
    } else {
      if (hoveredRef.current !== null) {
        hoveredRef.current = null
        onCountryHover?.(null)
      }
      document.body.style.cursor = 'auto'
    }
  })
  
  return (
    <group 
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation()
        const mesh = e.object as THREE.Mesh
        const countryName = mesh.userData.countryName || mesh.name
        onCountryClick?.(countryName)
      }}
    >
      {countryMeshes.map((mesh, index) => (
        <primitive key={index} object={mesh} />
      ))}
    </group>
  )
}
