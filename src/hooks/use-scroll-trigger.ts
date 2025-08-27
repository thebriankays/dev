'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLenis } from 'lenis/react'

// Utility functions
function clamp(min: number, value: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function mapRange(
  inMin: number,
  inMax: number,
  value: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' || !Number.isNaN(value)
}

// Simple hook for window size
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

// Simple lazy state implementation
function useLazyState<T>(
  initialValue: T,
  callback: (value: T, lastValue: T) => void,
  deps: unknown[] = []
) {
  const valueRef = useRef<T>(initialValue)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const setValue = useCallback(
    (newValue: T) => {
      const lastValue = valueRef.current
      valueRef.current = newValue
      callbackRef.current(newValue, lastValue)
    },
    [...deps]
  )

  const getValue = useCallback(() => valueRef.current, [])

  return [setValue, getValue] as const
}

type Rect = {
  top: number
  bottom: number
  height: number
  width: number
  left: number
  right: number
}

type TriggerPosition = 'top' | 'center' | 'bottom' | number
type TriggerPositionCombination = `${TriggerPosition} ${TriggerPosition}`

export type UseScrollTriggerOptions = {
  rect?: Rect
  start?: TriggerPositionCombination
  end?: TriggerPositionCombination
  id?: string
  offset?: number
  disabled?: boolean
  onEnter?: ({ progress }: { progress: number }) => void
  onLeave?: ({ progress }: { progress: number }) => void
  onProgress?: (progress: {
    height: number
    isActive: boolean
    progress: number
    lastProgress: number
    steps: number[]
  }) => void
  steps?: number
}

export function useScrollTrigger(
  {
    rect,
    start = 'bottom bottom', // bottom of the element meets the bottom of the viewport
    end = 'top top', // top of the element meets the top of the viewport
    id = '',
    offset = 0,
    disabled = false,
    onEnter,
    onLeave,
    onProgress,
    steps = 1,
  }: UseScrollTriggerOptions,
  deps = [] as unknown[]
) {
  const lenis = useLenis()
  const { height: windowHeight = 0 } = useWindowSize()

  const [elementStartKeyword, viewportStartKeyword] =
    typeof start === 'string' ? start.split(' ') : [start]
  const [elementEndKeyword, viewportEndKeyword] =
    typeof end === 'string' ? end.split(' ') : [end]

  let viewportStart = isNumber(viewportStartKeyword)
    ? Number.parseFloat(viewportStartKeyword as any)
    : 0
  if (viewportStartKeyword === 'top') viewportStart = 0
  if (viewportStartKeyword === 'center') viewportStart = windowHeight * 0.5
  if (viewportStartKeyword === 'bottom') viewportStart = windowHeight

  let viewportEnd = isNumber(viewportEndKeyword)
    ? Number.parseFloat(viewportEndKeyword as any)
    : 0
  if (viewportEndKeyword === 'top') viewportEnd = 0
  if (viewportEndKeyword === 'center') viewportEnd = windowHeight * 0.5
  if (viewportEndKeyword === 'bottom') viewportEnd = windowHeight

  let elementStart = isNumber(elementStartKeyword)
    ? Number.parseFloat(elementStartKeyword as any)
    : rect?.bottom || 0
  if (elementStartKeyword === 'top') elementStart = rect?.top || 0
  if (elementStartKeyword === 'center')
    elementStart = (rect?.top || 0) + (rect?.height || 0) * 0.5
  if (elementStartKeyword === 'bottom') elementStart = rect?.bottom || 0

  elementStart += offset

  let elementEnd = isNumber(elementEndKeyword)
    ? Number.parseFloat(elementEndKeyword as any)
    : rect?.top || 0
  if (elementEndKeyword === 'top') elementEnd = rect?.top || 0
  if (elementEndKeyword === 'center')
    elementEnd = (rect?.top || 0) + (rect?.height || 0) * 0.5
  if (elementEndKeyword === 'bottom') elementEnd = rect?.bottom || 0

  elementEnd += offset

  const startValue = elementStart - viewportStart
  const endValue = elementEnd - viewportEnd

  const onProgressRef = useRef(onProgress)
  onProgressRef.current = onProgress

  const onUpdate = useCallback(
    (progress: number, lastProgress: number) => {
      onProgressRef.current?.({
        height: endValue - startValue,
        isActive: progress >= 0 && progress <= 1,
        progress: clamp(0, progress, 1),
        lastProgress: lastProgress,
        steps: Array.from({ length: steps }).map((_, i) =>
          clamp(0, mapRange(i / steps, (i + 1) / steps, progress, 0, 1), 1)
        ),
      })
    },
    [endValue, startValue, steps, ...deps]
  )

  const [setProgress, _getProgress] = useLazyState(
    undefined as number | undefined,
    (progress: number | undefined, lastProgress: number | undefined) => {
      if (progress === undefined || lastProgress === undefined) return
      if (Number.isNaN(progress)) return

      if (
        (progress >= 0 && lastProgress < 0) ||
        (progress <= 1 && lastProgress > 1)
      ) {
        onEnter?.({ progress: clamp(0, progress, 1) })
      }

      if (!(clamp(0, progress, 1) === clamp(0, lastProgress, 1))) {
        onUpdate(progress, lastProgress)
      }

      if (
        (progress < 0 && lastProgress >= 0) ||
        (progress > 1 && lastProgress <= 1)
      ) {
        onLeave?.({ progress: clamp(0, progress, 1) })
      }
    },
    [endValue, startValue, steps, onUpdate, ...deps]
  )

  const update = useCallback(() => {
    if (disabled) return

    let scroll: number

    if (lenis) {
      scroll = Math.floor(lenis?.scroll)
    } else {
      scroll = window.scrollY
    }

    const progress = mapRange(startValue, endValue, scroll, 0, 1)

    setProgress(progress)
  }, [
    lenis,
    startValue,
    endValue,
    setProgress,
    disabled,
    ...deps,
  ])

  useLenis(update, [update])

  useEffect(() => {
    if (lenis) return

    update()
    window.addEventListener('scroll', update, false)

    return () => {
      window.removeEventListener('scroll', update, false)
    }
  }, [lenis, update])
}