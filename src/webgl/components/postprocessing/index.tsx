'use client'

import React from 'react'
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useControls } from 'leva'

export function PostProcessing() {
  const {
    bloomIntensity,
    bloomThreshold,
    bloomSmoothing,
    noiseOpacity,
    vignetteOffset,
    vignetteDarkness,
    chromaticAberrationOffset,
  } = useControls('Post Processing', {
    bloomIntensity: { value: 1.5, min: 0, max: 5 },
    bloomThreshold: { value: 0.9, min: 0, max: 1 },
    bloomSmoothing: { value: 0.5, min: 0, max: 1 },
    noiseOpacity: { value: 0.02, min: 0, max: 1 },
    vignetteOffset: { value: 0.5, min: 0, max: 1 },
    vignetteDarkness: { value: 0.5, min: 0, max: 1 },
    chromaticAberrationOffset: { value: [0.002, 0.0], min: -0.01, max: 0.01 },
  })
  
  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={bloomSmoothing}
        blendFunction={BlendFunction.ADD}
      />
      <Noise
        opacity={noiseOpacity}
        blendFunction={BlendFunction.OVERLAY}
      />
      <Vignette
        offset={vignetteOffset}
        darkness={vignetteDarkness}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        offset={chromaticAberrationOffset as [number, number]}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}