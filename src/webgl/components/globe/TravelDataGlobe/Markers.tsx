'use client'

import React, { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { latLngToVector3 } from './utils'
import type { AirportData, MichelinRestaurantData } from '@/blocks/TravelDataGlobeBlock/types'

interface MarkerData {
  id: string
  lat: number
  lng: number
  label: string
  data: unknown
  color: string
  size: number
  type: 'airport' | 'restaurant'
}

interface MarkersProps {
  data: MarkerData[]
  radius: number
  onMarkerClick?: (marker: MarkerData) => void
  showLabels?: boolean
}

// Individual marker component
const Marker: React.FC<{
  marker: MarkerData
  position: THREE.Vector3
  onClick?: () => void
  showLabel?: boolean
}> = ({ marker, position, onClick, showLabel }) => {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  
  // Animate on hover
  useFrame(() => {
    if (meshRef.current) {
      const scale = hovered ? 1.5 : 1
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1)
      
      // Billboard effect - always face camera
      if (hovered && showLabel) {
        meshRef.current.lookAt(camera.position)
      }
    }
  })
  
  return (
    <group position={position}>
      {/* Pin/Marker */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        {marker.type === 'airport' ? (
          // Airport marker - like a location pin
          <coneGeometry args={[marker.size * 0.7, marker.size * 2, 8]} />
        ) : (
          // Restaurant marker - star shape
          <octahedronGeometry args={[marker.size, 0]} />
        )}
        <meshPhongMaterial
          color={marker.color}
          emissive={marker.color}
          emissiveIntensity={hovered ? 0.8 : 0.4}
        />
      </mesh>
      
      {/* Tooltip on hover */}
      {hovered && (
        <Html
          position={[0, marker.size * 3, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'var(--font-fk-grotesk-neue)',
              whiteSpace: 'nowrap',
              border: `1px solid ${marker.color}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ fontWeight: 600 }}>{marker.label}</div>
            {marker.type === 'airport' && (
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                {(marker.data as AirportData).code} • {(marker.data as AirportData).location.city}
              </div>
            )}
            {marker.type === 'restaurant' && (
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                {'⭐'.repeat((marker.data as MichelinRestaurantData).rating)} • {(marker.data as MichelinRestaurantData).cuisine}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

export const Markers: React.FC<MarkersProps> = ({ 
  data, 
  radius, 
  onMarkerClick,
  showLabels = false 
}) => {
  const markers = useMemo(() => {
    return data.map(marker => ({
      ...marker,
      position: latLngToVector3(marker.lat, marker.lng, radius + 0.015)
    }))
  }, [data, radius])
  
  return (
    <group>
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          marker={marker}
          position={marker.position}
          onClick={() => onMarkerClick?.(marker)}
          showLabel={showLabels}
        />
      ))}
    </group>
  )
}
