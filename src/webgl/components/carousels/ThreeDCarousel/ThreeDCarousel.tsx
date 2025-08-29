'use client'

import * as THREE from 'three'
import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Image, Environment, ScrollControls, useScroll, useTexture } from '@react-three/drei'
import { easing } from 'maath'
import './util' // This ensures extend() is called
import type { BentPlaneGeometry, MeshSineMaterial } from './util'
import type { Media } from '@/payload-types'

interface ThreeDCarouselProps {
  items: Array<{
    image: string | Media | number
  }>
  showBanner?: boolean
  bannerImage?: string | Media | number
  radius?: number
  enableFog?: boolean
  scrollPages?: number
}

export function ThreeDCarousel({ 
  items, 
  showBanner = true, 
  bannerImage,
  radius = 1.4,
  enableFog = true,
  scrollPages = 4
}: ThreeDCarouselProps) {
  // Ensure we have exactly 8 items
  const images = items.slice(0, 8).map(item => {
    if (typeof item.image === 'object' && 'url' in item.image) {
      return item.image.url || ''
    }
    return ''
  }).filter((url): url is string => url !== '')

  if (images.length !== 8) {
    console.warn('ThreeDCarousel requires exactly 8 images')
  }

  return (
    <group position={[0, 0, -100]}>
      <ScrollControls pages={scrollPages} infinite>
        <Rig rotation={[0, 0, 0.15]} scale={50}>
          <Carousel images={images} radius={radius} />
        </Rig>
        {showBanner && <Banner position={[0, -7.5, 0]} scale={50} bannerImage={bannerImage} />}
      </ScrollControls>
    </group>
  )
}

function Rig(props: { children: React.ReactNode; rotation: [number, number, number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null)
  const scroll = useScroll()
  const { gl, size } = useThree()
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartRotation = useRef(0)
  const targetRotation = useRef(0)
  
  useEffect(() => {
    const canvas = gl.domElement
    
    const handlePointerDown = (e: PointerEvent) => {
      setIsDragging(true)
      dragStartX.current = e.clientX
      if (ref.current) {
        dragStartRotation.current = ref.current.rotation.y
      }
      canvas.style.cursor = 'grabbing'
    }
    
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !ref.current) return
      
      const deltaX = e.clientX - dragStartX.current
      const rotationSpeed = 0.01
      targetRotation.current = dragStartRotation.current + (deltaX * rotationSpeed)
    }
    
    const handlePointerUp = () => {
      setIsDragging(false)
      canvas.style.cursor = 'grab'
    }
    
    canvas.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [gl, isDragging])
  
  useFrame((state, delta) => {
    if (ref.current) {
      if (isDragging) {
        // Apply drag rotation
        easing.damp(ref.current.rotation, 'y', targetRotation.current, 0.2, delta)
      } else {
        // Apply scroll rotation
        ref.current.rotation.y = -scroll.offset * (Math.PI * 2)
      }
    }
    state.events.update?.() // Raycasts every frame rather than on pointer-move
  })
  
  return <group ref={ref} {...props} />
}

interface CarouselProps {
  images: string[]
  radius?: number
}

function Carousel({ images, radius = 1.4 }: CarouselProps) {
  const count = 8
  
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const imageUrl = images[i] || images[i % images.length] // Fallback to repeat images if less than 8
        return (
          <Card
            key={i}
            url={imageUrl}
            position={[
              Math.sin((i / count) * Math.PI * 2) * radius, 
              0, 
              Math.cos((i / count) * Math.PI * 2) * radius
            ]}
            rotation={[0, Math.PI + (i / count) * Math.PI * 2, 0]}
          />
        )
      })}
    </>
  )
}

interface CardProps {
  url: string
  position: [number, number, number]
  rotation: [number, number, number]
}

function Card({ url, ...props }: CardProps) {
  const ref = useRef<any>(null)
  const [hovered, hover] = useState(false)
  
  const pointerOver = (e: any) => {
    e.stopPropagation()
    hover(true)
  }
  const pointerOut = () => hover(false)
  
  useFrame((state, delta) => {
    if (ref.current) {
      easing.damp3(ref.current.scale, hovered ? 1.15 : 1, 0.1, delta)
      easing.damp(ref.current.material, 'radius', hovered ? 0.25 : 0.1, 0.2, delta)
      easing.damp(ref.current.material, 'zoom', hovered ? 1 : 1.5, 0.2, delta)
    }
  })
  
  return (
    <Image 
      ref={ref} 
      url={url} 
      transparent 
      side={THREE.DoubleSide} 
      onPointerOver={pointerOver} 
      onPointerOut={pointerOut} 
      {...props}
    >
      <bentPlaneGeometry args={[0.1, 1, 1, 20, 20]} />
    </Image>
  )
}

interface BannerProps {
  position: [number, number, number]
  bannerImage?: string | Media | number
  scale?: number
}

function Banner({ position, bannerImage, scale = 1 }: BannerProps) {
  const ref = useRef<any>(null)
  const defaultTexture = '/work_.png' // Default banner texture
  
  // Get the banner image URL
  let textureUrl = defaultTexture
  if (bannerImage) {
    if (typeof bannerImage === 'object' && 'url' in bannerImage) {
      textureUrl = bannerImage.url || defaultTexture
    }
  }
  
  const texture = useTexture(textureUrl)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  
  const scroll = useScroll()
  
  useFrame((state, delta) => {
    if (ref.current && ref.current.material) {
      ref.current.material.time.value += Math.abs(scroll.delta) * 4
      ref.current.material.map.offset.x += delta / 2
    }
  })
  
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <cylinderGeometry args={[1.6, 1.6, 0.14, 128, 16, true]} />
      <meshSineMaterial 
        map={texture} 
        map-anisotropy={16} 
        map-repeat={[30, 1]} 
        side={THREE.DoubleSide} 
        toneMapped={false} 
      />
    </mesh>
  )
}

export default ThreeDCarousel