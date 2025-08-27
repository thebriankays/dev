# React Three Fiber Performance & Scaling

## Overview

Performance is critical for WebGL applications. This guide covers scaling strategies, optimization techniques, and performance patterns for React Three Fiber applications.

## Table of Contents

1. [Performance Fundamentals](#performance-fundamentals)
2. [Scaling Strategies](#scaling-strategies)
3. [Level of Detail (LOD)](#level-of-detail-lod)
4. [Instancing](#instancing)
5. [Culling Techniques](#culling-techniques)
6. [Texture Optimization](#texture-optimization)
7. [Animation Performance](#animation-performance)
8. [Mobile Optimization](#mobile-optimization)
9. [Performance Monitoring](#performance-monitoring)

## Performance Fundamentals

### Key Metrics to Monitor

```tsx
import { Perf } from 'r3f-perf'

export function PerformanceDebugger() {
  return (
    <Perf 
      position="top-left"
      minimal={false} // Show all metrics
      customData={{
        value: 0, // Custom metric
        name: 'Custom',
        round: 2
      }}
    />
  )
}
```

**Critical Metrics:**
- **FPS**: Target 60fps desktop, 30fps mobile
- **GPU**: Keep under 16ms frame time
- **Memory**: Monitor texture and geometry memory
- **Draw Calls**: Minimize to under 100-200
- **Triangles**: Keep under 1M for mobile, 5M for desktop

### Performance Budget

```tsx
const PERFORMANCE_BUDGET = {
  mobile: {
    maxTriangles: 1_000_000,
    maxDrawCalls: 100,
    maxTextureMemory: 128, // MB
    targetFPS: 30,
    pixelRatio: 1
  },
  desktop: {
    maxTriangles: 5_000_000,
    maxDrawCalls: 500,
    maxTextureMemory: 512, // MB
    targetFPS: 60,
    pixelRatio: 2
  }
}
```

## Scaling Strategies

### 1. Progressive Enhancement

```tsx
import { usePerformance } from '@/hooks/usePerformance'
import { Detailed, Standard, Simple } from './QualityLevels'

export function AdaptiveQualityMesh({ ...props }) {
  const { tier } = usePerformance()
  
  // Render different quality levels based on device capability
  switch (tier) {
    case 'high':
      return <Detailed {...props} />
    case 'medium':
      return <Standard {...props} />
    case 'low':
      return <Simple {...props} />
    default:
      return <Simple {...props} />
  }
}
```

### 2. Dynamic Resolution Scaling

```tsx
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import { useEffect, useState } from 'react'

export function DynamicResolutionCanvas({ children }) {
  const [dpr, setDpr] = useState([1, 2])
  
  useEffect(() => {
    let lastTime = performance.now()
    let frames = 0
    let fps = 60
    
    const checkPerformance = () => {
      frames++
      const currentTime = performance.now()
      
      if (currentTime > lastTime + 1000) {
        fps = Math.round((frames * 1000) / (currentTime - lastTime))
        frames = 0
        lastTime = currentTime
        
        // Adjust DPR based on FPS
        if (fps < 30 && dpr[1] > 1) {
          setDpr([1, 1]) // Reduce resolution
        } else if (fps > 55 && dpr[1] < 2) {
          setDpr([1, 2]) // Increase resolution
        }
      }
      
      requestAnimationFrame(checkPerformance)
    }
    
    checkPerformance()
  }, [dpr])
  
  return (
    <Canvas dpr={dpr}>
      <AdaptiveDpr pixelated />
      {children}
    </Canvas>
  )
}
```

### 3. Lazy Loading & Code Splitting

```tsx
import { lazy, Suspense } from 'react'
import { Loader } from '@react-three/drei'

// Lazy load heavy 3D components
const HeavyModel = lazy(() => import('./HeavyModel'))
const ParticleSystem = lazy(() => import('./ParticleSystem'))

export function LazyScene() {
  return (
    <>
      <Suspense fallback={null}>
        <HeavyModel />
      </Suspense>
      
      <Suspense fallback={null}>
        <ParticleSystem />
      </Suspense>
      
      <Loader />
    </>
  )
}
```

## Level of Detail (LOD)

### Basic LOD Implementation

```tsx
import { LOD } from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export function LODMesh() {
  const lodRef = useRef<LOD>()
  
  return (
    <lod ref={lodRef}>
      {/* High detail - visible 0-10 units */}
      <mesh visible position={[0, 0, 0]} distance={10}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="red" />
      </mesh>
      
      {/* Medium detail - visible 10-50 units */}
      <mesh visible position={[0, 0, 0]} distance={50}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      
      {/* Low detail - visible 50+ units */}
      <mesh visible position={[0, 0, 0]} distance={100}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
    </lod>
  )
}
```

### Advanced LOD with Drei

```tsx
import { Lod, useLOD } from '@react-three/drei'

export function AdvancedLODModel() {
  return (
    <Lod>
      <mesh distance={10}>
        <HighPolyGeometry />
        <DetailedMaterial />
      </mesh>
      
      <mesh distance={25}>
        <MediumPolyGeometry />
        <StandardMaterial />
      </mesh>
      
      <mesh distance={50}>
        <LowPolyGeometry />
        <SimpleMaterial />
      </mesh>
      
      <mesh distance={100}>
        <BillboardGeometry />
        <BillboardMaterial />
      </mesh>
    </Lod>
  )
}
```

## Instancing

### Basic Instanced Mesh

```tsx
import { useRef, useMemo } from 'react'
import { InstancedMesh, Object3D } from 'three'
import { useFrame } from '@react-three/fiber'

export function InstancedCubes({ count = 1000 }) {
  const meshRef = useRef<InstancedMesh>()
  const tempObject = useMemo(() => new Object3D(), [])
  
  // Initialize positions
  useMemo(() => {
    if (!meshRef.current) return
    
    for (let i = 0; i < count; i++) {
      tempObject.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      )
      tempObject.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
      tempObject.updateMatrix()
      meshRef.current.setMatrixAt(i, tempObject.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [count, tempObject])
  
  // Animate instances
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.elapsedTime
    
    for (let i = 0; i < count; i++) {
      meshRef.current.getMatrixAt(i, tempObject.matrix)
      tempObject.matrix.decompose(
        tempObject.position,
        tempObject.quaternion,
        tempObject.scale
      )
      
      tempObject.rotation.x = time * 0.5 + i * 0.01
      tempObject.rotation.y = time * 0.5 + i * 0.01
      
      tempObject.updateMatrix()
      meshRef.current.setMatrixAt(i, tempObject.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  
  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} frustumCulled>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshStandardMaterial color="hotpink" />
    </instancedMesh>
  )
}
```

### Optimized Instancing with Drei

```tsx
import { Instances, Instance } from '@react-three/drei'

export function OptimizedInstances({ data }) {
  return (
    <Instances
      limit={10000} // Maximum instances
      range={1000} // Draw range
    >
      <boxGeometry />
      <meshStandardMaterial />
      
      {data.map((props, i) => (
        <Instance
          key={i}
          position={props.position}
          rotation={props.rotation}
          scale={props.scale}
          color={props.color}
        />
      ))}
    </Instances>
  )
}
```

## Culling Techniques

### Frustum Culling

```tsx
// Frustum culling is enabled by default, but ensure it's on for large scenes
<mesh frustumCulled>
  <geometry />
  <material />
</mesh>
```

### Distance Culling

```tsx
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'

export function DistanceCulledMesh({ maxDistance = 50 }) {
  const meshRef = useRef()
  const [isVisible, setIsVisible] = useState(true)
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const distance = state.camera.position.distanceTo(meshRef.current.position)
    const shouldBeVisible = distance < maxDistance
    
    if (shouldBeVisible !== isVisible) {
      setIsVisible(shouldBeVisible)
      meshRef.current.visible = shouldBeVisible
    }
  })
  
  return (
    <mesh ref={meshRef} visible={isVisible}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial />
    </mesh>
  )
}
```

### Occlusion Culling

```tsx
import { useRef } from 'react'
import { Raycaster, Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'

export function OcclusionCulledMesh({ occluders = [] }) {
  const meshRef = useRef()
  const raycaster = useMemo(() => new Raycaster(), [])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    // Cast ray from camera to mesh
    const direction = new Vector3()
      .subVectors(meshRef.current.position, state.camera.position)
      .normalize()
    
    raycaster.set(state.camera.position, direction)
    const intersects = raycaster.intersectObjects(occluders)
    
    // Hide if occluded
    meshRef.current.visible = intersects.length === 0 || 
      intersects[0].distance > state.camera.position.distanceTo(meshRef.current.position)
  })
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
  )
}
```

## Texture Optimization

### Texture Compression & Sizing

```tsx
import { useTexture } from '@react-three/drei'
import { TextureLoader, LinearMipmapLinearFilter } from 'three'

export function OptimizedTexture({ url }) {
  const texture = useTexture(url, (texture) => {
    // Optimize texture settings
    texture.minFilter = LinearMipmapLinearFilter
    texture.generateMipmaps = true
    texture.anisotropy = 4 // Balance quality vs performance
    
    // Power of 2 dimensions for better GPU performance
    if (!isPowerOfTwo(texture.image.width) || !isPowerOfTwo(texture.image.height)) {
      console.warn(`Texture ${url} is not power of 2`)
    }
  })
  
  return texture
}

function isPowerOfTwo(n: number): boolean {
  return (n & (n - 1)) === 0
}
```

### Texture Atlas

```tsx
import { useTexture } from '@react-three/drei'

export function TextureAtlasMesh() {
  const atlas = useTexture('/textures/atlas.png')
  
  // Define UV coordinates for different parts of the atlas
  const uvMappings = {
    brick: [0, 0, 0.25, 0.25],
    wood: [0.25, 0, 0.5, 0.25],
    metal: [0.5, 0, 0.75, 0.25],
    concrete: [0.75, 0, 1, 0.25]
  }
  
  return (
    <mesh>
      <planeGeometry args={[1, 1]}>
        <bufferAttribute
          attach="attributes-uv"
          array={new Float32Array(uvMappings.brick)}
          count={4}
          itemSize={2}
        />
      </planeGeometry>
      <meshStandardMaterial map={atlas} />
    </mesh>
  )
}
```

### Dynamic Texture Loading

```tsx
import { Suspense, useState } from 'react'
import { useIntersect } from '@react-three/drei'

export function LazyTexture({ url, placeholder }) {
  const [isVisible, setIsVisible] = useState(false)
  const visibleRef = useIntersect(() => setIsVisible(true))
  
  return (
    <mesh ref={visibleRef}>
      <planeGeometry />
      <Suspense fallback={
        <meshBasicMaterial map={placeholder} />
      }>
        {isVisible ? (
          <TexturedMaterial url={url} />
        ) : (
          <meshBasicMaterial map={placeholder} />
        )}
      </Suspense>
    </mesh>
  )
}
```

## Animation Performance

### Optimized useFrame

```tsx
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

export function OptimizedAnimation() {
  const meshRef = useRef()
  const clock = useRef({ elapsed: 0, delta: 0 })
  
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    // Throttle updates to 30fps for non-critical animations
    clock.current.delta += delta
    if (clock.current.delta < 1/30) return
    
    clock.current.elapsed += clock.current.delta
    clock.current.delta = 0
    
    // Perform animation
    meshRef.current.rotation.y = Math.sin(clock.current.elapsed) * 0.5
  }, 1) // Lower priority
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
  )
}
```

### GPU-based Animation

```tsx
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'

const WaveShaderMaterial = shaderMaterial(
  { time: 0, amplitude: 1.0 },
  // Vertex shader
  `
    uniform float time;
    uniform float amplitude;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.z += sin(pos.x * 10.0 + time) * amplitude * 0.1;
      pos.z += cos(pos.y * 10.0 + time) * amplitude * 0.1;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment shader
  `
    varying vec2 vUv;
    
    void main() {
      gl_FragColor = vec4(vUv, 0.5, 1.0);
    }
  `
)

extend({ WaveShaderMaterial })

export function GPUAnimatedPlane() {
  const materialRef = useRef()
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh>
      <planeGeometry args={[10, 10, 100, 100]} />
      <waveShaderMaterial ref={materialRef} amplitude={0.5} />
    </mesh>
  )
}
```

## Mobile Optimization

### Mobile-Specific Settings

```tsx
import { Canvas } from '@react-three/fiber'
import { useDeviceDetection } from '@/hooks/useDeviceDetection'

export function MobileOptimizedScene({ children }) {
  const { isMobile, isTablet } = useDeviceDetection()
  const isMobileDevice = isMobile || isTablet
  
  return (
    <Canvas
      dpr={isMobileDevice ? [1, 1.5] : [1, 2]}
      shadows={!isMobileDevice}
      camera={{
        fov: isMobileDevice ? 50 : 45,
        near: 0.1,
        far: isMobileDevice ? 100 : 1000
      }}
      gl={{
        powerPreference: isMobileDevice ? 'default' : 'high-performance',
        antialias: !isMobileDevice,
        stencil: false,
        depth: true
      }}
    >
      {/* Reduce shadow map size on mobile */}
      {!isMobileDevice && (
        <directionalLight
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
      )}
      
      {isMobileDevice && (
        <directionalLight
          castShadow
          shadow-mapSize={[512, 512]}
        />
      )}
      
      {children}
    </Canvas>
  )
}
```

### Touch-Optimized Controls

```tsx
import { OrbitControls } from '@react-three/drei'
import { useDeviceDetection } from '@/hooks/useDeviceDetection'

export function MobileControls() {
  const { isMobile } = useDeviceDetection()
  
  return (
    <OrbitControls
      enablePan={!isMobile}
      enableZoom={true}
      enableRotate={true}
      // Touch-specific settings
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      }}
      // Reduced dampening for responsive feel
      enableDamping={true}
      dampingFactor={isMobile ? 0.05 : 0.1}
      rotateSpeed={isMobile ? 0.5 : 1}
      // Limit zoom range on mobile
      minDistance={isMobile ? 5 : 2}
      maxDistance={isMobile ? 20 : 50}
    />
  )
}
```

## Performance Monitoring

### Comprehensive Performance Monitor

```tsx
import { Perf } from 'r3f-perf'
import { Stats } from '@react-three/drei'
import { useEffect, useState } from 'react'

export function PerformanceMonitor({ 
  showInProduction = false,
  onPerformanceIssue
}) {
  const [metrics, setMetrics] = useState({
    fps: 60,
    gpu: 0,
    memory: 0,
    drawCalls: 0
  })
  
  useEffect(() => {
    if (metrics.fps < 30 || metrics.gpu > 16) {
      onPerformanceIssue?.(metrics)
    }
  }, [metrics, onPerformanceIssue])
  
  if (!showInProduction && process.env.NODE_ENV === 'production') {
    return null
  }
  
  return (
    <>
      <Perf
        position="top-left"
        minimal={false}
        customData={{
          value: metrics.drawCalls,
          name: 'Draw Calls',
          round: 0
        }}
        onUpdate={(data) => {
          setMetrics({
            fps: data.fps,
            gpu: data.gpu,
            memory: data.memory,
            drawCalls: data.drawCalls
          })
        }}
      />
      <Stats />
    </>
  )
}
```

### Performance Profiling

```tsx
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

export function ProfiledComponent({ name, children }) {
  const metricsRef = useRef({
    frameCount: 0,
    totalTime: 0,
    avgTime: 0
  })
  
  useFrame(() => {
    const start = performance.now()
    
    // Component logic here
    
    const end = performance.now()
    const frameTime = end - start
    
    metricsRef.current.frameCount++
    metricsRef.current.totalTime += frameTime
    metricsRef.current.avgTime = 
      metricsRef.current.totalTime / metricsRef.current.frameCount
    
    // Log slow frames
    if (frameTime > 16.67) {
      console.warn(`Slow frame in ${name}: ${frameTime.toFixed(2)}ms`)
    }
  })
  
  return children
}
```

## Performance Checklist

### Pre-Launch Checklist

- [ ] **Geometry**
  - [ ] All geometries are optimized (proper LODs)
  - [ ] Using instancing for repeated objects
  - [ ] Proper frustum culling enabled
  - [ ] Vertex count within budget

- [ ] **Materials**
  - [ ] Reusing materials where possible
  - [ ] Simple shaders for mobile
  - [ ] Proper material pooling

- [ ] **Textures**
  - [ ] All textures are power of 2
  - [ ] Using appropriate compression
  - [ ] Texture atlases for small textures
  - [ ] Mipmaps enabled

- [ ] **Lighting**
  - [ ] Limited number of lights
  - [ ] Shadows only where necessary
  - [ ] Baked lighting for static scenes

- [ ] **Animation**
  - [ ] GPU-based animations where possible
  - [ ] Throttled update loops
  - [ ] Conditional animations based on visibility

- [ ] **Mobile**
  - [ ] Reduced quality settings
  - [ ] Touch-optimized controls
  - [ ] Battery-conscious features

### Performance Tips Summary

1. **Always profile before optimizing** - Use tools to identify bottlenecks
2. **Batch similar operations** - Reduce draw calls through instancing
3. **Simplify on mobile** - Lower quality settings for better performance
4. **Use LOD aggressively** - Multiple quality levels for different distances
5. **Optimize textures** - Compress and use power of 2 dimensions
6. **Limit post-processing** - Use sparingly, especially on mobile
7. **Pool objects** - Reuse geometries, materials, and textures
8. **Defer non-critical updates** - Use frame budgeting
9. **Monitor continuously** - Track performance metrics in production
10. **Test on real devices** - Emulators don't show true performance