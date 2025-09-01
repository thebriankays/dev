'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SimplexNoise, createBlackMatcap, createNeonMatcap, centerGeometry } from './utils'
import type { GLTF } from 'three-stdlib'

interface AlienGLTF extends GLTF {
  nodes: {
    mesh_0?: THREE.Mesh
  }
}

interface Presets {
  transitionLevel: { value: number }
  black: { value: THREE.Texture }
  neon: { value: THREE.Texture }
}

// Three.js component using the optimized model structure
export function AlienHead() {
  const meshRef = useRef<THREE.Group>(null)
  const presetsRef = useRef<Presets>(null)
  
  // Use the new optimized structure with proper typing
  const gltf = useGLTF('/alien-glass.gltf') as AlienGLTF
  const nodes = gltf.nodes
  
  const { simplex, presets, centeredGeometry } = useMemo(() => {
    const blackMatcap = createBlackMatcap()
    const neonMatcap = createNeonMatcap()
    const simplex = new SimplexNoise()
    
    // Create presets object exactly like the original
    const presets = {
      transitionLevel: { value: 0.5 },
      black: { value: blackMatcap },
      neon: { value: neonMatcap }
    }
    
    // Center the geometry so it rotates around its center
    let centeredGeometry = null
    if (nodes?.mesh_0?.geometry) {
      centeredGeometry = nodes.mesh_0.geometry.clone()
      centerGeometry(centeredGeometry)
    }
    
    return { simplex, presets, centeredGeometry }
  }, [nodes])

  const material = useMemo(() => {
    presetsRef.current = presets
    
    const material = new THREE.MeshMatcapMaterial({
      matcap: presets.black.value,
    })
    
    // Apply custom shader with proper typing
    material.onBeforeCompile = (shader: { uniforms: any; vertexShader: string; fragmentShader: string }) => {
        shader.uniforms.transitionLevel = presets.transitionLevel
        shader.uniforms.matcap2 = presets.neon
        
        shader.vertexShader = `
          varying vec4 vClipPos;
          ${shader.vertexShader}
        `.replace(
          `vViewPosition = - mvPosition.xyz;`,
          `vViewPosition = - mvPosition.xyz;
           vClipPos = gl_Position;`
        )

        shader.fragmentShader = `
          uniform float transitionLevel;
          uniform sampler2D matcap2;
          varying vec4 vClipPos;
          ${shader.fragmentShader}
        `.replace(
          `vec4 matcapColor = texture2D( matcap, uv );`,
          `
          vec4 mc1 = texture( matcap, uv );
          vec4 mc2 = texture( matcap2, uv );
          
          vec2 clipUV = (vClipPos.xy / vClipPos.w) * 0.5 + 0.5;
          
          vec4 matcapColor = mix(mc1, mc2, smoothstep(transitionLevel-0.1, transitionLevel+0.1, clipUV.y));
          `
        )
    }
    
    return material
  }, [presets])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    // Use SimplexNoise exactly like the original CodePen
    // The key is the frequency and the way SimplexNoise oscillates
    const n = simplex.noise(t * 0.25, Math.PI) * 0.5 + 0.5
    
    if (presetsRef.current) {
      presetsRef.current.transitionLevel.value = n
    }
  })

  // Show a fallback mesh if model isn't loaded
  if (!centeredGeometry) {
    return (
      <group ref={meshRef} position={[0, 0.5, 0]}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="red" />
        </mesh>
      </group>
    )
  }

  return (
    <group ref={meshRef} position={[0, 0.5, 0]}>
      <mesh
        geometry={centeredGeometry}
        material={material}
        // Fix upside-down model
        rotation={[Math.PI, 0, 0]}     // 180° X-axis flip
        scale={[0.005, 0.005, 0.005]}  // Increased scale to make it bigger
        position={[0, 0, 0]}
      />
    </group>
  )
}

// Preload the GLTF model
useGLTF.preload('/alien-glass.gltf')