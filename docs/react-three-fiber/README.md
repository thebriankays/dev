# React Three Fiber (R3F) Documentation

## Overview

React Three Fiber (R3F) is a React renderer for Three.js that brings declarative, component-based patterns to WebGL development. This documentation covers how R3F integrates with our WebGL shared canvas system and provides performance guidelines for building high-performance 3D experiences.

## Table of Contents

1. [Integration with WebGL System](#integration-with-webgl-system)
2. [Performance Guidelines](./performance-scaling.md)
3. [Common Pitfalls](./pitfalls.md)
4. [Three.js Tips](./three-tips.md)
5. [Best Practices](./best-practices.md)

## Integration with WebGL System

Our project uses a shared canvas architecture that combines:
- **drei's View component** for automatic bounds management
- **React Three Fiber** for declarative 3D scene composition
- **SharedCanvasProvider** for single WebGL context management
- **Performance optimizations** for mobile and desktop

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
├─────────────────────────────────────────────────────────┤
│  React Components  │  R3F Components  │  WebGL Effects  │
├─────────────────────────────────────────────────────────┤
│         SharedCanvasProvider (drei View system)          │
├─────────────────────────────────────────────────────────┤
│                 React Three Fiber Canvas                 │
├─────────────────────────────────────────────────────────┤
│                      Three.js Core                       │
└─────────────────────────────────────────────────────────┘
```

### Using the Shared Canvas System

Our architecture uses drei's View component to automatically manage bounds for each WebGL component:

#### Creating a WebGL Component

```tsx
import { useWebGLView } from '@/hooks/useWebGLView'
import { View } from '@react-three/drei'

export function MyWebGLComponent({ className }) {
  const viewRef = useWebGLView<HTMLDivElement>()

  return (
    <div ref={viewRef} className={className}>
      <View track={viewRef as React.RefObject<HTMLElement>}>
        {/* Your 3D content */}
        <mesh>
          <boxGeometry />
          <meshStandardMaterial color="#ff006e" />
        </mesh>
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} />
      </View>
    </div>
  )
}
```

#### Multiple WebGL Components on Same Page

The shared canvas system allows multiple WebGL components to coexist efficiently:

```tsx
export function PageWithMultipleWebGL() {
  return (
    <div className="space-y-8">
      {/* Hero section with animated gradient */}
      <AnimatedGradient className="h-screen">
        <h1>Welcome</h1>
      </AnimatedGradient>
      
      {/* Product showcase with 3D model */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2>Product Details</h2>
          <p>Description...</p>
        </div>
        <Product3DView className="aspect-square" />
      </div>
      
      {/* Interactive WebGL visualization */}
      <DataVisualization className="h-96" />
    </div>
  )
}
```

### Creating R3F Components

#### Basic R3F Component Structure

```tsx
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

export function RotatingCube() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5
      meshRef.current.rotation.y += delta * 0.5
    }
  })
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  )
}
```

#### Performance-Optimized Component

```tsx
import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial } from '@react-three/drei'

// Memoize components to prevent unnecessary re-renders
export const OptimizedMesh = memo(function OptimizedMesh({ 
  position = [0, 0, 0],
  scale = 1,
  color = '#8b5cf6'
}) {
  const meshRef = useRef()
  
  // Use frame callbacks sparingly
  useFrame((state) => {
    if (meshRef.current) {
      // Only update when visible
      const distance = state.camera.position.distanceTo(meshRef.current.position)
      if (distance < 10) {
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
      }
    }
  }, 1) // Priority 1 = run after render
  
  return (
    <mesh 
      ref={meshRef} 
      position={position} 
      scale={scale}
      frustumCulled // Enable frustum culling
    >
      <sphereGeometry args={[1, 32, 32]} />
      <MeshDistortMaterial
        color={color}
        speed={2}
        distort={0.3}
        radius={1}
      />
    </mesh>
  )
})
```

### Performance Monitoring Integration

```tsx
import { Perf } from 'r3f-perf'
import { Stats } from '@react-three/drei'
import { usePerformance } from '@/hooks/usePerformance'

export function PerformanceMonitor({ children }) {
  const { isLowPerformance } = usePerformance()
  
  return (
    <>
      {/* Show performance stats in development */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <Perf position="top-left" />
          <Stats />
        </>
      )}
      
      {/* Conditionally render based on performance */}
      {isLowPerformance ? (
        <SimplifiedScene />
      ) : (
        children
      )}
    </>
  )
}
```

### Mobile Optimization

```tsx
import { useDeviceDetection } from '@/hooks/useDeviceDetection'
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'

export function MobileOptimizedCanvas({ children }) {
  const { isMobile } = useDeviceDetection()
  
  return (
    <Canvas
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      shadows={!isMobile} // Disable shadows on mobile
      camera={{ 
        fov: isMobile ? 50 : 45,
        near: 0.1,
        far: isMobile ? 100 : 1000
      }}
    >
      {/* Adaptive pixel ratio */}
      <AdaptiveDpr pixelated />
      
      {/* Adaptive events (reduces event frequency on low-end devices) */}
      <AdaptiveEvents />
      
      {children}
    </Canvas>
  )
}
```

### Texture Loading and Optimization

```tsx
import { useTexture, useProgress } from '@react-three/drei'
import { Suspense } from 'react'

function TextureLoader({ url, onLoad }) {
  const texture = useTexture(url, (texture) => {
    // Optimize texture settings
    texture.generateMipmaps = true
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = 16
    onLoad?.(texture)
  })
  
  return texture
}

export function OptimizedTexturedMesh() {
  const { progress } = useProgress()
  
  return (
    <Suspense fallback={<LoadingIndicator progress={progress} />}>
      <mesh>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial>
          <TextureLoader url="/textures/diffuse.jpg" attach="map" />
          <TextureLoader url="/textures/normal.jpg" attach="normalMap" />
        </meshStandardMaterial>
      </mesh>
    </Suspense>
  )
}
```

### Event Handling Best Practices

```tsx
import { ThreeEvent } from '@react-three/fiber'
import { useState, useCallback } from 'react'

export function InteractiveMesh() {
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  
  // Memoize event handlers
  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }, [])
  
  const handlePointerOut = useCallback(() => {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }, [])
  
  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    setClicked(!clicked)
  }, [clicked])
  
  return (
    <mesh
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      scale={clicked ? 1.5 : 1}
    >
      <boxGeometry />
      <meshStandardMaterial 
        color={hovered ? 'hotpink' : 'orange'} 
        emissive={clicked ? 'orange' : 'black'}
        emissiveIntensity={0.5}
      />
    </mesh>
  )
}
```

### Integration with GSAP/Animation System

```tsx
import { useGSAP } from '@/hooks/useGSAP'
import { useRef } from 'react'
import { gsap } from 'gsap'

export function GSAPAnimatedMesh() {
  const meshRef = useRef()
  
  useGSAP(() => {
    if (meshRef.current) {
      gsap.to(meshRef.current.rotation, {
        y: Math.PI * 2,
        duration: 3,
        repeat: -1,
        ease: 'power2.inOut'
      })
      
      gsap.to(meshRef.current.position, {
        y: 1,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })
    }
  }, [])
  
  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1, 0.3, 128, 16]} />
      <meshNormalMaterial />
    </mesh>
  )
}
```

### Scene Composition Patterns

```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'

export function CompleteScene() {
  return (
    <Canvas shadows camera={{ position: [0, 5, 10] }}>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Environment */}
      <Environment preset="city" />
      
      {/* Objects */}
      <group>
        <OptimizedMesh position={[-2, 0, 0]} />
        <OptimizedMesh position={[2, 0, 0]} />
      </group>
      
      {/* Ground shadows */}
      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.5}
        scale={10}
        blur={2}
        far={10}
      />
      
      {/* Controls */}
      <OrbitControls
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minDistance={3}
        maxDistance={20}
      />
    </Canvas>
  )
}
```

## Quick Start Guide

1. **Install dependencies** (already included in package.json)
   ```bash
   pnpm add @react-three/fiber @react-three/drei @react-three/postprocessing
   ```

2. **Create your first R3F scene**
   ```tsx
   import { Canvas } from '@react-three/fiber'
   
   export default function MyFirstScene() {
     return (
       <Canvas>
         <ambientLight />
         <pointLight position={[10, 10, 10]} />
         <mesh>
           <boxGeometry />
           <meshStandardMaterial color="orange" />
         </mesh>
       </Canvas>
     )
   }
   ```

3. **Follow performance guidelines** in [performance-scaling.md](./performance-scaling.md)

4. **Avoid common pitfalls** detailed in [pitfalls.md](./pitfalls.md)

5. **Apply best practices** from [best-practices.md](./best-practices.md)

## Resources

- [R3F Official Documentation](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Documentation](https://threejs.org/docs)
- [R3F Examples](https://docs.pmnd.rs/react-three-fiber/examples/showcase)
- [Performance Monitor (r3f-perf)](https://github.com/utsuboco/r3f-perf)

## Next Steps

Continue to:
- [Performance & Scaling Guidelines](./performance-scaling.md)
- [Common Pitfalls & Solutions](./pitfalls.md)
- [Three.js Tips & Tricks](./three-tips.md)
- [Best Practices](./best-practices.md)