import { Effect, BlendFunction } from 'postprocessing'
import { Uniform } from 'three'
import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

const noiseFragmentShader = `
  uniform float intensity;
  uniform float time;
  
  float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 color = inputColor.rgb;
    
    // Generate noise
    float noise = random(uv + time) * 2.0 - 1.0;
    
    // Apply noise
    color += vec3(noise) * intensity;
    
    outputColor = vec4(color, inputColor.a);
  }
`

class NoiseEffectImpl extends Effect {
  constructor({ intensity = 0.05, blendFunction = BlendFunction.ADD }) {
    super('NoiseEffect', noiseFragmentShader, {
      blendFunction,
      uniforms: new Map([
        ['intensity', new Uniform(intensity)],
        ['time', new Uniform(0)],
      ]),
    })
  }

  update(renderer: any, inputBuffer: any, deltaTime: number) {
    this.uniforms.get('time')!.value += deltaTime
  }
}

interface NoiseProps {
  intensity?: number
  blendFunction?: BlendFunction
}

export function Noise({ intensity = 0.05, blendFunction = BlendFunction.ADD }: NoiseProps) {
  const effect = useMemo(() => {
    return new NoiseEffectImpl({ intensity, blendFunction })
  }, [intensity, blendFunction])
  
  useEffect(() => {
    effect.uniforms.get('intensity')!.value = intensity
  }, [effect, intensity])
  
  useFrame((state, delta) => {
    effect.uniforms.get('time')!.value += delta
  })
  
  return effect
}