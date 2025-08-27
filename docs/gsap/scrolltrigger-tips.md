# ScrollTrigger Tips and Gotchas

ScrollTrigger is GSAP's scroll-based animation plugin. This guide covers advanced tips and common gotchas when working with ScrollTrigger in our project.

## Integration with Lenis Smooth Scroll

Our project uses Lenis for smooth scrolling. Here's how ScrollTrigger is configured to work with it:

```typescript
// Already configured in our animation system
import { useScrollTrigger } from '@/hooks/useScrollTrigger'

// Use our custom hook for proper integration
useScrollTrigger({
  trigger: '.section',
  start: 'top 80%',
  animation: gsap.to('.content', { opacity: 1 })
})
```

## Common ScrollTrigger Patterns

### 1. Parallax Effects

```typescript
useScrollTrigger({
  trigger: '.parallax-section',
  start: 'top bottom',
  end: 'bottom top',
  scrub: 1, // Smooth scrubbing
  animation: gsap.to('.bg-image', {
    y: '-30%', // Move slower than scroll
    ease: 'none'
  })
})
```

### 2. Progress-Based Animations

```typescript
useScrollTrigger({
  trigger: '.progress-section',
  start: 'top 80%',
  end: 'bottom 20%',
  scrub: true,
  onUpdate: (self) => {
    // Use progress for custom animations
    const progress = self.progress
    document.querySelector('.progress-bar').style.width = `${progress * 100}%`
  }
})
```

### 3. Pinned Sections

```typescript
useScrollTrigger({
  trigger: '.pin-section',
  start: 'top top',
  end: '+=500', // Pin for 500px of scroll
  pin: true,
  pinSpacing: true, // Default, adds spacing
  animation: gsap.timeline()
    .to('.pin-content', { x: -100 })
    .to('.pin-content', { opacity: 0 })
})
```

## Performance Tips

### 1. Use `once: true` for One-Time Animations

```typescript
// Good for reveal animations
useScrollTrigger({
  trigger: '.reveal',
  start: 'top 80%',
  once: true, // Fires once, then self-destructs
  animation: gsap.from('.reveal', { 
    opacity: 0, 
    y: 50 
  })
})
```

### 2. Batch Similar Animations

```typescript
// Instead of creating many ScrollTriggers
ScrollTrigger.batch('.card', {
  interval: 0.1, // Time between each
  batchMax: 3, // Maximum in each batch
  onEnter: batch => gsap.to(batch, {
    opacity: 1,
    y: 0,
    stagger: 0.15,
    overwrite: true
  }),
  onLeave: batch => gsap.to(batch, {
    opacity: 0,
    y: -100,
    stagger: 0.15,
    overwrite: true
  }),
  onEnterBack: batch => gsap.to(batch, {
    opacity: 1,
    y: 0,
    stagger: 0.15,
    overwrite: true
  }),
  onLeaveBack: batch => gsap.to(batch, {
    opacity: 0,
    y: 100,
    stagger: 0.15,
    overwrite: true
  })
})
```

### 3. Optimize Refresh Calls

```typescript
// Batch multiple updates
ScrollTrigger.refresh() // Expensive!

// Better: Update once after all changes
gsap.matchMedia().add('(min-width: 768px)', () => {
  // Create all ScrollTriggers
  // Then refresh once at the end
  ScrollTrigger.refresh()
})
```

## Common Gotchas

### 1. Dynamic Content Issues

```typescript
// Problem: Content loads after ScrollTrigger creation
useEffect(() => {
  loadContent().then(() => {
    // ScrollTrigger positions are wrong!
  })
}, [])

// Solution: Refresh after content loads
useEffect(() => {
  loadContent().then(() => {
    ScrollTrigger.refresh()
  })
}, [])
```

### 2. Incorrect Start/End Values

```typescript
// Common mistakes
start: '50%' // Missing second value
start: 'top 50%' // Is this element top or viewport top?

// Clear syntax
start: 'top center', // Element top hits viewport center
end: 'bottom 80%', // Element bottom hits 80% down viewport
```

### 3. Transforms Affecting Triggers

```typescript
// Problem: Parent has transform
<div style={{ transform: 'scale(0.9)' }}>
  <div className="trigger">Content</div>
</div>

// Solution: Use separate wrapper
<div className="scale-wrapper" style={{ transform: 'scale(0.9)' }}>
  <div className="content">Content</div>
</div>
<div className="trigger"><!-- Trigger outside transform --></div>
```

## Advanced Techniques

### 1. Responsive ScrollTriggers

```typescript
// Use matchMedia for responsive behavior
gsap.matchMedia().add({
  // Mobile
  '(max-width: 768px)': () => {
    ScrollTrigger.create({
      trigger: '.section',
      start: 'top 90%', // Different on mobile
      animation: gsap.to('.content', { x: 50 })
    })
  },
  
  // Desktop
  '(min-width: 769px)': () => {
    ScrollTrigger.create({
      trigger: '.section',
      start: 'top 70%',
      animation: gsap.to('.content', { x: 100 })
    })
  }
})
```

### 2. Horizontal Scrolling

```typescript
// Create horizontal scroll effect
const sections = gsap.utils.toArray('.horizontal-section')

gsap.to(sections, {
  xPercent: -100 * (sections.length - 1),
  ease: 'none',
  scrollTrigger: {
    trigger: '.horizontal-container',
    pin: true,
    scrub: 1,
    snap: 1 / (sections.length - 1),
    end: () => '+=' + document.querySelector('.horizontal-container').offsetWidth
  }
})
```

### 3. Smooth Scrubbing

```typescript
// Different scrub values for different effects
scrub: true, // Immediate connection to scroll
scrub: 1, // 1 second to catch up
scrub: 0.5, // Smoother, quicker catch up

// Custom scrub behavior
let proxy = { value: 0 }
ScrollTrigger.create({
  onUpdate: self => {
    gsap.to(proxy, {
      value: self.progress,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => {
        // Use proxy.value for smooth animation
      }
    })
  }
})
```

## Debugging ScrollTrigger

### 1. Visual Markers

```typescript
ScrollTrigger.create({
  trigger: '.section',
  start: 'top center',
  end: 'bottom center',
  markers: true, // Shows start/end markers
  id: 'my-trigger' // Label for markers
})
```

### 2. Console Debugging

```typescript
ScrollTrigger.create({
  trigger: '.section',
  onUpdate: self => {
    console.log('Progress:', self.progress)
    console.log('Direction:', self.direction)
    console.log('Velocity:', self.getVelocity())
  }
})
```

### 3. Common Issues Checklist

- [ ] Is the trigger element in the DOM when ScrollTrigger is created?
- [ ] Are transforms on parents affecting positioning?
- [ ] Is smooth scrolling interfering? (Use our Lenis integration)
- [ ] Are you creating ScrollTriggers in the correct order?
- [ ] Did you refresh after dynamic content changes?
- [ ] Are your start/end values using the correct syntax?

## Best Practices

1. **Always use our hooks** - They handle Lenis integration automatically
2. **Create in DOM order** - Top to bottom for predictable behavior
3. **Use `once: true`** - For reveal animations to improve performance
4. **Batch similar animations** - Reduces ScrollTrigger instances
5. **Test with markers** - During development to verify positions
6. **Handle resize properly** - ScrollTrigger auto-refreshes, but test it
7. **Consider mobile** - Simpler animations, different triggers

## Related Resources

- [Performance Guide](./performance.md)
- [Common Mistakes](./common-mistakes.md)
- [Best Practices](./best-practices.md)
- [GSAP ScrollTrigger Docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)