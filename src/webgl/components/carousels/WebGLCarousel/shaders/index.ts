import type { TransitionEffect } from '../types'

// Import individual shader modules
import { waveVertex, waveFragment } from './wave'
import { dissolveVertex, dissolveFragment } from './dissolve'
import { zoomVertex, zoomFragment } from './zoom'
import { distortionVertex, distortionFragment } from './distortion'
import { glitchVertex, glitchFragment } from './glitch'

export interface ShaderSet {
  vertexShader: string
  fragmentShader: string
}

const shaderMap: Record<TransitionEffect, ShaderSet> = {
  wave: {
    vertexShader: waveVertex,
    fragmentShader: waveFragment,
  },
  dissolve: {
    vertexShader: dissolveVertex,
    fragmentShader: dissolveFragment,
  },
  zoom: {
    vertexShader: zoomVertex,
    fragmentShader: zoomFragment,
  },
  distortion: {
    vertexShader: distortionVertex,
    fragmentShader: distortionFragment,
  },
  glitch: {
    vertexShader: glitchVertex,
    fragmentShader: glitchFragment,
  },
}

export function getTransitionShaders(effect: TransitionEffect): ShaderSet {
  return shaderMap[effect] || shaderMap.wave
}