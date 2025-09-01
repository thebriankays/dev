'use client'

import React, { useRef, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { AlienHead } from './AlienHead'

// Scene setup component
export function AlienScene() {
  const controlsRef = useRef<any>(null)
  
  useFrame((state) => {
    if (controlsRef.current) {
      // More noticeable oscillation on the polar angle (vertical tilt)
      const t = state.clock.elapsedTime
      const oscillation = Math.sin(t * 0.5) * 0.3 // Increased speed and amplitude
      controlsRef.current.setPolarAngle(Math.PI / 2 + oscillation)
    }
  })
  
  return (
    <>
      <OrbitControls 
        ref={controlsRef}
        enableDamping={true}
        enablePan={false}
        autoRotate={true}
        autoRotateSpeed={1.0}
        minDistance={8}
        maxDistance={20}
        target={[0, 0, 0]}
        minPolarAngle={Math.PI / 2 - 0.5}  // More tilt up
        maxPolarAngle={Math.PI / 2 + 0.5}  // More tilt down
      />
      <ambientLight intensity={1.0} />
      <directionalLight position={[2, 2, 2]} intensity={2.0} />
      <directionalLight position={[-2, -2, -2]} intensity={1.0} />
      <Suspense fallback={null}>
        <AlienHead />
      </Suspense>
    </>
  )
}