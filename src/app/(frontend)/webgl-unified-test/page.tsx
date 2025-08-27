'use client'

import React from 'react'
import { BlockWrapper } from '@/blocks/_shared/BlockWrapper'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Simple rotating cube to test WebGL rendering
function RotatingCube() {
  const meshRef = React.useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta
      meshRef.current.rotation.y += delta * 0.5
    }
  })
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  )
}

export default function UnifiedTestPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-20">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-10">
          Unified Canvas Test
        </h1>
        
        {/* Test 1: Basic WebGL content in BlockWrapper */}
        <section className="mb-20">
          <BlockWrapper
            className="h-96"
            glassEffect={{ enabled: true, variant: 'panel' }}
            webglContent={<RotatingCube />}
          >
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Rotating Cube Test</h2>
              <p className="text-white/80">This tests the unified canvas with a simple rotating cube</p>
            </div>
          </BlockWrapper>
        </section>
        
        {/* Test 2: Multiple blocks with different WebGL content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <BlockWrapper
            className="h-64"
            glassEffect={{ enabled: true, variant: 'card' }}
            webglContent={
              <mesh>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial color="#4080ff" />
              </mesh>
            }
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-white">Sphere</h3>
              <p className="text-white/70">Blue sphere with glass card effect</p>
            </div>
          </BlockWrapper>
          
          <BlockWrapper
            className="h-64"
            glassEffect={{ enabled: true, variant: 'frost' }}
            webglContent={
              <mesh>
                <torusGeometry args={[0.5, 0.2, 16, 32]} />
                <meshStandardMaterial color="#ff8040" />
              </mesh>
            }
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-white">Torus</h3>
              <p className="text-white/70">Orange torus with frost effect</p>
            </div>
          </BlockWrapper>
        </div>
        
        {/* Test 3: Console log to verify context */}
        <div className="mt-10 p-4 bg-black/50 rounded">
          <p className="text-white font-mono text-sm">
            Open console to verify single canvas context is working.
            All blocks should render to the same canvas.
          </p>
        </div>
      </div>
    </div>
  )
}