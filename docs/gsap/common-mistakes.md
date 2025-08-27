# Common GSAP Mistakes and How to Avoid Them

This guide covers the most common mistakes developers make with GSAP and provides solutions to avoid them.

## 1. Not Cleaning Up Animations

### ❌ Wrong
```typescript
useEffect(() => {
  gsap.to('.box', { x: 100 })
  // No cleanup!
}, [])
```

### ✅ Correct
```typescript
useGSAP(() => {
  gsap.to('.box', { x: 100 })
}, []) // Automatic cleanup with useGSAP hook

// Or manually:
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to('.box', { x: 100 })
  })
  
  return () => ctx.revert() // Cleanup!
}, [])
```

## 2. Creating ScrollTriggers in the Wrong Order

### ❌ Wrong
```typescript
// Random order can cause issues
gsap.to('.footer', {
  scrollTrigger: { start: 'top bottom' }
})

gsap.to('.header', {
  scrollTrigger: { start: 'top top' }
})
```

### ✅ Correct
```typescript
// Create in DOM order (top to bottom)
gsap.to('.header', {
  scrollTrigger: { start: 'top top' }
})

gsap.to('.footer', {
  scrollTrigger: { start: 'top bottom' }
})

// Or use refreshPriority
ScrollTrigger.create({
  trigger: '.header',
  refreshPriority: 1 // Higher priority
})
```

## 3. Animating Wrong Properties

### ❌ Wrong - Causes Layout Thrashing
```typescript
gsap.to('.box', {
  left: '100px',
  top: '50px',
  width: '200px'
})
```

### ✅ Correct - GPU Accelerated
```typescript
gsap.to('.box', {
  x: 100,
  y: 50,
  scale: 2 // Instead of width/height
})
```

## 4. Fighting with CSS

### ❌ Wrong
```css
.box {
  transition: all 0.3s ease; /* Conflicts with GSAP */
}
```

```typescript
gsap.to('.box', { x: 100 }) // Fights with CSS transition
```

### ✅ Correct
```css
.box {
  /* Remove transitions for GSAP-animated properties */
}
```

```typescript
// Or clear inline styles first
gsap.set('.box', { clearProps: 'all' })
gsap.to('.box', { x: 100 })
```

## 5. Using `from()` Animations Incorrectly

### ❌ Wrong - Flash of Unstyled Content
```typescript
gsap.from('.hero', { opacity: 0, y: 50 })
// Element visible at y:0 before animation starts
```

### ✅ Correct
```css
.hero {
  opacity: 0;
  transform: translateY(50px);
}
```

```typescript
gsap.to('.hero', { opacity: 1, y: 0 })
```

## 6. Not Using `immediateRender` Correctly

### ❌ Wrong - Unexpected behavior
```typescript
const tl = gsap.timeline()
tl.from('.box', { x: 100 })
  .from('.box', { y: 100 }, '+=1') // Box jumps back to x:100
```

### ✅ Correct
```typescript
const tl = gsap.timeline()
tl.from('.box', { x: 100 })
  .from('.box', { y: 100, immediateRender: false }, '+=1')
```

## 7. Overusing `!important` in CSS

### ❌ Wrong
```css
.box {
  transform: translateX(0) !important; /* Blocks GSAP */
}
```

### ✅ Correct
```css
.box {
  transform: translateX(0); /* Let GSAP control it */
}
```

## 8. Creating Memory Leaks with Event Listeners

### ❌ Wrong
```typescript
ScrollTrigger.create({
  trigger: '.section',
  onUpdate: self => {
    // This creates a new listener each time
    document.addEventListener('click', handleClick)
  }
})
```

### ✅ Correct
```typescript
const st = ScrollTrigger.create({
  trigger: '.section',
  onUpdate: self => {
    // Handle update without creating new listeners
  }
})

// Cleanup
return () => st.kill()
```

## 9. Not Considering Reduced Motion

### ❌ Wrong
```typescript
gsap.to('.box', { x: 100, duration: 1 })
```

### ✅ Correct
```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

gsap.to('.box', { 
  x: 100, 
  duration: prefersReducedMotion ? 0 : 1 
})

// Or use our utility
import { useAnimation } from '@/animation/hooks'
const { animate } = useAnimation() // Handles reduced motion
```

## 10. Animating Hidden Elements

### ❌ Wrong
```typescript
// Element has display: none
gsap.to('.hidden-box', { opacity: 1 }) // Won't work
```

### ✅ Correct
```typescript
gsap.set('.hidden-box', { display: 'block' })
gsap.to('.hidden-box', { opacity: 1 })

// Or use autoAlpha
gsap.to('.hidden-box', { autoAlpha: 1 }) // Handles display automatically
```

## 11. Using Magic Numbers

### ❌ Wrong
```typescript
gsap.to('.box', { x: 384, duration: 0.7 }) // What do these mean?
```

### ✅ Correct
```typescript
const SLIDE_DISTANCE = 384 // rem * 16
const ANIMATION_DURATION = 0.7

gsap.to('.box', { 
  x: SLIDE_DISTANCE, 
  duration: ANIMATION_DURATION 
})

// Or use CSS variables
gsap.to('.box', { 
  x: 'var(--slide-distance)', 
  duration: 'var(--animation-duration)' 
})
```

## 12. Not Testing on Real Devices

### ❌ Wrong
```typescript
// Looks great on desktop Chrome DevTools
gsap.to('.heavy-element', { 
  rotationY: 360, 
  duration: 1 
})
```

### ✅ Correct
```typescript
import { useDeviceDetection } from '@/hooks/useDeviceDetection'

const { isMobile } = useDeviceDetection()

// Simpler animations on mobile
gsap.to('.heavy-element', { 
  rotationY: isMobile ? 180 : 360,
  duration: isMobile ? 0.5 : 1
})
```

## Quick Checklist

Before deploying animations, ensure:

- [ ] All animations are cleaned up properly
- [ ] ScrollTriggers are created in DOM order
- [ ] Only transform and opacity are animated (when possible)
- [ ] No CSS transitions conflict with GSAP
- [ ] Reduced motion preferences are respected
- [ ] Animations are tested on real devices
- [ ] No magic numbers - use constants or CSS variables
- [ ] Event listeners are properly removed
- [ ] Hidden elements use `autoAlpha` instead of `opacity`

## Related Resources

- [Performance Guide](./performance.md)
- [ScrollTrigger Tips](./scrolltrigger-tips.md)
- [Best Practices](./best-practices.md)