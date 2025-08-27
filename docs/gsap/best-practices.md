# GSAP Best Practices

This guide covers general best practices for using GSAP effectively in our project, including position parameter usage, keyframes, React integration, and more.

## Position Parameter Mastery

The position parameter is one of GSAP's most powerful features for creating complex sequences.

### Basic Syntax

```typescript
const tl = gsap.timeline()

// Absolute position (in seconds)
tl.to('.box1', { x: 100 }, 0) // Starts at 0 seconds
tl.to('.box2', { x: 100 }, 1) // Starts at 1 second

// Relative to previous animation
tl.to('.box1', { x: 100 })
  .to('.box2', { x: 100 }, '-=0.5') // Start 0.5s before previous ends
  .to('.box3', { x: 100 }, '+=0.5') // Start 0.5s after previous ends

// Relative to timeline start
tl.to('.box1', { x: 100 }, '<') // Start with previous animation
  .to('.box2', { x: 100 }, '>') // Start after previous animation

// Labels
tl.add('start')
  .to('.box1', { x: 100 }, 'start')
  .to('.box2', { x: 100 }, 'start+=0.5')
```

### Advanced Position Parameter Techniques

```typescript
// Complex sequencing with labels
const tl = gsap.timeline()

tl.add('intro')
  .to('.logo', { opacity: 1 }, 'intro')
  .to('.tagline', { opacity: 1 }, 'intro+=0.3')
  .add('main', '+=0.5')
  .to('.content', { opacity: 1 }, 'main')
  .to('.cta', { scale: 1 }, 'main+=0.2')

// Percentage-based positioning
tl.to('.element', { x: 100 }, '50%') // Halfway through timeline

// Using functions
tl.to('.element', { x: 100 }, () => {
  return tl.duration() * 0.5 // Dynamic positioning
})
```

## Keyframes for Efficient Animations

### Basic Keyframes

```typescript
// Instead of multiple .to() calls
gsap.to('.element', {
  keyframes: [
    { x: 100, duration: 0.5 },
    { y: 100, duration: 0.5 },
    { rotation: 180, duration: 0.5 },
    { scale: 1.5, duration: 0.5 }
  ]
})

// With easing per keyframe
gsap.to('.element', {
  keyframes: [
    { x: 100, ease: 'power2.out' },
    { y: 100, ease: 'power2.inOut' },
    { rotation: 180, ease: 'back.out' }
  ],
  duration: 2 // Total duration
})
```

### Advanced Keyframes

```typescript
// Percentage-based keyframes (like CSS)
gsap.to('.element', {
  keyframes: {
    '0%': { x: 0, y: 0 },
    '25%': { x: 100, y: 0 },
    '50%': { x: 100, y: 100 },
    '75%': { x: 0, y: 100 },
    '100%': { x: 0, y: 0 }
  },
  duration: 4,
  ease: 'none' // Linear through keyframes
})

// Complex multi-property animation
gsap.to('.card', {
  keyframes: {
    '0%': { 
      rotationY: 0, 
      scale: 1, 
      boxShadow: '0 0 0 rgba(0,0,0,0)' 
    },
    '50%': { 
      rotationY: 180, 
      scale: 1.1, 
      boxShadow: '0 10px 20px rgba(0,0,0,0.3)' 
    },
    '100%': { 
      rotationY: 360, 
      scale: 1, 
      boxShadow: '0 0 0 rgba(0,0,0,0)' 
    }
  },
  duration: 2,
  ease: 'power2.inOut'
})
```

## React Integration Best Practices

### 1. Use Our Custom Hooks

```typescript
import { useGSAP } from '@/hooks/useGSAP'
import { useAnimation } from '@/animation/hooks'

const Component = () => {
  // Automatic cleanup and context management
  useGSAP(() => {
    gsap.to('.box', { x: 100 })
  }, []) // Dependencies like useEffect

  // Or use our animation hook
  const { animate, timeline } = useAnimation()
  
  useEffect(() => {
    animate('.box', { x: 100 })
  }, [])
}
```

### 2. Ref-Based Animations

```typescript
const Component = () => {
  const boxRef = useRef(null)
  const containerRef = useRef(null)

  useGSAP(() => {
    // Scope animations to container
    const ctx = gsap.context(() => {
      // Use refs directly
      gsap.to(boxRef.current, { x: 100 })
      
      // Or use selectors within scope
      gsap.to('.child-element', { y: 50 })
    }, containerRef) // Scope to container

    return () => ctx.revert() // Cleanup
  }, [])

  return (
    <div ref={containerRef}>
      <div ref={boxRef} className="box" />
      <div className="child-element" />
    </div>
  )
}
```

### 3. State-Driven Animations

```typescript
const Component = () => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useGSAP(() => {
    if (isOpen) {
      gsap.to(menuRef.current, { 
        x: 0, 
        duration: 0.3,
        ease: 'power2.out' 
      })
    } else {
      gsap.to(menuRef.current, { 
        x: '-100%', 
        duration: 0.3,
        ease: 'power2.in' 
      })
    }
  }, [isOpen]) // Re-run when state changes

  return <div ref={menuRef}>Menu Content</div>
}
```

## Timeline Management

### 1. Modular Timelines

```typescript
// Create reusable timeline functions
const createIntroAnimation = () => {
  const tl = gsap.timeline()
  tl.from('.logo', { opacity: 0, y: -50 })
    .from('.nav', { opacity: 0, y: -30 }, '-=0.3')
  return tl
}

const createContentAnimation = () => {
  const tl = gsap.timeline()
  tl.from('.content', { opacity: 0, y: 30 })
    .from('.sidebar', { opacity: 0, x: 50 }, '-=0.5')
  return tl
}

// Compose in master timeline
const masterTl = gsap.timeline()
  .add(createIntroAnimation())
  .add(createContentAnimation(), '-=0.2')
```

### 2. Timeline Controls

```typescript
const AnimationControls = () => {
  const tlRef = useRef(null)

  useGSAP(() => {
    tlRef.current = gsap.timeline({ paused: true })
      .to('.box', { x: 100 })
      .to('.box', { y: 100 })
      .to('.box', { rotation: 360 })
  }, [])

  return (
    <div>
      <button onClick={() => tlRef.current.play()}>Play</button>
      <button onClick={() => tlRef.current.pause()}>Pause</button>
      <button onClick={() => tlRef.current.reverse()}>Reverse</button>
      <button onClick={() => tlRef.current.restart()}>Restart</button>
      <button onClick={() => tlRef.current.timeScale(2)}>2x Speed</button>
    </div>
  )
}
```

## Stagger Animations

### Basic Stagger

```typescript
// Simple stagger
gsap.to('.item', {
  opacity: 1,
  y: 0,
  stagger: 0.1 // 0.1s between each
})

// Stagger with config
gsap.to('.item', {
  opacity: 1,
  y: 0,
  stagger: {
    amount: 1, // Total time for all staggers
    from: 'center', // Start from center
    grid: 'auto', // Treat as grid
    ease: 'power2.inOut'
  }
})
```

### Advanced Stagger Patterns

```typescript
// Custom stagger function
gsap.to('.item', {
  opacity: 1,
  scale: 1,
  stagger: {
    each: 0.1,
    from: 'random',
    repeat: -1,
    yoyo: true
  }
})

// Directional stagger
gsap.to('.grid-item', {
  scale: 0,
  stagger: {
    grid: [7, 5], // 7 columns, 5 rows
    from: 'edges',
    axis: 'both',
    ease: 'power3.inOut',
    amount: 1.5
  }
})
```

## Responsive Animations

### Using matchMedia

```typescript
useGSAP(() => {
  const mm = gsap.matchMedia()

  mm.add({
    // Mobile
    '(max-width: 768px)': () => {
      gsap.to('.hero', { scale: 0.8, duration: 0.5 })
    },
    
    // Tablet
    '(min-width: 769px) and (max-width: 1024px)': () => {
      gsap.to('.hero', { scale: 0.9, duration: 0.7 })
    },
    
    // Desktop
    '(min-width: 1025px)': () => {
      gsap.to('.hero', { scale: 1, duration: 1 })
    },
    
    // Reduced motion
    '(prefers-reduced-motion: reduce)': () => {
      gsap.set('.hero', { scale: 1 }) // No animation
    }
  })

  return () => mm.revert()
}, [])
```

## Error Handling

### Defensive Coding

```typescript
const animateElement = (selector: string) => {
  // Check if element exists
  const element = document.querySelector(selector)
  if (!element) {
    console.warn(`Element ${selector} not found`)
    return
  }

  // Safe animation
  gsap.to(element, {
    x: 100,
    duration: 1,
    onComplete: () => {
      console.log('Animation complete')
    },
    onError: (error) => {
      console.error('Animation error:', error)
    }
  })
}
```

### Graceful Degradation

```typescript
const createAnimation = () => {
  try {
    // Complex animation
    const tl = gsap.timeline()
    tl.to('.complex-element', { 
      morphSVG: '.target-shape',
      duration: 2 
    })
    return tl
  } catch (error) {
    // Fallback to simple animation
    console.warn('MorphSVG not available, using fallback')
    return gsap.to('.complex-element', { 
      opacity: 1, 
      duration: 1 
    })
  }
}
```

## Code Organization

### 1. Animation Constants

```typescript
// animations/constants.ts
export const DURATIONS = {
  fast: 0.3,
  normal: 0.6,
  slow: 1.2
}

export const EASINGS = {
  smooth: 'power2.inOut',
  bounce: 'back.out(1.7)',
  elastic: 'elastic.out(1, 0.3)'
}

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440
}
```

### 2. Animation Utilities

```typescript
// animations/utils.ts
export const fadeIn = (element: string | Element, duration = DURATIONS.normal) => {
  return gsap.from(element, { 
    opacity: 0, 
    duration,
    ease: EASINGS.smooth 
  })
}

export const slideIn = (element: string | Element, direction = 'left') => {
  const x = direction === 'left' ? -100 : 100
  return gsap.from(element, { 
    x, 
    opacity: 0,
    duration: DURATIONS.normal,
    ease: EASINGS.smooth
  })
}
```

## Testing Animations

### 1. Development Tools

```typescript
// Enable GSDevTools in development
if (process.env.NODE_ENV === 'development') {
  gsap.registerPlugin(GSDevTools)
  GSDevTools.create()
}
```

### 2. Animation Debugging

```typescript
// Debug timeline
const debugTimeline = (tl: gsap.core.Timeline) => {
  console.log('Duration:', tl.duration())
  console.log('Progress:', tl.progress())
  console.log('Time:', tl.time())
  
  // List all tweens
  tl.getChildren().forEach((tween, index) => {
    console.log(`Tween ${index}:`, {
      target: tween.targets(),
      duration: tween.duration(),
      vars: tween.vars
    })
  })
}
```

## Summary Checklist

- [ ] Use position parameters for precise sequencing
- [ ] Leverage keyframes for complex animations
- [ ] Always clean up animations in React
- [ ] Use refs for direct element access
- [ ] Create modular, reusable timelines
- [ ] Implement responsive animations with matchMedia
- [ ] Handle errors gracefully
- [ ] Organize code with constants and utilities
- [ ] Test animations thoroughly
- [ ] Monitor performance on real devices

## Related Resources

- [Common Mistakes](./common-mistakes.md)
- [Performance Guide](./performance.md)
- [ScrollTrigger Tips](./scrolltrigger-tips.md)
- [Animation System](/src/animation/README.md)
- [GSAP Documentation](https://gsap.com/docs/)