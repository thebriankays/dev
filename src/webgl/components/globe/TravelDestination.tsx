import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import type { Destination } from './types'

interface TravelDestinationProps {
  destination: Destination
  position: THREE.Vector3
  isHovered: boolean
  isSelected: boolean
  onHover: (id: string | null) => void
  onClick: () => void
}

export function TravelDestination({
  destination,
  position,
  isHovered,
  isSelected,
  onHover,
  onClick,
}: TravelDestinationProps) {
  const markerRef = useRef<THREE.Group>(null)
  const pulseRef = useRef<THREE.Mesh>(null)
  const [showLabel, setShowLabel] = useState(false)

  // Animation state
  const targetScale = useRef(1.0)
  const currentScale = useRef(1.0)
  const targetPulseScale = useRef(1.5)
  const currentPulseScale = useRef(1.5)

  // Update animation targets
  useEffect(() => {
    targetScale.current = isHovered ? 1.5 : 1.0
    targetPulseScale.current = isHovered || isSelected ? 2.0 : 1.5
  }, [isHovered, isSelected])

  // Marker color based on category
  const markerColor = useMemo(() => {
    const colors = {
      city: '#FF6B6B',
      beach: '#4ECDC4',
      mountain: '#95E1D3',
      historic: '#F38181',
      nature: '#A8E6CF',
    }
    return colors[destination.category] || '#FFFFFF'
  }, [destination.category])

  // Calculate marker size based on visitor count
  const markerSize = useMemo(() => {
    const minSize = 0.02
    const maxSize = 0.08
    const minVisitors = 1000000
    const maxVisitors = 50000000
    
    const normalized = (destination.visitors - minVisitors) / (maxVisitors - minVisitors)
    return minSize + (maxSize - minSize) * Math.min(1, Math.max(0, normalized))
  }, [destination.visitors])

  // Animation
  useFrame((state, delta) => {
    if (!markerRef.current) return

    // Smooth scale animation
    currentScale.current += (targetScale.current - currentScale.current) * 0.1
    currentPulseScale.current += (targetPulseScale.current - currentPulseScale.current) * 0.1

    // Pulsing animation
    if (pulseRef.current) {
      const time = state.clock.elapsedTime
      const pulseAnimation = 1 + Math.sin(time * 2) * 0.1
      pulseRef.current.scale.setScalar(currentPulseScale.current * pulseAnimation)
    }
    
    // Make marker face camera
    markerRef.current.lookAt(state.camera.position)
    
    // Show label when close enough or hovered
    const distance = markerRef.current.position.distanceTo(state.camera.position)
    setShowLabel(distance < 5 || isHovered || isSelected)
  })

  return (
    <group
      ref={markerRef}
      position={position}
      onPointerEnter={() => onHover(destination.id)}
      onPointerLeave={() => onHover(null)}
      onClick={onClick}
    >
      {/* Main marker */}
      <mesh scale={currentScale.current}>
        <sphereGeometry args={[markerSize, 16, 16]} />
        <meshStandardMaterial
          color={markerColor}
          emissive={markerColor}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Pulse effect */}
      <mesh ref={pulseRef}>
        <ringGeometry args={[markerSize * 1.5, markerSize * 2, 32]} />
        <meshBasicMaterial
          color={markerColor}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Label */}
      {showLabel && (
        <group position={[0, markerSize * 2, 0]}>
          <Text
            fontSize={0.08}
            color="white"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.01}
            outlineColor="black"
          >
            {destination.name}
          </Text>
          <Text
            fontSize={0.06}
            color="#cccccc"
            anchorX="center"
            anchorY="top"
            position={[0, -0.02, 0]}
          >
            {(destination.visitors / 1000000).toFixed(1)}M visitors
          </Text>
        </group>
      )}

      {/* Selection ring */}
      {isSelected && (
        <mesh>
          <torusGeometry args={[markerSize * 3, markerSize * 0.3, 8, 32]} />
          <meshBasicMaterial color={markerColor} />
        </mesh>
      )}
    </group>
  )
}