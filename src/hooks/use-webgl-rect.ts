import { useEffect, useRef, useState } from 'react'

/**
 * Hook to track DOM element bounds for WebGL positioning
 * Returns a DOMRect that updates on resize/scroll
 */
export function useWebGLRect(ref: React.RefObject<HTMLElement | null>) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const rafId = useRef<number>()

  useEffect(() => {
    if (!ref.current) return

    const updateRect = () => {
      if (!ref.current) return
      const bounds = ref.current.getBoundingClientRect()
      setRect(bounds)
    }

    // Initial measurement
    updateRect()

    // Update on scroll/resize with RAF for performance
    const handleUpdate = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(updateRect)
    }

    window.addEventListener('resize', handleUpdate)
    window.addEventListener('scroll', handleUpdate, { passive: true })

    // Observe element for size changes
    const observer = new ResizeObserver(handleUpdate)
    observer.observe(ref.current)

    return () => {
      window.removeEventListener('resize', handleUpdate)
      window.removeEventListener('scroll', handleUpdate)
      observer.disconnect()
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [ref])

  return rect
}