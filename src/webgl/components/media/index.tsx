'use client'

import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTexture, View } from '@react-three/drei'
import { WebGLTunnel } from '@/webgl/components/tunnel'
import Program from '@/webgl/utils/program'
import { useAnimation, useGSAP } from '@/providers/Animation'
import { useCanvas, useView } from '@/providers/Canvas'
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
  const viewRef = useRef<HTMLDivElement>(null)
  const bounds = useView(viewRef) // Use the proper useView hook for tracking
  
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
      
      {/* WebGL overlay - this div is tracked by useView */}
      <div 
        ref={viewRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
      
      {/* WebGL content rendered through tunnel */}
      <WebGLTunnel>
        <View track={viewRef as React.RefObject<HTMLElement>}>
          {video ? (
            <WebGLVideo
              src={src}
              scale={scale}
              distortion={distortion}
              hover={hover}
              parallax={parallax}
              containerRef={containerRef}
            />
          ) : (
            <WebGLImage
              src={src}
              scale={scale}
              distortion={distortion}
              hover={hover}
              parallax={parallax}
              containerRef={containerRef}
            />
          )}
        </View>
      </WebGLTunnel>
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
  containerRef,
}: any) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(src)
  const animation = useAnimation()
  const { requestRender } = useCanvas()
  const { viewport, camera } = useThree()
  
  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uDistortion: { value: distortion },
    uParallax: { value: parallax },
    uMouse: { value: new THREE.Vector2() },
    uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
    uScrollY: { value: 0 },
  }), [texture, distortion, parallax, viewport])
  
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms,
    vertexShader: mediaVertexShader,
    fragmentShader: mediaFragmentShader,
    transparent: true,
  }), [uniforms])
  
  // Set up scroll-triggered animations
  useGSAP((context) => {
    if (!meshRef.current || !containerRef.current) return
    
    const { ScrollTrigger, gsap } = animation
    
    // Parallax effect on scroll
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        uniforms.uScrollY.value = self.progress
        uniforms.uProgress.value = self.progress
        requestRender()
      },
    })
    
    // Fade in animation
    gsap.fromTo(
      uniforms.uProgress,
      { value: 0 },
      {
        value: 1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        onUpdate: () => requestRender(),
      }
    )
    
    // Hover effect
    if (hover && containerRef.current) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = containerRef.current!.getBoundingClientRect()
        uniforms.uMouse.value.x = (e.clientX - rect.left) / rect.width
        uniforms.uMouse.value.y = 1 - (e.clientY - rect.top) / rect.height
        requestRender()
      }
      
      const handleMouseLeave = () => {
        gsap.to(uniforms.uMouse.value, {
          x: 0.5,
          y: 0.5,
          duration: 0.3,
          onUpdate: () => requestRender(),
        })
      }
      
      containerRef.current.addEventListener('mousemove', handleMouseMove)
      containerRef.current.addEventListener('mouseleave', handleMouseLeave)
      
      return () => {
        containerRef.current?.removeEventListener('mousemove', handleMouseMove)
        containerRef.current?.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [hover])
  
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    // Update time with Tempus if available
    if (animation.tempus) {
      uniforms.uTime.value = animation.tempus.elapsed * 0.001
    } else {
      uniforms.uTime.value += delta
    }
    
    // Scale to fill viewport
    meshRef.current.scale.set(viewport.width * scale, viewport.height * scale, 1)
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
  containerRef,
}: any) {
  const meshRef = useRef<THREE.Mesh>(null)
  const animation = useAnimation()
  const { requestRender } = useCanvas()
  const { viewport } = useThree()
  
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
    uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
    uScrollY: { value: 0 },
  }), [texture, distortion, parallax, viewport])
  
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms,
    vertexShader: mediaVertexShader,
    fragmentShader: mediaFragmentShader,
    transparent: true,
  }), [uniforms])
  
  // Set up scroll-triggered animations
  useGSAP((context) => {
    if (!meshRef.current || !containerRef.current) return
    
    const { ScrollTrigger, gsap } = animation
    
    // Parallax effect on scroll
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        uniforms.uScrollY.value = self.progress
        uniforms.uProgress.value = self.progress
        requestRender()
      },
    })
    
    // Play/pause video based on visibility
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => video.play(),
      onLeave: () => video.pause(),
      onEnterBack: () => video.play(),
      onLeaveBack: () => video.pause(),
    })
    
    // Fade in animation
    gsap.fromTo(
      uniforms.uProgress,
      { value: 0 },
      {
        value: 1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        onUpdate: () => requestRender(),
      }
    )
  }, [video])
  
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    // Update time with Tempus if available
    if (animation.tempus) {
      uniforms.uTime.value = animation.tempus.elapsed * 0.001
    } else {
      uniforms.uTime.value += delta
    }
    
    // Request render for video updates
    if (video.readyState >= 2) {
      requestRender()
    }
    
    // Scale to fill viewport
    meshRef.current.scale.set(viewport.width * scale, viewport.height * scale, 1)
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
  uniform float uScrollY;
  uniform vec2 uMouse;
  
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    
    vec3 pos = position;
    
    // Distortion effect with scroll influence
    float dist = distance(uMouse, uv);
    pos.z += sin(dist * 10.0 + uTime) * uDistortion * (1.0 + uScrollY * 0.5);
    
    // Parallax effect with scroll
    pos.xy += (uMouse - 0.5) * uParallax;
    pos.y += uScrollY * uParallax * 0.5;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const mediaFragmentShader = `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uProgress;
  uniform float uScrollY;
  uniform vec2 uResolution;
  
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv;
    
    // Parallax UV offset based on scroll
    uv.y += uScrollY * 0.05;
    
    // Sample texture
    vec4 color = texture2D(uTexture, uv);
    
    // Apply effects with progress fade
    color.rgb *= 0.9 + 0.1 * sin(uTime);
    color.a *= uProgress;
    
    gl_FragColor = color;
  }
`