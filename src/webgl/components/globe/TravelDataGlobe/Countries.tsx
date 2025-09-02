import React, { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { latLngToVector3 } from './utils'
import type { PolyAdv, VisaPolygon } from '@/blocks/TravelDataGlobeBlock/types'

interface CountriesProps {
  polygons: Array<PolyAdv | VisaPolygon>
  radius: number
  getColor: (poly: PolyAdv | VisaPolygon) => string
  onCountryClick?: (name: string) => void
  onCountryHover?: (name: string | null) => void
}

export const Countries: React.FC<CountriesProps> = ({
  polygons,
  radius,
  getColor,
  onCountryClick,
  onCountryHover
}) => {
  const { raycaster, camera, gl } = useThree()
  
  // Convert polygons to mesh geometries
  const countryMeshes = useMemo(() => {
    return polygons.map((polygon) => {
      if (!polygon.geometry || !polygon.geometry.coordinates) return null
      
      const vertices: THREE.Vector3[] = []
      const color = getColor(polygon)
      
      // Handle different geometry types
      if (polygon.geometry.type === 'Polygon') {
        const coords = polygon.geometry.coordinates[0]
        coords.forEach(([lng, lat]) => {
          vertices.push(latLngToVector3(lat, lng, radius * 1.002))
        })
      } else if (polygon.geometry.type === 'MultiPolygon') {
        polygon.geometry.coordinates.forEach(poly => {
          const coords = poly[0]
          coords.forEach(([lng, lat]) => {
            vertices.push(latLngToVector3(lat, lng, radius * 1.002))
          })
        })
      }
      
      if (vertices.length < 3) return null
      
      // Create shape from vertices
      const shape = new THREE.Shape()
      vertices.forEach((v, i) => {
        if (i === 0) {
          shape.moveTo(v.x, v.y)
        } else {
          shape.lineTo(v.x, v.y)
        }
      })
      
      const geometry = new THREE.ShapeGeometry(shape)
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      })
      
      return {
        geometry,
        material,
        name: polygon.properties.name,
        polygon
      }
    }).filter(Boolean)
  }, [polygons, radius, getColor])
  
  // Handle mouse interactions
  React.useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const mouse = new THREE.Vector2()
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1
      
      raycaster.setFromCamera(mouse, camera)
      
      // Check intersections with country meshes
      const hoveredCountryName: string | null = null
      
      // Here you would check raycaster intersections with country meshes
      // This is simplified - you'd need to track mesh references
      
      if (onCountryHover) {
        onCountryHover(hoveredCountryName)
      }
    }
    
    const handleClick = (event: PointerEvent) => {
      const mouse = new THREE.Vector2()
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1
      
      raycaster.setFromCamera(mouse, camera)
      
      // Check intersections and trigger click
      // This is simplified - you'd need to track mesh references
    }
    
    gl.domElement.addEventListener('pointermove', handlePointerMove)
    gl.domElement.addEventListener('click', handleClick)
    
    return () => {
      gl.domElement.removeEventListener('pointermove', handlePointerMove)
      gl.domElement.removeEventListener('click', handleClick)
    }
  }, [raycaster, camera, gl, onCountryHover, onCountryClick])
  
  // For now, return a simple overlay
  // In a full implementation, you'd render individual country meshes
  return (
    <group>
      {countryMeshes.map((country, index) => {
        if (!country) return null
        return (
          <mesh 
            key={index}
            geometry={country.geometry}
            material={country.material}
            onClick={() => onCountryClick?.(country.name)}
          />
        )
      })}
    </group>
  )
}
