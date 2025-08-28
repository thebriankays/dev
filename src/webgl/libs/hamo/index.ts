// Hamo Animation Library
// Lightweight animation engine for WebGL

export interface HamoAnimation {
  id: string
  from: number
  to: number
  current: number
  duration: number
  startTime: number
  ease: (t: number) => number
  onUpdate?: (value: number) => void
  onComplete?: () => void
  completed: boolean
}

export class Hamo {
  private animations: Map<string, HamoAnimation> = new Map()
  private time: number = 0
  private deltaTime: number = 0
  private lastTime: number = 0

  constructor() {
    this.time = performance.now()
    this.lastTime = this.time
  }

  animate(
    id: string,
    from: number,
    to: number,
    duration: number,
    options?: {
      ease?: (t: number) => number
      onUpdate?: (value: number) => void
      onComplete?: () => void
    }
  ) {
    const animation: HamoAnimation = {
      id,
      from,
      to,
      current: from,
      duration,
      startTime: this.time,
      ease: options?.ease || this.easeOutExpo,
      onUpdate: options?.onUpdate,
      onComplete: options?.onComplete,
      completed: false,
    }

    this.animations.set(id, animation)
    return animation
  }

  update(time: number) {
    this.time = time
    this.deltaTime = this.time - this.lastTime
    this.lastTime = this.time

    this.animations.forEach((animation, id) => {
      if (animation.completed) return

      const elapsed = this.time - animation.startTime
      const progress = Math.min(elapsed / animation.duration, 1)
      const easedProgress = animation.ease(progress)

      animation.current = animation.from + (animation.to - animation.from) * easedProgress
      animation.onUpdate?.(animation.current)

      if (progress >= 1) {
        animation.completed = true
        animation.onComplete?.()
        this.animations.delete(id)
      }
    })
  }

  stop(id: string) {
    this.animations.delete(id)
  }

  stopAll() {
    this.animations.clear()
  }

  destroy() {
    this.stopAll()
  }

  // Lerp function for smooth interpolation
  lerp(from: number, to: number, t: number): number {
    return from + (to - from) * t
  }

  // Easing functions
  linear(t: number): number {
    return t
  }

  easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
  }

  easeInOutExpo(t: number): number {
    if (t === 0) return 0
    if (t === 1) return 1
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2
    return (2 - Math.pow(2, -20 * t + 10)) / 2
  }

  easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  }
}