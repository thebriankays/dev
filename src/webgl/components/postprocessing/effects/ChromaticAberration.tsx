import { ChromaticAberrationEffect } from 'postprocessing'
import { useEffect, useMemo } from 'react'
import { Vector2 } from 'three'

interface ChromaticAberrationProps {
  offset?: [number, number]
  radialModulation?: boolean
  modulationOffset?: number
}

export function ChromaticAberration({ 
  offset = [0.002, 0.002], 
  radialModulation = false,
  modulationOffset = 0.15
}: ChromaticAberrationProps) {
  const effect = useMemo(() => {
    return new ChromaticAberrationEffect({
      offset: new Vector2(...offset),
      radialModulation,
      modulationOffset,
    })
  }, [offset, radialModulation, modulationOffset])
  
  useEffect(() => {
    effect.offset.set(...offset)
  }, [effect, offset])
  
  useEffect(() => {
    effect.radialModulation = radialModulation
    effect.modulationOffset = modulationOffset
  }, [effect, radialModulation, modulationOffset])
  
  return effect
}