import { useRef, useCallback } from 'react'

interface UseSwipeGesturesProps {
  enabled: boolean
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

export function useSwipeGestures({
  enabled,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: UseSwipeGesturesProps) {
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return
      touchStartX.current = e.touches[0].clientX
    },
    [enabled]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return
      touchEndX.current = e.touches[0].clientX
    },
    [enabled]
  )

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return

    const swipeDistance = touchStartX.current - touchEndX.current
    const absDistance = Math.abs(swipeDistance)

    if (absDistance > threshold) {
      if (swipeDistance > 0 && onSwipeLeft) {
        onSwipeLeft()
      } else if (swipeDistance < 0 && onSwipeRight) {
        onSwipeRight()
      }
    }
  }, [enabled, threshold, onSwipeLeft, onSwipeRight])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }
}