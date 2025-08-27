import { VignetteEffect } from 'postprocessing'
import { useEffect, useMemo } from 'react'

interface VignetteProps {
  offset?: number
  darkness?: number
}

export function Vignette({ offset = 0.5, darkness = 0.5 }: VignetteProps) {
  const effect = useMemo(() => {
    return new VignetteEffect({
      offset,
      darkness,
    })
  }, [offset, darkness])
  
  useEffect(() => {
    effect.offset = offset
    effect.darkness = darkness
  }, [effect, offset, darkness])
  
  return effect
}