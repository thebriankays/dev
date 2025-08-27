import { useEffect, useRef } from 'react'

interface UseAutoPlayProps {
  enabled: boolean
  interval: number
  onNext: () => void
  dependencies?: any[]
}

export function useAutoPlay({
  enabled,
  interval,
  onNext,
  dependencies = [],
}: UseAutoPlayProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      onNext()
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, interval, onNext, ...dependencies])
}