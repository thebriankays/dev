'use client'

import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { latLngToVector3, createArcPoints } from './utils'

interface ArcData {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color?: string
  altitude?: number
  dashLength?: number
  dashGap?: number
  dashAnimateTime?: number
}

interface ArcsProps {
  data: ArcData[]
  radius: number
}

interface AnimatedArcProps {
  points: THREE.Vector3[]
  color: string
  dashLength: number
  dashGap: number
  animateTime: number
}

const AnimatedArc: React.FC<AnimatedArcProps> = ({ 
  points, 
  color, 
  dashLength = 0.4,
  dashGap = 0.2,
  animateTime = 2000 
}) => {
  const materialRef = useRef<THREE.LineDashedMaterial>(null)
  
  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [points])
  
  useFrame(({ clock }) => {
    if (materialRef.current && animateTime > 0) {
      const time = clock.getElapsedTime() * 1000
      const phase = (time % animateTime) / animateTime
      // Animate by changing dash scale
      materialRef.current.scale = 1 + phase * 0.5
    }
  })
  
  const line = useMemo(() => {
    const mat = new THREE.LineDashedMaterial({
      color: new THREE.Color(color),
      dashSize: dashLength,
      gapSize: dashGap,
      transparent: true,
      opacity: 0.8,
      scale: 1
    })
    const lineObj = new THREE.Line(geometry, mat)
    lineObj.computeLineDistances()
    return lineObj
  }, [geometry, color, dashLength, dashGap])
  
  return (
    <primitive 
      object={line} 
      onUpdate={(self: THREE.Line) => {
        if (materialRef.current !== self.material) {
          materialRef.current = self.material as THREE.LineDashedMaterial
        }
      }}
    />
  )
}

export const Arcs: React.FC<ArcsProps> = ({ data, radius }) => {
  const arcs = useMemo(() => {
    return data.map(arc => {
      const startPos = latLngToVector3(arc.startLat, arc.startLng, radius)
      const endPos = latLngToVector3(arc.endLat, arc.endLng, radius)
      const points = createArcPoints(startPos, endPos, arc.altitude || 0.15)
      
      return {
        points,
        color: arc.color || '#ffaa00',
        dashLength: arc.dashLength || 0.4,
        dashGap: arc.dashGap || 0.2,
        animateTime: arc.dashAnimateTime || 2000
      }
    })
  }, [data, radius])
  
  return (
    <group>
      {arcs.map((arc, index) => (
        <AnimatedArc
          key={index}
          points={arc.points}
          color={arc.color}
          dashLength={arc.dashLength}
          dashGap={arc.dashGap}
          animateTime={arc.animateTime}
        />
      ))}
    </group>
  )
}