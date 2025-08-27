import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ParticleOptions } from './types'

interface ParticleTrailProps {
  path: THREE.Vector3[]
  options?: Partial<ParticleOptions>
  active?: boolean
}

const defaultOptions: ParticleOptions = {
  count: 50,
  size: 0.02,
  speed: 0.5,
  color: '#4ECDC4',
  opacity: 0.6,
  trail: true,
  trailLength: 10,
}

export function ParticleTrail({ path, options = {}, active = true }: ParticleTrailProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const progressRef = useRef<number[]>([])
  
  const config = { ...defaultOptions, ...options }

  // Initialize particle positions and progress
  useMemo(() => {
    progressRef.current = new Array(config.count).fill(0).map((_, i) => i / config.count)
  }, [config.count])

  // Create particle geometry
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(config.count * 3)
    const colors = new Float32Array(config.count * 3)
    const sizes = new Float32Array(config.count)
    const opacities = new Float32Array(config.count)

    const color = new THREE.Color(config.color)

    for (let i = 0; i < config.count; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0

      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      sizes[i] = config.size
      opacities[i] = config.opacity
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          vColor = color;
          vOpacity = opacity;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          vec2 center = vec2(0.5);
          float dist = distance(gl_PointCoord, center);
          
          if (dist > 0.5) discard;
          
          float alpha = smoothstep(0.5, 0.0, dist) * vOpacity;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    return { geometry, material }
  }, [config])

  // Get position on path
  const getPositionOnPath = (t: number): THREE.Vector3 => {
    const clampedT = Math.max(0, Math.min(1, t))
    const index = clampedT * (path.length - 1)
    const i = Math.floor(index)
    const fraction = index - i
    
    if (i >= path.length - 1) {
      return path[path.length - 1].clone()
    }
    
    return path[i].clone().lerp(path[i + 1], fraction)
  }

  // Animate particles
  useFrame((state, delta) => {
    if (!particlesRef.current || !active) return

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    const opacities = particlesRef.current.geometry.attributes.opacity.array as Float32Array

    for (let i = 0; i < config.count; i++) {
      // Update progress
      progressRef.current[i] += delta * config.speed / path.length
      if (progressRef.current[i] > 1) {
        progressRef.current[i] -= 1
      }

      // Get position on path
      const position = getPositionOnPath(progressRef.current[i])
      positions[i * 3] = position.x
      positions[i * 3 + 1] = position.y
      positions[i * 3 + 2] = position.z

      // Fade in/out at ends
      const fadeIn = Math.min(progressRef.current[i] * 10, 1)
      const fadeOut = Math.min((1 - progressRef.current[i]) * 10, 1)
      opacities[i] = config.opacity * fadeIn * fadeOut
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true
    particlesRef.current.geometry.attributes.opacity.needsUpdate = true

    // Update time uniform
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  return <points ref={particlesRef} geometry={geometry} material={material} />
}