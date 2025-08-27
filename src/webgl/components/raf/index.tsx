'use client'

import { useThree } from '@react-three/fiber'
import { useTempus } from 'tempus/react'

interface RAFProps {
  render?: boolean
}

export function RAF({ render = true }: RAFProps) {
  const advance = useThree((state) => state.advance)

  useTempus(
    (time: number) => {
      if (render) {
        advance(time / 1000)
      }
    },
    {
      priority: 1,
    }
  )

  return null
}

export const useRaf = (callback: (time: number, delta: number) => void, priority = 0) => {
  let lastTime = 0
  
  useTempus((time: number) => {
    const currentTime = time / 1000
    const delta = currentTime - lastTime
    lastTime = currentTime
    callback(currentTime, delta)
  }, { priority })
}