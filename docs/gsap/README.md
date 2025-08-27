# GSAP Documentation

## Overview

GSAP (GreenSock Animation Platform) is a professional-grade JavaScript animation library that powers this project's animation system. This documentation covers best practices, common mistakes, and optimization techniques for working with GSAP in our SSG (Static Site Generator) project.

## Quick Links

- [Common Mistakes](./common-mistakes.md) - Avoid these common GSAP pitfalls
- [ScrollTrigger Tips](./scrolltrigger-tips.md) - Master scroll-based animations
- [Performance](./performance.md) - Optimize your animations
- [Best Practices](./best-practices.md) - General guidelines and patterns

## Quick Start

### Basic Setup

Our project has GSAP pre-configured with custom defaults. Import animations through our animation system:

```typescript
import { useAnimation } from '@/animation/hooks'
import { gsap } from '@/animation/core/gsap-config'
```

### Your First Animation

```typescript
// Using the useAnimation hook
const MyComponent = () => {
  const { animate, cleanup } = useAnimation()
  
  useEffect(() => {
    // Simple fade in
    animate('.my-element', {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: 'power2.out'
    })
    
    return cleanup
  }, [])
  
  return <div className="my-element">Hello GSAP!</div>
}
```

### Timeline Animation

```typescript
// Create a timeline for sequenced animations
const { timeline } = useAnimation()

const tl = timeline()
  .from('.hero-title', { opacity: 0, y: 30 })
  .from('.hero-subtitle', { opacity: 0, y: 20 }, '-=0.3')
  .from('.hero-cta', { opacity: 0, scale: 0.9 }, '-=0.2')
```

## Core Concepts

### 1. Context and Cleanup

Always use GSAP context for proper cleanup, especially in React:

```typescript
useGSAP(() => {
  // Your animations here
  gsap.to('.box', { x: 100 })
}, [dependencies]) // Dependencies array like useEffect
```

### 2. Performance First

Our animation system is optimized for performance:
- Hardware acceleration enabled by default
- Automatic will-change management
- Batched animations with Tempus
- Smooth scrolling with Lenis

### 3. Responsive Animations

Use our responsive utilities:

```typescript
const { isMobile, isTablet, isDesktop } = useDeviceDetection()

const animationProps = isMobile 
  ? { x: 50, duration: 0.5 }
  : { x: 100, duration: 0.8 }
```

### 4. ScrollTrigger Integration

ScrollTrigger is integrated with our Lenis smooth scroll:

```typescript
useScrollTrigger({
  trigger: '.section',
  start: 'top 80%',
  end: 'bottom 20%',
  animation: gsap.to('.content', { opacity: 1, y: 0 })
})
```

## Project Integration

### Animation Provider

Our app is wrapped with `AnimationProvider` which provides:
- Centralized GSAP configuration
- Performance monitoring
- Smooth scroll integration
- Global animation context

### Available Hooks

- `useAnimation()` - Main animation hook with cleanup
- `useGSAP()` - GSAP context hook for React
- `useScrollTrigger()` - ScrollTrigger with Lenis integration
- `useTempus()` - Frame scheduling for performance
- `useScrollVelocity()` - Get current scroll velocity

### Pre-built Components

We have several animation components ready to use:
- `SplitText` - Animated text splitting
- `Marquee` - Infinite scrolling text
- `ProgressText` - Text with progress indicators
- `AnimatedCards` - Card reveal animations
- `AnimatedHero` - Hero section animations

## Best Practices Summary

1. **Always clean up animations** - Use hooks that handle cleanup automatically
2. **Use timelines for complex sequences** - Better control and maintainability
3. **Optimize for mobile** - Test on real devices, use reduced motion
4. **Batch animations** - Use Tempus for frame scheduling
5. **Leverage GPU acceleration** - Animate transform and opacity properties

## Next Steps

- Review [Common Mistakes](./common-mistakes.md) to avoid pitfalls
- Learn [ScrollTrigger Tips](./scrolltrigger-tips.md) for scroll animations
- Optimize with our [Performance Guide](./performance.md)
- Master [Best Practices](./best-practices.md) for production-ready animations

## Resources

- [GSAP Documentation](https://gsap.com/docs/)
- [GSAP Forums](https://gsap.com/forums/)
- [Project Animation System](/src/animation/README.md)
- [Component Examples](/src/components/animation/)