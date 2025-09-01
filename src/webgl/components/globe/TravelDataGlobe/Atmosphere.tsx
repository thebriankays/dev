'use client'

import React, { useMemo } from 'react'
import * as THREE from 'three'

interface AtmosphereProps {
  radius: number
  color?: string
  intensity?: number
  falloff?: number
}

export const Atmosphere: React.FC<AtmosphereProps> = ({
  radius,
  color = '#4090ff',
  intensity = 0.4,
  falloff = 2.0
}) => {
  const atmosphereMaterial = useMemo(() => {
    const c = new THREE.Color(color)
    
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Vector3(c.r, c.g, c.b) },
        uIntensity: { value: intensity },
        uFalloff: { value: falloff }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uFalloff;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 viewDir = normalize(vPosition);
          float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
          float glow = pow(rim, uFalloff) * uIntensity;
          
          gl_FragColor = vec4(uColor * glow, glow);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    })
  }, [color, intensity, falloff])
  
  return (
    <mesh>
      <sphereGeometry args={[radius * 1.1, 64, 64]} />
      <primitive object={atmosphereMaterial} attach="material" />
    </mesh>
  )
}