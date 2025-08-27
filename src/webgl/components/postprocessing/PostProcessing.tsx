'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { 
  EffectComposer, 
  RenderPass, 
  EffectPass,
  NormalPass,
  BlendFunction,
} from 'postprocessing'
import { HalfFloatType } from 'three'
import { useControls } from 'leva'
import { Bloom } from './effects/Bloom'
import { Noise } from './effects/Noise'
import { Vignette } from './effects/Vignette'
import { ChromaticAberration } from './effects/ChromaticAberration'

interface PostProcessingProps {
  enabled?: boolean
}

export function PostProcessing({ enabled: defaultEnabled = true }: PostProcessingProps) {
  const gl = useThree((state) => state.gl)
  const viewport = useThree((state) => state.viewport)
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  const setDpr = useThree((state) => state.setDpr)
  const size = useThree((state) => state.size)
  
  // Store effects in state to ensure they're properly managed
  const [effects, setEffects] = useState<any[]>([])

  // Performance optimizations from Satus
  const isWebgl2 = gl.capabilities.isWebGL2
  const dpr = viewport.dpr
  const maxSamples = gl.capabilities.maxSamples
  const needsAA = dpr < 2

  // DPR management from Satus
  useEffect(() => {
    const initialDpr = Math.min(window.devicePixelRatio, 2)
    const newDpr = size.width <= 2048 ? initialDpr : 1
    setDpr(newDpr)
  }, [size.width, setDpr])

  // Leva controls for effects
  const {
    enabled,
    bloom,
    bloomIntensity,
    bloomThreshold,
    bloomRadius,
    noise,
    noiseIntensity,
    vignette,
    vignetteOffset,
    vignetteDarkness,
    chromaticAberration,
    chromaticOffset,
  } = useControls('Post Processing', {
    enabled: { value: defaultEnabled },
    bloom: { value: true },
    bloomIntensity: { value: 0.5, min: 0, max: 3, step: 0.1 },
    bloomThreshold: { value: 0.9, min: 0, max: 1, step: 0.01 },
    bloomRadius: { value: 0.85, min: 0, max: 1, step: 0.01 },
    noise: { value: true },
    noiseIntensity: { value: 0.025, min: 0, max: 0.2, step: 0.005 },
    vignette: { value: true },
    vignetteOffset: { value: 0.5, min: 0, max: 1, step: 0.01 },
    vignetteDarkness: { value: 0.5, min: 0, max: 1, step: 0.01 },
    chromaticAberration: { value: false },
    chromaticOffset: { value: 0.002, min: 0, max: 0.01, step: 0.0001 },
  })

  // Create composer with Satus configuration
  const composer = useMemo(() => {
    return new EffectComposer(gl, {
      multisampling: isWebgl2 && needsAA ? Math.min(maxSamples, 8) : 0,
      frameBufferType: HalfFloatType,
    })
  }, [gl, needsAA, isWebgl2, maxSamples])

  // Create passes
  const renderPass = useMemo(() => new RenderPass(scene, camera), [scene, camera])
  const normalPass = useMemo(() => new NormalPass(scene, camera), [scene, camera])

  // Create effects
  useEffect(() => {
    const newEffects = []
    
    if (bloom) {
      const bloomEffect = Bloom({ 
        intensity: bloomIntensity, 
        luminanceThreshold: bloomThreshold, 
        radius: bloomRadius 
      })
      newEffects.push(bloomEffect)
    }
    
    if (noise) {
      const noiseEffect = Noise({ 
        intensity: noiseIntensity,
        blendFunction: BlendFunction.ADD
      })
      newEffects.push(noiseEffect)
    }
    
    if (vignette) {
      const vignetteEffect = Vignette({ 
        offset: vignetteOffset, 
        darkness: vignetteDarkness 
      })
      newEffects.push(vignetteEffect)
    }
    
    if (chromaticAberration) {
      const chromaticEffect = ChromaticAberration({ 
        offset: [chromaticOffset, chromaticOffset] 
      })
      newEffects.push(chromaticEffect)
    }
    
    setEffects(newEffects)
  }, [
    bloom, bloomIntensity, bloomThreshold, bloomRadius,
    noise, noiseIntensity,
    vignette, vignetteOffset, vignetteDarkness,
    chromaticAberration, chromaticOffset
  ])

  // Setup composer passes
  useEffect(() => {
    if (!composer || !renderPass) return

    // Clear existing passes
    composer.removeAllPasses()
    
    // Add render pass
    composer.addPass(renderPass)
    
    // Add normal pass if needed by effects
    if (effects.some(e => e.requiresNormalPass)) {
      composer.addPass(normalPass)
    }
    
    // Add effect pass with all effects
    if (effects.length > 0) {
      const effectPass = new EffectPass(camera, ...effects)
      composer.addPass(effectPass)
    }

    return () => {
      composer.removeAllPasses()
    }
  }, [composer, renderPass, normalPass, camera, effects])

  // Update size
  useEffect(() => {
    if (!composer) return
    composer.setSize(size.width, size.height)
  }, [composer, size])

  // Render loop with highest priority
  useFrame((_, deltaTime) => {
    if (enabled && composer) {
      composer.render(deltaTime)
    }
  }, Number.POSITIVE_INFINITY)

  if (!enabled) return null

  return null
}