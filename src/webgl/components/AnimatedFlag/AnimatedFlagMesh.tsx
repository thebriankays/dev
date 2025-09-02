'use client'

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const LAYER_Z_POSITIONS = {
  background: -300,
  content: 0,
  overlay: 200
}

// Shaders
const flagVertex = `
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform vec2 uFrequency;
uniform float uTime;
uniform float uStrength;

attribute vec3 position;
attribute vec2 uv;

varying float vDark;
varying vec2 vUv;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Adjust xFactor to affect more of the flag, not just the right edge
    float xFactor = smoothstep(0.0, 1.0, (position.x + 1.5) / 3.0);

    float vWave = sin(modelPosition.x * uFrequency.x - uTime ) * xFactor * uStrength ;
    vWave += sin(modelPosition.y * uFrequency.y - uTime) * xFactor * uStrength * 0.5;
    
    modelPosition.z += vWave;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    vUv = uv;    
    vDark = vWave;
}
`

const flagFragment = `
precision mediump float;

varying float vDark;
uniform sampler2D uTexture;
varying vec2 vUv;

void main(){
    vec4 textColor = texture2D(uTexture, vUv);
    textColor.rgb *= vDark + 0.85;
    gl_FragColor = textColor;
}
`

export interface AnimatedFlagMeshProps {
  position: [number, number, number]
  scale: [number, number, number]
  visible: boolean
  flagImage?: string
  animationSpeed?: number
  wireframe?: boolean
  segments?: number
  frequency?: {
    x: number
    y: number
  }
  strength?: number
  layer?: 'content' | 'background' | 'overlay'
}

export function AnimatedFlagMesh({
  position,
  scale,
  visible,
  flagImage = 'https://i.imgur.com/fokRJkR.jpg',
  animationSpeed = 6,
  wireframe = false,
  segments = 64,
  frequency = { x: 3, y: 2 },
  strength = 0.15,
  layer = 'content'
}: AnimatedFlagMeshProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const materialRef = useRef<THREE.RawShaderMaterial | null>(null)
  const uniformsRef = useRef({
    uTime: null as any,
    uFrequency: null as any,
    uStrength: null as any
  })

  // Use proper z-positioning from layer system
  const zPosition = LAYER_Z_POSITIONS[layer]

  // Query uniforms once
  useEffect(() => {
    if (materialRef.current) {
      uniformsRef.current.uTime = materialRef.current.uniforms.uTime
      uniformsRef.current.uFrequency = materialRef.current.uniforms.uFrequency
      uniformsRef.current.uStrength = materialRef.current.uniforms.uStrength
    }
  }, [])

  // Update position, scale, and visibility from shared canvas
  useEffect(() => {
    if (!groupRef.current) return
    
    groupRef.current.position.set(position[0], position[1], zPosition)
    const containerScale = Math.min(scale[0], scale[1]) * 0.5
    groupRef.current.scale.set(containerScale, containerScale, containerScale)
    groupRef.current.updateMatrix()
    groupRef.current.visible = visible
  }, [position, scale, visible, zPosition])

  // Load texture and create material
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(flagImage, (texture) => {
      texture.anisotropy = 16
      
      const mat = new THREE.RawShaderMaterial({
        vertexShader: flagVertex,
        fragmentShader: flagFragment,
        side: THREE.DoubleSide,
        wireframe: wireframe,
        uniforms: {
          uFrequency: { value: new THREE.Vector2(frequency.x, frequency.y) },
          uTime: { value: 0 },
          uTexture: { value: texture },
          uStrength: { value: strength }
        }
      })
      materialRef.current = mat
      
      // Cache uniform references
      uniformsRef.current.uTime = mat.uniforms.uTime
      uniformsRef.current.uFrequency = mat.uniforms.uFrequency
      uniformsRef.current.uStrength = mat.uniforms.uStrength
    })

    return () => {
      if (materialRef.current) {
        materialRef.current.dispose()
      }
    }
  }, [flagImage, frequency.x, frequency.y, strength, wireframe])

  // Update animation only when visible
  useFrame((state) => {
    if (!visible || !uniformsRef.current.uTime) return
    uniformsRef.current.uTime.value = state.clock.elapsedTime * animationSpeed
  })

  if (!materialRef.current) return null

  return (
    <group ref={groupRef} matrixAutoUpdate={false}>
      {/* Pole */}
      <mesh position={[-0.75, -0.7, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 5, 16]} />
        <meshBasicMaterial color={0x333333} />
      </mesh>

      {/* Flag */}
      <mesh>
        <boxGeometry args={[3, 2, 0.025, segments, segments]} />
        <primitive object={materialRef.current} attach="material" />
      </mesh>
    </group>
  )
}

export default AnimatedFlagMesh