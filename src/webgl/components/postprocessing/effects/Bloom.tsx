import { BloomEffect } from 'postprocessing'
import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'

interface BloomProps {
  intensity?: number
  luminanceThreshold?: number
  luminanceSmoothing?: number
  radius?: number
  mipmapBlur?: boolean
}

export function Bloom({
  intensity = 1.0,
  luminanceThreshold = 0.9,
  luminanceSmoothing = 0.025,
  radius = 0.85,
  mipmapBlur = true,
}: BloomProps) {
  const { scene, camera } = useThree()
  
  const effect = useMemo(() => {
    return new BloomEffect({
      intensity,
      luminanceThreshold,
      luminanceSmoothing,
      radius,
      mipmapBlur,
    })
  }, [intensity, luminanceThreshold, luminanceSmoothing, radius, mipmapBlur])
  
  useEffect(() => {
    effect.intensity = intensity
  }, [effect, intensity])
  
  useEffect(() => {
    effect.luminanceMaterial.threshold = luminanceThreshold
    effect.luminanceMaterial.smoothing = luminanceSmoothing
  }, [effect, luminanceThreshold, luminanceSmoothing])
  
  return effect
}