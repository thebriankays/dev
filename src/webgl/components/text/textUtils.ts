import * as THREE from 'three'
import gsap from 'gsap'

// Easing functions for smoother animations
export const easings = {
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInOutQuart: (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  easeInOutElastic: (t: number) => {
    const c5 = (2 * Math.PI) / 4.5
    return t === 0
      ? 0
      : t === 1
      ? 1
      : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1
  },
  bounce: (t: number) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) {
      return n1 * t * t
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
  },
}

// Text transition presets
export const textTransitions = {
  fadeIn: (target: any, duration = 1) => {
    return gsap.fromTo(target, 
      { opacity: 0 },
      { opacity: 1, duration, ease: 'power2.out' }
    )
  },
  
  slideFromBottom: (target: any, duration = 1.5) => {
    return gsap.fromTo(target.position,
      { y: -2 },
      { y: 0, duration, ease: 'power3.out' }
    )
  },
  
  elasticScale: (target: any, duration = 1.5) => {
    return gsap.fromTo(target.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration, ease: 'elastic.out(1, 0.3)' }
    )
  },
  
  rotateIn: (target: any, duration = 1.5) => {
    return gsap.fromTo(target.rotation,
      { z: Math.PI * 2 },
      { z: 0, duration, ease: 'power3.out' }
    )
  },
  
  stagger: (targets: any[], duration = 0.5, staggerAmount = 0.1) => {
    return gsap.fromTo(targets,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration, stagger: staggerAmount, ease: 'power2.out' }
    )
  },
}

// Color utilities
export const colorUtils = {
  hexToRgb: (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 1, g: 1, b: 1 }
  },
  
  interpolateColors: (color1: THREE.Color, color2: THREE.Color, factor: number) => {
    const result = new THREE.Color()
    result.r = color1.r + (color2.r - color1.r) * factor
    result.g = color1.g + (color2.g - color1.g) * factor
    result.b = color1.b + (color2.b - color1.b) * factor
    return result
  },
  
  generateGradient: (startColor: string, endColor: string, steps: number) => {
    const start = new THREE.Color(startColor)
    const end = new THREE.Color(endColor)
    const gradient = []
    
    for (let i = 0; i < steps; i++) {
      const factor = i / (steps - 1)
      gradient.push(colorUtils.interpolateColors(start, end, factor))
    }
    
    return gradient
  },
}

// Geometry helpers for text effects
export const geometryHelpers = {
  createParticleGeometry: (textGeometry: THREE.BufferGeometry, particleDensity = 1) => {
    const positions = textGeometry.attributes.position.array
    const particleCount = Math.floor(positions.length / 3 * particleDensity)
    
    const particlePositions = new Float32Array(particleCount * 3)
    const randoms = new Float32Array(particleCount)
    const sizes = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      const sourceIndex = Math.floor(Math.random() * (positions.length / 3)) * 3
      particlePositions[i * 3] = positions[sourceIndex]
      particlePositions[i * 3 + 1] = positions[sourceIndex + 1]
      particlePositions[i * 3 + 2] = positions[sourceIndex + 2]
      
      randoms[i] = Math.random()
      sizes[i] = Math.random() * 3 + 1
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    return geometry
  },
  
  morphGeometry: (geometry1: THREE.BufferGeometry, geometry2: THREE.BufferGeometry) => {
    const positions1 = geometry1.attributes.position.array
    const positions2 = geometry2.attributes.position.array
    const count = Math.min(positions1.length, positions2.length)
    
    const morphTargets = []
    const morphPositions = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      morphPositions[i] = positions2[i]
    }
    
    morphTargets.push({
      name: 'target',
      vertices: morphPositions
    })
    
    return morphTargets
  },
}

// Animation sequence builder
export class AnimationSequence {
  timeline: gsap.core.Timeline
  
  constructor() {
    this.timeline = gsap.timeline()
  }
  
  add(animation: gsap.core.Tween, position?: string | number) {
    this.timeline.add(animation, position)
    return this
  }
  
  addLabel(label: string, position?: string | number) {
    this.timeline.addLabel(label, position)
    return this
  }
  
  addPause(position?: string | number) {
    this.timeline.addPause(position)
    return this
  }
  
  play() {
    this.timeline.play()
    return this
  }
  
  pause() {
    this.timeline.pause()
    return this
  }
  
  reverse() {
    this.timeline.reverse()
    return this
  }
  
  seek(time: number) {
    this.timeline.seek(time)
    return this
  }
  
  timeScale(scale: number) {
    this.timeline.timeScale(scale)
    return this
  }
}

// Mouse interaction utilities
export const mouseInteractions = {
  calculateMouseDistance: (mouse: THREE.Vector2, uv: THREE.Vector2) => {
    const mouseUV = new THREE.Vector2(mouse.x * 0.5 + 0.5, mouse.y * 0.5 + 0.5)
    return mouseUV.distanceTo(uv)
  },
  
  getMouseInfluence: (distance: number, radius = 0.5, falloff = 2) => {
    return Math.max(0, 1 - Math.pow(distance / radius, falloff))
  },
  
  applyMouseRepulsion: (position: THREE.Vector3, mouse: THREE.Vector2, strength = 1) => {
    const mousePos3D = new THREE.Vector3(mouse.x * 10, mouse.y * 10, 0)
    const direction = position.clone().sub(mousePos3D).normalize()
    const distance = position.distanceTo(mousePos3D)
    const force = Math.max(0, 1 - distance / 10) * strength
    
    position.add(direction.multiplyScalar(force))
  },
}

// Performance optimizations
export const performanceHelpers = {
  throttle: (func: Function, limit: number) => {
    let inThrottle: boolean
    return function(this: any) {
      const args = arguments
      const context = this
      if (!inThrottle) {
        func.apply(context, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },
  
  debounce: (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return function(this: any) {
      const context = this
      const args = arguments
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(context, args), wait)
    }
  },
  
  // LOD (Level of Detail) helper for text
  calculateLOD: (distance: number, levels = [10, 30, 50]) => {
    if (distance < levels[0]) return 'high'
    if (distance < levels[1]) return 'medium'
    if (distance < levels[2]) return 'low'
    return 'hidden'
  },
}