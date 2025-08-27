# GSAP Performance Optimization Guide

This guide covers performance optimization techniques for GSAP animations in production environments.

## Core Performance Principles

### 1. Animate Only Transform and Opacity

```typescript
// ❌ Slow - Triggers layout recalculation
gsap.to('.box', {
  width: '200px',
  height: '200px',
  left: '100px',
  top: '50px'
})

// ✅ Fast - GPU accelerated
gsap.to('.box', {
  scale: 2, // Instead of width/height
  x: 100, // Instead of left
  y: 50, // Instead of top
  opacity: 0.8
})
```

### 2. Use Will-Change Wisely

```typescript
// Our animation system handles this automatically
const { animate } = useAnimation()

// Automatically applies will-change before animation
// and removes it after completion
animate('.element', { x: 100 })
```

Manual approach:
```css
/* Only during animation */
.animating {
  will-change: transform, opacity;
}

/* Remove after animation */
.animation-complete {
  will-change: auto;
}
```

### 3. Leverage Hardware Acceleration

```typescript
// Force 3D transform for GPU acceleration
gsap.set('.element', { 
  transformPerspective: 1000,
  force3D: true // Our config enables this by default
})

// Or use z:0.01 trick
gsap.to('.element', { 
  x: 100, 
  z: 0.01 // Triggers GPU acceleration
})
```

## Mobile Optimization

### 1. Detect Device Capabilities

```typescript
import { useDeviceDetection } from '@/hooks/useDeviceDetection'
import { usePerformance } from '@/hooks/usePerformance'

const Component = () => {
  const { isMobile, isLowEnd } = useDeviceDetection()
  const { fps, isSlowDevice } = usePerformance()

  // Adapt animations based on device
  const animationConfig = isSlowDevice
    ? { duration: 0.3, ease: 'none' }
    : { duration: 0.8, ease: 'power3.out' }
}
```

### 2. Reduce Animation Complexity on Mobile

```typescript
// Desktop: Complex timeline
const desktopAnimation = () => {
  const tl = gsap.timeline()
  tl.to('.hero-title', { 
    y: 0, 
    opacity: 1, 
    duration: 1,
    ease: 'power4.out' 
  })
  .to('.hero-particles', { 
    scale: 1.2, 
    rotation: 360,
    stagger: 0.1 
  }, '-=0.5')
  .to('.hero-glow', { 
    opacity: 0.5, 
    blur: 20 
  }, '-=0.3')
}

// Mobile: Simplified version
const mobileAnimation = () => {
  gsap.to('.hero-title', { 
    opacity: 1, 
    duration: 0.5 
  })
}

// Choose based on device
const { isMobile } = useDeviceDetection()
if (isMobile) {
  mobileAnimation()
} else {
  desktopAnimation()
}
```

### 3. Respect Reduced Motion

```typescript
// Check user preference
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

// Option 1: Disable animations
if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(0)
}

// Option 2: Simplify animations
const duration = prefersReducedMotion ? 0 : 0.8
gsap.to('.element', { opacity: 1, duration })

// Option 3: Use our hook (recommended)
const { animate } = useAnimation() // Handles reduced motion automatically
```

## Batch Processing with Tempus

Our project uses Tempus for efficient frame scheduling:

```typescript
import { useTempus } from '@/hooks/useTempus'

const Component = () => {
  const tempus = useTempus()

  // Schedule animations efficiently
  const handleScroll = () => {
    tempus.add(() => {
      // All animations in same frame
      gsap.set('.element1', { y: scrollY * 0.5 })
      gsap.set('.element2', { y: scrollY * 0.3 })
      gsap.set('.element3', { y: scrollY * 0.1 })
    }, 'scroll-parallax')
  }
}
```

## ScrollTrigger Performance

### 1. Limit Active ScrollTriggers

```typescript
// ❌ Too many ScrollTriggers
items.forEach(item => {
  ScrollTrigger.create({
    trigger: item,
    animation: gsap.to(item, { opacity: 1 })
  })
})

// ✅ Use batch for similar animations
ScrollTrigger.batch('.item', {
  onEnter: batch => gsap.to(batch, { 
    opacity: 1, 
    stagger: 0.1 
  })
})
```

### 2. Use `once: true` When Possible

```typescript
// Destroy ScrollTrigger after first trigger
ScrollTrigger.create({
  trigger: '.hero',
  once: true, // Self-destructs after triggering
  animation: gsap.from('.hero-content', { 
    opacity: 0, 
    y: 100 
  })
})
```

### 3. Optimize Pinned Sections

```typescript
// Minimize pinned sections on mobile
const { isMobile } = useDeviceDetection()

ScrollTrigger.create({
  trigger: '.pinned-section',
  pin: !isMobile, // Disable pinning on mobile
  animation: timeline
})
```

## Memory Management

### 1. Clean Up Properly

```typescript
// Always use cleanup functions
useGSAP(() => {
  const tl = gsap.timeline()
  const st = ScrollTrigger.create({})
  
  return () => {
    tl.kill()
    st.kill()
  }
}, [])
```

### 2. Reuse Animations

```typescript
// ❌ Creating new animations repeatedly
const handleHover = () => {
  gsap.to('.button', { scale: 1.1 })
}

// ✅ Reuse timeline
const hoverTl = gsap.timeline({ paused: true })
  .to('.button', { scale: 1.1 })

const handleHover = () => hoverTl.play()
const handleLeave = () => hoverTl.reverse()
```

### 3. Clear Inline Styles

```typescript
// Clean up after animations
const animate = () => {
  gsap.to('.element', {
    x: 100,
    onComplete: () => {
      // Remove inline styles when done
      gsap.set('.element', { clearProps: 'all' })
    }
  })
}
```

## Performance Monitoring

### 1. Use Performance Hook

```typescript
import { usePerformance } from '@/hooks/usePerformance'

const Component = () => {
  const { fps, isSlowDevice, averageFrameTime } = usePerformance()
  
  useEffect(() => {
    if (fps < 30) {
      // Reduce animation complexity
      gsap.globalTimeline.timeScale(2) // Speed up
    }
  }, [fps])
}
```

### 2. Debug Performance

```typescript
// Enable GSAP performance tracking
gsap.config({
  trialWarn: false,
  nullTargetWarn: false,
  units: { left: '%', top: '%', rotation: 'rad' }
})

// Monitor ScrollTrigger
ScrollTrigger.config({
  limitCallbacks: true, // Limit callback frequency
  syncInterval: 40 // Increase sync interval
})
```

## Best Practices Checklist

### Before Animation
- [ ] Check device capabilities
- [ ] Respect reduced motion preferences
- [ ] Set up will-change (or use our hooks)
- [ ] Use GPU-accelerated properties only

### During Animation
- [ ] Batch similar animations
- [ ] Use Tempus for frame scheduling
- [ ] Monitor performance metrics
- [ ] Throttle scroll/resize handlers

### After Animation
- [ ] Clean up animations properly
- [ ] Remove will-change
- [ ] Clear unnecessary inline styles
- [ ] Kill unused ScrollTriggers

## Performance Tips Summary

1. **Transform & Opacity Only** - Stick to GPU-accelerated properties
2. **Mobile First** - Design animations for mobile, enhance for desktop
3. **Batch Operations** - Group similar animations together
4. **Clean Up** - Always destroy animations when done
5. **Monitor FPS** - Adapt animations based on device performance
6. **Use Production Builds** - Minified GSAP for smaller bundle size
7. **Lazy Load** - Load animation code only when needed

## Related Resources

- [Common Mistakes](./common-mistakes.md)
- [Best Practices](./best-practices.md)
- [ScrollTrigger Tips](./scrolltrigger-tips.md)
- [Animation System Documentation](/src/animation/README.md)