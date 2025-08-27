'use client'

import React, { useRef, useEffect, useMemo, useState } from 'react'
import { Text } from 'troika-three-text'
import { useFrame, useThree } from '@react-three/fiber'
import { useGSAP } from '@/providers/Animation'
import * as THREE from 'three'
import gsap from 'gsap'

// Import all shaders
import distortionVert from './shaders/distortion.vert'
import distortionFrag from './shaders/distortion.frag'
import glitchVert from './shaders/glitch.vert'
import glitchFrag from './shaders/glitch.frag'
import waveVert from './shaders/wave.vert'
import waveFrag from './shaders/wave.frag'
import particlesVert from './shaders/particles.vert'
import particlesFrag from './shaders/particles.frag'
import morphVert from './shaders/morph.vert'
import morphFrag from './shaders/morph.frag'
import outlineVert from './shaders/outline.vert'
import outlineFrag from './shaders/outline.frag'

interface WebGLTextClientProps {
  text: string
  fontSize: 'small' | 'medium' | 'large' | 'xlarge'
  effect: 'distortion' | 'glitch' | 'wave' | 'particles' | 'morph' | 'outline' | 'none'
  color?: string
  font?: string
  webglEffects?: {
    distortion?: number
    glitchAmount?: number
    waveFrequency?: number
    waveAmplitude?: number
    particleCount?: number
    morphDuration?: number
    outlineWidth?: number
    parallax?: number
    hover?: boolean
  }
  animationTrigger?: 'onLoad' | 'onHover' | 'onScroll' | 'continuous'
  secondaryText?: string // For morph effect
}

export function WebGLTextClient({ 
  text, 
  fontSize,
  effect = 'none',
  color = '#ffffff',
  font = '/fonts/Humane-Bold.ttf',
  webglEffects = {},
  animationTrigger = 'onLoad',
  secondaryText,
}: WebGLTextClientProps) {
  const textRef = useRef<Text>(null)
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const mouse = useRef({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const { gl, camera } = useThree()
  
  // Font size mapping
  const sizeMap = {
    small: 0.5,
    medium: 1,
    large: 1.5,
    xlarge: 2,
  }
  
  // Create shader materials based on effect
  const material = useMemo(() => {
    const colorVec3 = new THREE.Color(color)
    
    switch (effect) {
      case 'distortion':
        return new THREE.ShaderMaterial({
          vertexShader: distortionVert,
          fragmentShader: distortionFrag,
          uniforms: {
            uTime: { value: 0 },
            uDistortion: { value: webglEffects.distortion || 0.5 },
            uMouse: { value: new THREE.Vector2() },
          },
          transparent: true,
        })
      
      case 'glitch':
        return new THREE.ShaderMaterial({
          vertexShader: glitchVert,
          fragmentShader: glitchFrag,
          uniforms: {
            uTime: { value: 0 },
            uIntensity: { value: 1.0 },
            uGlitchAmount: { value: webglEffects.glitchAmount || 0.5 },
            uMouse: { value: new THREE.Vector2() },
            uColor: { value: colorVec3 },
          },
          transparent: true,
        })
      
      case 'wave':
        return new THREE.ShaderMaterial({
          vertexShader: waveVert,
          fragmentShader: waveFrag,
          uniforms: {
            uTime: { value: 0 },
            uWaveFrequency: { value: webglEffects.waveFrequency || 10 },
            uWaveAmplitude: { value: webglEffects.waveAmplitude || 0.1 },
            uSpeed: { value: 2.0 },
            uMouse: { value: new THREE.Vector2() },
            uColor: { value: colorVec3 },
            uOpacity: { value: 1.0 },
          },
          transparent: true,
        })
      
      case 'morph':
        return new THREE.ShaderMaterial({
          vertexShader: morphVert,
          fragmentShader: morphFrag,
          uniforms: {
            uTime: { value: 0 },
            uMorphProgress: { value: 0 },
            uMouse: { value: new THREE.Vector2() },
            uColor: { value: colorVec3 },
            uTargetColor: { value: new THREE.Color('#00ff00') },
            uTwist: { value: 1.0 },
            uBend: { value: 1.0 },
            uOpacity: { value: 1.0 },
          },
          transparent: true,
        })
      
      case 'outline':
        return new THREE.ShaderMaterial({
          vertexShader: outlineVert,
          fragmentShader: outlineFrag,
          uniforms: {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2() },
            uColor: { value: colorVec3 },
            uOutlineColor: { value: new THREE.Color('#ff0000') },
            uOutlineWidth: { value: webglEffects.outlineWidth || 0.1 },
            uPulse: { value: 3.0 },
            uGlow: { value: 1.0 },
            uOpacity: { value: 1.0 },
          },
          transparent: true,
          side: THREE.DoubleSide,
        })
      
      default:
        return new THREE.MeshStandardMaterial({ 
          color: colorVec3,
          transparent: true,
          opacity: 1.0,
        })
    }
  }, [effect, color, webglEffects])
  
  // Setup text mesh
  useEffect(() => {
    if (!textRef.current) return
    
    const textMesh = textRef.current
    textMesh.text = text
    textMesh.fontSize = sizeMap[fontSize]
    textMesh.font = font
    textMesh.anchorX = 'center'
    textMesh.anchorY = 'middle'
    textMesh.color = color
    
    if (material) {
      textMesh.material = material
    }
    
    // Special setup for particle effect
    if (effect === 'particles') {
      setupParticles(textMesh)
    }
    
    // Trigger sync
    textMesh.sync()
  }, [text, fontSize, font, material, effect, color])
  
  // Particle system setup
  const setupParticles = (textMesh: Text) => {
    // Ensure text is synced first
    textMesh.sync()
    
    // Wait for geometry to be ready
    setTimeout(() => {
      if (!textMesh.geometry) return
      
      const geometry = textMesh.geometry
      const positions = geometry.attributes.position.array
      const particleCount = positions.length / 3
      
      const particlesGeometry = new THREE.BufferGeometry()
      const particlePositions = new Float32Array(particleCount * 3)
      const randoms = new Float32Array(particleCount)
      const targets = new Float32Array(particleCount * 3)
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        particlePositions[i3] = positions[i3] + (Math.random() - 0.5) * 5
        particlePositions[i3 + 1] = positions[i3 + 1] + (Math.random() - 0.5) * 5
        particlePositions[i3 + 2] = positions[i3 + 2] + (Math.random() - 0.5) * 5
        
        targets[i3] = positions[i3]
        targets[i3 + 1] = positions[i3 + 1]
        targets[i3 + 2] = positions[i3 + 2]
        
        randoms[i] = Math.random()
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
      particlesGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))
      particlesGeometry.setAttribute('aTarget', new THREE.BufferAttribute(targets, 3))
      
      const particlesMaterial = new THREE.ShaderMaterial({
        vertexShader: particlesVert,
        fragmentShader: particlesFrag,
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uMouse: { value: new THREE.Vector2() },
          uDispersion: { value: webglEffects.particleCount || 50 },
          uColor: { value: new THREE.Color(color) },
          uTexture: { value: null },
        },
        transparent: true,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      })
      
      if (particlesRef.current) {
        groupRef.current?.remove(particlesRef.current)
      }
      
      particlesRef.current = new THREE.Points(particlesGeometry, particlesMaterial)
      groupRef.current?.add(particlesRef.current)
    }, 100)
  }
  
  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  // Handle scroll for scroll-triggered animations
  useEffect(() => {
    if (animationTrigger !== 'onScroll') return
    
    const handleScroll = () => {
      const progress = window.scrollY / (document.body.scrollHeight - window.innerHeight)
      setScrollProgress(progress)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [animationTrigger])
  
  // Animation frame updates
  useFrame(({ clock, pointer }) => {
    if (!material || !('uniforms' in material)) return
    
    const time = clock.getElapsedTime()
    
    // Update common uniforms
    if (material.uniforms.uTime) material.uniforms.uTime.value = time
    if (material.uniforms.uMouse) {
      material.uniforms.uMouse.value.x = mouse.current.x
      material.uniforms.uMouse.value.y = mouse.current.y
    }
    
    // Effect-specific updates
    switch (effect) {
      case 'particles':
        if (particlesRef.current && particlesRef.current.material instanceof THREE.ShaderMaterial) {
          const mat = particlesRef.current.material
          mat.uniforms.uTime.value = time
          mat.uniforms.uMouse.value.x = mouse.current.x
          mat.uniforms.uMouse.value.y = mouse.current.y
          
          // Progress based on trigger
          let progress = 1
          if (animationTrigger === 'onHover') progress = isHovered ? 1 : 0
          else if (animationTrigger === 'onScroll') progress = scrollProgress
          else if (animationTrigger === 'continuous') progress = (Math.sin(time) + 1) * 0.5
          
          mat.uniforms.uProgress.value += (progress - mat.uniforms.uProgress.value) * 0.05
        }
        break
      
      case 'morph':
        if (material.uniforms.uMorphProgress) {
          let progress = 0
          if (animationTrigger === 'continuous') {
            progress = (Math.sin(time * 0.5) + 1) * 0.5
          } else if (animationTrigger === 'onHover') {
            progress = isHovered ? 1 : 0
          } else if (animationTrigger === 'onScroll') {
            progress = scrollProgress
          }
          material.uniforms.uMorphProgress.value += (progress - material.uniforms.uMorphProgress.value) * 0.05
        }
        break
    }
  })
  
  // GSAP animations
  useGSAP((context) => {
    if (!groupRef.current || !context) return
    
    context.add(() => {
      const tl = gsap.timeline()
      
      // Entrance animations based on effect
      if (groupRef.current) {
        switch (effect) {
          case 'glitch':
            tl.from(groupRef.current.position, {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1,
            duration: 0.5,
            ease: 'steps(5)',
          })
          break
        
        case 'wave':
          tl.from(groupRef.current.position, {
            y: -2,
            duration: 2,
            ease: 'elastic.out(1, 0.3)',
          })
          break
        
        case 'morph':
          tl.from(groupRef.current.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 1.5,
            ease: 'back.out(1.7)',
          })
          break
        
        case 'outline':
          tl.from(groupRef.current.rotation, {
            z: Math.PI * 2,
            duration: 1.5,
            ease: 'power3.out',
          })
          break
        
          default:
            tl.from(groupRef.current.position, {
              y: -1,
              duration: 1.5,
              ease: 'power3.out',
            })
            .from(groupRef.current, {
              opacity: 0,
              duration: 1.5,
              ease: 'power2.out',
            }, '<')
        }
      }
    })
  }, [effect])
  
  // Hover handlers
  const handlePointerOver = () => setIsHovered(true)
  const handlePointerOut = () => setIsHovered(false)
  
  return (
    <group 
      ref={groupRef}
      onPointerOver={webglEffects.hover ? handlePointerOver : undefined}
      onPointerOut={webglEffects.hover ? handlePointerOut : undefined}
    >
      {effect !== 'particles' && (
        <primitive
          ref={textRef}
          object={new Text()}
          position={[0, 0, 0]}
        />
      )}
    </group>
  )
}