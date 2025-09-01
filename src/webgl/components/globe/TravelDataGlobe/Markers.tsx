'use client'

import React, { useMemo, useRef } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { latLngToVector3 } from './utils'

// Extend THREE to include Text geometry
extend({ TextGeometry: THREE.BufferGeometry })

interface MarkerData {
  lat: number
  lng: number
  label?: string
  color?: string
  size?: number
}

interface MarkersProps {
  data: MarkerData[]
  radius: number
  showLabels?: boolean
}

// Create sprite texture for labels
function createLabelTexture(text: string, color = '#ffffff', bgColor = 'rgba(0,0,0,0.7)'): THREE.Texture {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  
  const fontSize = 48
  const padding = 20
  
  context.font = `${fontSize}px Arial, sans-serif`
  const metrics = context.measureText(text)
  const textWidth = Math.ceil(metrics.width)
  
  canvas.width = textWidth + padding * 2
  canvas.height = fontSize + padding * 2
  
  // Background
  context.fillStyle = bgColor
  context.fillRect(0, 0, canvas.width, canvas.height)
  
  // Text
  context.fillStyle = color
  context.font = `${fontSize}px Arial, sans-serif`
  context.textBaseline = 'middle'
  context.textAlign = 'center'
  context.fillText(text, canvas.width / 2, canvas.height / 2)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  
  return texture
}

interface MarkerLabelProps {
  position: THREE.Vector3
  text: string
  color?: string
}

const MarkerLabel: React.FC<MarkerLabelProps> = ({ position, text, color = '#ffffff' }) => {
  const spriteRef = useRef<THREE.Sprite>(null)
  
  const texture = useMemo(() => createLabelTexture(text, color), [text, color])
  
  useFrame(({ camera }) => {
    if (spriteRef.current) {
      // Keep sprite facing camera
      spriteRef.current.quaternion.copy(camera.quaternion)
    }
  })
  
  // Calculate sprite scale based on texture dimensions
  const scale = useMemo(() => {
    const aspect = texture.image.width / texture.image.height
    const baseScale = 0.3
    return [baseScale * aspect, baseScale, 1]
  }, [texture])
  
  return (
    <sprite ref={spriteRef} position={position.toArray()} scale={scale as [number, number, number]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  )
}

export const Markers: React.FC<MarkersProps> = ({ data, radius, showLabels = true }) => {
  const markers = useMemo(() => {
    return data.map(marker => ({
      ...marker,
      position: latLngToVector3(marker.lat, marker.lng, radius + 0.01)
    }))
  }, [data, radius])
  
  return (
    <group>
      {markers.map((marker, index) => (
        <group key={index}>
          {/* Marker point */}
          <mesh position={marker.position}>
            <sphereGeometry args={[marker.size || 0.015, 16, 16]} />
            <meshStandardMaterial
              color={marker.color || '#ff0000'}
              emissive={marker.color || '#ff0000'}
              emissiveIntensity={0.5}
            />
          </mesh>
          
          {/* Label */}
          {showLabels && marker.label && (
            <MarkerLabel
              position={marker.position.clone().multiplyScalar(1.05)}
              text={marker.label}
              color={marker.color}
            />
          )}
        </group>
      ))}
    </group>
  )
}