'use client'

import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { WebGLTunnel } from '@/webgl/components/tunnel'
import { Program } from '@/webgl/utils/Program'
import { useAnimation } from '@/providers/Animation'
import { useWebGLRect } from '@/hooks/use-webgl-rect'

interface WebGLMediaProps {
  src: string
  alt?: string
  width?: number
  height?: number
  scale?: number
  distortion?: number
  hover?: boolean
  parallax?: number
  video?: boolean
  className?: string
}

export function WebGLMedia({
  src,
  alt,
  width,
  height,
  scale = 1,
  distortion = 0.1,
  hover = true,
  parallax = 0.1,
  video = false,
  className,
}: WebGLMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bounds = useWebGLRect()
  
  return (
    <div 
      ref={containerRef}
      className={className}
      data-webgl-media
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Fallback image */}
      {!video && (
        <img 
          src={src} 
          alt={alt} 
          width={width} 
          height={height}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      )}
      
      {/* WebGL overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <WebGLTunnel>
          {video ? (
            <WebGLVideo
              src={src}
              scale={scale}
              distortion={distortion}
              hover={hover}
              parallax={parallax}
              bounds={bounds}
            />
          ) : (
            <WebGLImage
              src={src}
              scale={scale}
              distortion={distortion}
              hover={hover}
              parallax={parallax}
              bounds={bounds}
            />
          )}
        </WebGLTunnel>
      </div>
    </div>
  )
}

// WebGL Image Component
function WebGLImage({
  src,
  scale,
  distortion,
  hover,
  parallax,
  bounds,
}: any) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(src)
  const animation = useAnimation()
  
  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uDistortion: { value: distortion },
    uParallax: { value: parallax },
    uMouse: { value: new THREE.Vector2() },
    uResolution: { value: new THREE.Vector2() },
  }), [texture, distortion, parallax])
  
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms,
    vertexShader: mediaVertexShader,
    fragmentShader: mediaFragmentShader,
    transparent: true,
  }), [uniforms])
  
  useFrame((state, delta) => {
    if (!meshRef.current || !bounds) return
    
    // Update uniforms
    uniforms.uTime.value += delta
    uniforms.uResolution.value.set(bounds.width, bounds.height)
    
    // Update position
    meshRef.current.position.x = bounds.left + bounds.width / 2
    meshRef.current.position.y = -(bounds.top + bounds.height / 2)
    meshRef.current.scale.set(bounds.width * scale, bounds.height * scale, 1)
  })
  
  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[1, 1, 32, 32]} />
    </mesh>
  )
}

// WebGL Video Component
function WebGLVideo({
  src,
  scale,
  distortion,
  hover,
  parallax,
  bounds,
}: any) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [video] = useState(() => {
    const vid = document.createElement('video')
    vid.src = src
    vid.crossOrigin = 'anonymous'
    vid.loop = true
    vid.muted = true
    vid.playsInline = true
    vid.autoplay = true
    return vid
  })
  
  const texture = useMemo(() => {
    const tex = new THREE.VideoTexture(video)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.format = THREE.RGBAFormat
    return tex
  }, [video])
  
  useEffect(() => {
    video.play()
    return () => {
      video.pause()
      video.src = ''
    }
  }, [video])
  
  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uDistortion: { value: distortion },
    uParallax: { value: parallax },
    uMouse: { value: new THREE.Vector2() },
    uResolution: { value: new THREE.Vector2() },
  }), [texture, distortion, parallax])
  
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms,
    vertexShader: mediaVertexShader,
    fragmentShader: mediaFragmentShader,
    transparent: true,
  }), [uniforms])
  
  useFrame((state, delta) => {
    if (!meshRef.current || !bounds) return
    
    // Update uniforms
    uniforms.uTime.value += delta
    uniforms.uResolution.value.set(bounds.width, bounds.height)
    
    // Update position
    meshRef.current.position.x = bounds.left + bounds.width / 2
    meshRef.current.position.y = -(bounds.top + bounds.height / 2)
    meshRef.current.scale.set(bounds.width * scale, bounds.height * scale, 1)
  })
  
  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[1, 1, 32, 32]} />
    </mesh>
  )
}

// Shader code
const mediaVertexShader = `
  uniform float uTime;
  uniform float uDistortion;
  uniform float uParallax;
  uniform vec2 uMouse;
  
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    
    vec3 pos = position;
    
    // Distortion effect
    float dist = distance(uMouse, uv);
    pos.z += sin(dist * 10.0 + uTime) * uDistortion;
    
    // Parallax effect
    pos.xy += (uMouse - 0.5) * uParallax;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const mediaFragmentShader = `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uResolution;
  
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv;
    
    // Sample texture
    vec4 color = texture2D(uTexture, uv);
    
    // Apply effects
    color.rgb *= 0.9 + 0.1 * sin(uTime);
    
    gl_FragColor = color;
  }
`