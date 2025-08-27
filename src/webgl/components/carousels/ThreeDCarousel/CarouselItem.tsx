'use client'

import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Plane, Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useSpring, animated } from '@react-spring/three'
import type { CarouselItemProps } from './types'

// Import shaders as strings
const carouselVert = `
uniform float uTime;
uniform float uHover;
uniform float uScale;
uniform vec3 uLayoutParams;

varying vec2 vUv;
varying float vDepth;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  
  vec3 pos = position;
  
  float scale = uScale * (1.0 + uHover * 0.1);
  pos *= scale;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDepth = (-mvPosition.z - 500.0) / 1000.0;
  vDepth = clamp(vDepth, 0.0, 1.0);
  
  gl_Position = projectionMatrix * mvPosition;
}
`

const carouselFrag = `
uniform sampler2D uTexture;
uniform float uOpacity;
uniform float uDepthFade;
uniform float uTime;
uniform float uHover;
uniform vec2 uResolution;
uniform float uReflection;

varying vec2 vUv;
varying float vDepth;
varying vec3 vPosition;

void main() {
  vec4 texture = texture2D(uTexture, vUv);
  
  float depthFade = mix(1.0, 0.3, vDepth * uDepthFade);
  
  float glow = 0.0;
  if (uHover > 0.0) {
    vec2 center = vUv - 0.5;
    float dist = length(center);
    glow = (1.0 - dist) * uHover * 0.3;
  }
  
  float reflectionAlpha = 1.0;
  if (uReflection > 0.0) {
    reflectionAlpha = mix(1.0, 0.0, vUv.y * uReflection);
  }
  
  vec3 finalColor = texture.rgb + vec3(glow);
  float finalAlpha = texture.a * uOpacity * depthFade * reflectionAlpha;
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`

export function CarouselItem({
  destination,
  index,
  total,
  layout,
  radius,
  spacing,
  rotation,
  isActive,
  isFocused,
  onClick,
}: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const [hovered, setHovered] = useState(false)
  const { camera } = useThree()
  
  // Load texture
  const texture = useTexture(destination.image)
  
  // Calculate position based on layout
  const position = useMemo(() => {
    const angle = (index / total) * Math.PI * 2 + rotation
    
    switch (layout) {
      case 'circular':
      case 'cylinder':
        return new THREE.Vector3(
          Math.sin(angle) * radius,
          0,
          Math.cos(angle) * radius
        )
      
      case 'helix':
        const helixHeight = spacing * total * 0.3
        const y = (index / total - 0.5) * helixHeight
        return new THREE.Vector3(
          Math.sin(angle) * radius,
          y,
          Math.cos(angle) * radius
        )
      
      case 'wave':
        const waveAmplitude = radius * 0.3
        const waveFreq = 2
        const x = (index / total - 0.5) * spacing * total
        const z = Math.sin((index / total) * Math.PI * waveFreq) * waveAmplitude
        return new THREE.Vector3(x, 0, z)
      
      default:
        return new THREE.Vector3(0, 0, 0)
    }
  }, [index, total, layout, radius, spacing, rotation])
  
  // Calculate rotation to face center (for circular layouts)
  const itemRotation = useMemo(() => {
    if (layout === 'circular' || layout === 'cylinder' || layout === 'helix') {
      const angle = (index / total) * Math.PI * 2 + rotation
      return [0, -angle, 0]
    }
    return [0, 0, 0]
  }, [index, total, layout, rotation])
  
  // Spring animations for smooth transitions
  const { scale, positionOffset } = useSpring({
    scale: isFocused ? 1.3 : (hovered ? 1.1 : 1),
    positionOffset: isFocused ? 200 : 0,
    config: { mass: 1, tension: 170, friction: 26 }
  })
  
  // Shader material
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: carouselVert,
      fragmentShader: carouselFrag,
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uDepthFade: { value: 1 },
        uHover: { value: 0 },
        uScale: { value: 1 },
        uResolution: { value: new THREE.Vector2(512, 768) },
        uReflection: { value: 0 },
        uLayoutParams: { value: new THREE.Vector3(0, 0, 0) }
      },
      transparent: true,
      side: THREE.DoubleSide,
    })
  }, [texture])
  
  // Animation frame updates
  useFrame((state, delta) => {
    if (!materialRef.current) return
    
    materialRef.current.uniforms.uTime.value += delta
    materialRef.current.uniforms.uHover.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uHover.value,
      hovered ? 1 : 0,
      0.1
    )
  })
  
  // Handle pointer events
  const handlePointerOver = () => {
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }
  
  const handlePointerOut = () => {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }
  
  return (
    <animated.group
      position={position}
      rotation={itemRotation as any}
      scale={scale}
    >
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <planeGeometry args={[3, 4.5, 32, 32]} />
        <primitive
          ref={materialRef}
          object={shaderMaterial}
          attach="material"
        />
      </mesh>
      
      {/* Title text (visible on hover) */}
      {hovered && (
        <Text
          position={[0, -2.8, 0.1]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
        >
          {destination.title}
        </Text>
      )}
      
      {/* Location text */}
      {hovered && destination.location && (
        <Text
          position={[0, -3.2, 0.1]}
          fontSize={0.2}
          color="#888"
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
        >
          {destination.location}
        </Text>
      )}
    </animated.group>
  )
}