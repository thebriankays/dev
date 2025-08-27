# GSAP Animation Patterns

## Overview

This guide covers best practices for using GSAP within the shared canvas WebGL architecture.

## useGSAP Hook

The `useGSAP` hook provides automatic cleanup and context management:

```typescript
import { useGSAP } from '@/providers/Animation'

useGSAP(() => {
  // Your animations here
  gsap.to('.element', { x: 100, duration: 1 })
}, []) // Dependencies array
```

## Common Patterns

### 1. Basic Animation

```typescript
function Component() {
  const ref = useRef()
  
  useGSAP(() => {
    gsap.from(ref.current, {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: 'power3.out'
    })
  }, [])
  
  return <div ref={ref}>Content</div>
}
```

### 2. ScrollTrigger Integration

```typescript
useGSAP(() => {
  ScrollTrigger.create({
    trigger: ref.current,
    start: 'top 80%',
    end: 'bottom 20%',
    animation: gsap.timeline()
      .to(ref.current, { scale: 1.1 })
      .to(ref.current, { rotation: 360 }),
    scrub: true
  })
}, [])
```

### 3. WebGL Mesh Animation

```typescript
function WebGLComponent() {
  const meshRef = useRef()
  
  useGSAP(() => {
    const tl = gsap.timeline({ repeat: -1 })
    
    tl.to(meshRef.current.rotation, {
      y: Math.PI * 2,
      duration: 10,
      ease: 'none'
    })
    
    tl.to(meshRef.current.scale, {
      x: 1.2,
      y: 1.2,
      z: 1.2,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: 'power2.inOut'
    }, 0)
  }, [])
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial />
    </mesh>
  )
}
```

### 4. Mouse Follow Animation

```typescript
const { useMouse } = useProvider()
const followerRef = useRef()

useGSAP(() => {
  const xTo = gsap.quickTo(followerRef.current, 'x', {
    duration: 0.6,
    ease: 'power3.out'
  })
  
  const yTo = gsap.quickTo(followerRef.current, 'y', {
    duration: 0.6,
    ease: 'power3.out'
  })
  
  const handleMouseMove = (e) => {
    xTo(e.clientX)
    yTo(e.clientY)
  }
  
  window.addEventListener('mousemove', handleMouseMove)
  
  return () => {
    window.removeEventListener('mousemove', handleMouseMove)
  }
}, [])
```

### 5. Stagger Animation

```typescript
const itemsRef = useRef([])

useGSAP(() => {
  gsap.from(itemsRef.current, {
    opacity: 0,
    y: 100,
    stagger: {
      each: 0.1,
      from: 'start',
      ease: 'power2.inOut'
    },
    duration: 0.8,
    scrollTrigger: {
      trigger: containerRef.current,
      start: 'top 70%'
    }
  })
}, [])
```

### 6. Morphing SVG

```typescript
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'

gsap.registerPlugin(MorphSVGPlugin)

useGSAP(() => {
  gsap.to('#shape1', {
    morphSVG: '#shape2',
    duration: 2,
    yoyo: true,
    repeat: -1,
    ease: 'power2.inOut'
  })
}, [])
```

### 7. Text Animation

```typescript
useGSAP(() => {
  const chars = SplitText.create(textRef.current, {
    type: 'chars,words,lines'
  })
  
  gsap.from(chars.chars, {
    opacity: 0,
    y: 50,
    rotationX: -90,
    stagger: {
      each: 0.02,
      from: 'random'
    },
    duration: 1,
    ease: 'back.out(1.7)'
  })
}, [])
```

## Performance Tips

1. **Use will-change sparingly**: Only on animated properties
2. **Batch animations**: Use timelines for complex sequences
3. **Optimize triggers**: Debounce scroll and resize events
4. **Clean up**: Always kill animations on unmount
5. **GPU acceleration**: Use transform properties when possible

## WebGL-Specific Patterns

### Shader Uniform Animation

```typescript
const material = useRef()

useGSAP(() => {
  gsap.to(material.current.uniforms.uProgress, {
    value: 1,
    duration: 3,
    ease: 'power2.inOut',
    repeat: -1,
    yoyo: true
  })
}, [])
```

### Camera Movement

```typescript
const { camera } = useThree()

useGSAP(() => {
  gsap.to(camera.position, {
    z: 10,
    duration: 2,
    ease: 'power3.inOut',
    scrollTrigger: {
      trigger: '.section',
      start: 'top center',
      end: 'bottom center',
      scrub: 1
    }
  })
}, [])
```

## Integration with Lenis

The animation provider automatically syncs GSAP ScrollTrigger with Lenis:

```typescript
const { lenis } = useAnimation()

// Lenis is already integrated with ScrollTrigger
// Just use ScrollTrigger normally
ScrollTrigger.create({
  trigger: element,
  start: 'top top',
  onUpdate: (self) => {
    console.log('progress:', self.progress)
  }
})
```

## Common Gotchas

1. **Context Issues**: Always use useGSAP for automatic context
2. **Overwriting**: Set overwrite: 'auto' for conflicting animations
3. **Memory Leaks**: Kill ScrollTriggers in cleanup
4. **Performance**: Avoid animating expensive properties
5. **Accessibility**: Respect prefers-reduced-motion

## Advanced Timeline Control

```typescript
const tlRef = useRef()

useGSAP(() => {
  tlRef.current = gsap.timeline({
    paused: true,
    defaults: {
      duration: 1,
      ease: 'power2.inOut'
    }
  })
  
  tlRef.current
    .to('.step1', { x: 100 })
    .to('.step2', { y: 100 }, '-=0.5')
    .to('.step3', { scale: 1.5 }, '<')
}, [])

// Control timeline
const play = () => tlRef.current.play()
const pause = () => tlRef.current.pause()
const reverse = () => tlRef.current.reverse()
```