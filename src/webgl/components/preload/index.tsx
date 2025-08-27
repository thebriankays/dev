'use client'

import React, { useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

interface PreloadProps {
  assets?: string[]
  onProgress?: (progress: number) => void
  onComplete?: () => void
}

export function Preload({ assets = [], onProgress, onComplete }: PreloadProps) {
  const { active, progress } = useProgress()
  
  useEffect(() => {
    if (progress > 0 && progress < 100) {
      onProgress?.(progress)
    }
    
    if (progress === 100 && !active) {
      onComplete?.()
    }
  }, [progress, active, onProgress, onComplete])
  
  // Preload textures if provided
  useEffect(() => {
    if (assets.length > 0) {
      assets.forEach(asset => {
        useTexture.preload(asset)
      })
    }
  }, [assets])
  
  return null
}

export const PreloadManager = {
  textures: new Map<string, THREE.Texture>(),
  
  async loadTexture(url: string): Promise<THREE.Texture> {
    if (this.textures.has(url)) {
      return this.textures.get(url)!
    }
    
    // Create a new texture loader
    const loader = new THREE.TextureLoader()
    const texture = await new Promise<THREE.Texture>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject)
    })
    
    this.textures.set(url, texture)
    return texture
  },
  
  getTexture(url: string): THREE.Texture | undefined {
    return this.textures.get(url)
  },
  
  clearCache() {
    this.textures.forEach(texture => texture.dispose())
    this.textures.clear()
  },
}