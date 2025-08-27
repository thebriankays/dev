# React Three Fiber Best Practices

## Overview

This guide consolidates best practices for building performant, maintainable, and scalable React Three Fiber applications. Follow these guidelines to create professional-grade 3D experiences.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Component Architecture](#component-architecture)
3. [Performance Best Practices](#performance-best-practices)
4. [State Management](#state-management)
5. [Asset Management](#asset-management)
6. [Testing & Debugging](#testing--debugging)
7. [Mobile & Cross-Platform](#mobile--cross-platform)
8. [Production Checklist](#production-checklist)

## Project Structure

### Recommended Directory Structure

```
src/
├── components/
│   ├── canvas/           # R3F canvas components
│   │   ├── Scene.tsx
│   │   ├── Lights.tsx
│   │   └── Camera.tsx
│   ├── meshes/          # 3D mesh components
│   │   ├── Hero.tsx
│   │   ├── Background.tsx
│   │   └── Interactive.tsx
│   ├── materials/       # Custom materials
│   │   ├── GlassMaterial.tsx
│   │   └── HologramMaterial.tsx
│   └── effects/         # Post-processing effects
│       ├── Bloom.tsx
│       └── DepthOfField.tsx
├── hooks/               # Custom R3F hooks
│   ├── useAnimation.ts
│   ├── useTexture.ts
│   └── usePerformance.ts
├── utils/               # Utility functions
│   ├── three-helpers.ts
│   └── math.ts
├── shaders/            # GLSL shaders
│   ├── vertex/
│   └── fragment/
├── assets/             # 3D models, textures
│   ├── models/
│   ├── textures/
│   └── hdri/
└── constants/          # Configuration
    ├── materials.ts
    └── performance.ts
```

### Component Organization

```tsx
// components/canvas/Scene.tsx
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { PerformanceMonitor } from '@/hooks/usePerformance'
import { Lights } from './Lights'
import { Camera } from './Camera'
import { MainContent } from '@/components/meshes/MainContent'

export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.5
      }}
    >
      <PerformanceMonitor>
        <Suspense fallback={null}>
          <Lights />
          <Camera />
          <MainContent />
        </Suspense>
      </PerformanceMonitor>
    </Canvas>
  )
}
```

## Component Architecture

### 1. Separation of Concerns

```tsx
// ❌ Bad: Everything in one component
export function BadScene() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="red" />
      </mesh>
      <OrbitControls />
    </Canvas>
  )
}

// ✅ Good: Separated concerns
export function GoodScene() {
  return (
    <Canvas>
      <SceneLights />
      <SceneContent />
      <SceneControls />
    </Canvas>
  )
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} castShadow />
    </>
  )
}

function SceneContent() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <InteractiveMesh />
    </Suspense>
  )
}

function SceneControls() {
  const { isMobile } = useDeviceDetection()
  return <OrbitControls enablePan={!isMobile} />
}
```

### 2. Reusable Components

```tsx
// components/meshes/Box.tsx
interface BoxProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  color?: string
  onClick?: () => void
}

export const Box = memo(function Box({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  color = 'orange',
  onClick
}: BoxProps) {
  const meshRef = useRef<THREE.Mesh>()
  const [hovered, setHovered] = useState(false)
  const [active, setActive] = useState(false)
  
  useFrame((state, delta) => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.x += delta * 0.5
      meshRef.current.rotation.y += delta * 0.5
    }
  })
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={active ? scale * 1.2 : scale}
      onClick={(e) => {
        e.stopPropagation()
        setActive(!active)
        onClick?.()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={hovered ? 'hotpink' : color} 
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  )
})
```

### 3. Custom Hooks

```tsx
// hooks/useAnimation.ts
export function useAnimation(ref: RefObject<THREE.Object3D>, options = {}) {
  const {
    rotationSpeed = 1,
    floatSpeed = 1,
    floatIntensity = 0.5,
    enabled = true
  } = options
  
  useFrame((state, delta) => {
    if (!ref.current || !enabled) return
    
    const time = state.clock.elapsedTime
    
    // Rotation
    ref.current.rotation.y += delta * rotationSpeed
    
    // Float animation
    ref.current.position.y = 
      Math.sin(time * floatSpeed) * floatIntensity
  })
}

// Usage
export function AnimatedBox() {
  const meshRef = useRef()
  useAnimation(meshRef, { 
    rotationSpeed: 0.5,
    floatIntensity: 0.3 
  })
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshNormalMaterial />
    </mesh>
  )
}
```

## Performance Best Practices

### 1. Memoization & Optimization

```tsx
// utils/three-helpers.ts
export const createOptimizedGeometry = memoize((type: string, args: any[]) => {
  let geometry: THREE.BufferGeometry
  
  switch (type) {
    case 'box':
      geometry = new THREE.BoxGeometry(...args)
      break
    case 'sphere':
      geometry = new THREE.SphereGeometry(...args)
      break
    default:
      geometry = new THREE.BoxGeometry()
  }
  
  // Optimize geometry
  geometry.computeBoundingSphere()
  return geometry
})

// Component using optimized geometry
export const OptimizedMesh = memo(function OptimizedMesh({ 
  geometryType = 'box',
  geometryArgs = [1, 1, 1]
}) {
  const geometry = useMemo(
    () => createOptimizedGeometry(geometryType, geometryArgs),
    [geometryType, geometryArgs]
  )
  
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial />
    </mesh>
  )
})
```

### 2. Conditional Rendering

```tsx
// components/meshes/QualityAdaptive.tsx
export function QualityAdaptiveMesh() {
  const { quality } = usePerformance()
  
  return (
    <>
      {quality === 'high' && <HighQualityMesh />}
      {quality === 'medium' && <MediumQualityMesh />}
      {quality === 'low' && <LowQualityMesh />}
    </>
  )
}

function HighQualityMesh() {
  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhysicalMaterial
        metalness={0.9}
        roughness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </mesh>
  )
}

function MediumQualityMesh() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial metalness={0.8} roughness={0.2} />
    </mesh>
  )
}

function LowQualityMesh() {
  return (
    <mesh>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="silver" />
    </mesh>
  )
}
```

### 3. Resource Management

```tsx
// hooks/useResource.ts
export function useResource<T extends THREE.Material | THREE.Texture>(
  factory: () => T,
  deps: DependencyList = []
): T {
  const resource = useMemo(factory, deps)
  
  useEffect(() => {
    return () => {
      if ('dispose' in resource) {
        resource.dispose()
      }
    }
  }, [resource])
  
  return resource
}

// Usage
export function ResourceManagedMesh() {
  const material = useResource(() => 
    new THREE.MeshStandardMaterial({
      color: 'hotpink',
      metalness: 0.8,
      roughness: 0.2
    })
  )
  
  const texture = useResource(() => {
    const tex = new THREE.TextureLoader().load('/texture.jpg')
    tex.encoding = THREE.sRGBEncoding
    return tex
  })
  
  useEffect(() => {
    material.map = texture
    material.needsUpdate = true
  }, [material, texture])
  
  return (
    <mesh material={material}>
      <sphereGeometry />
    </mesh>
  )
}
```

## State Management

### 1. Global State Pattern

```tsx
// store/three-store.ts
import create from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface ThreeStore {
  // State
  quality: 'low' | 'medium' | 'high'
  shadows: boolean
  postProcessing: boolean
  currentCamera: 'perspective' | 'orthographic'
  
  // Actions
  setQuality: (quality: ThreeStore['quality']) => void
  toggleShadows: () => void
  togglePostProcessing: () => void
  setCamera: (camera: ThreeStore['currentCamera']) => void
  
  // Computed
  isHighPerformance: () => boolean
}

export const useThreeStore = create<ThreeStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    quality: 'medium',
    shadows: true,
    postProcessing: true,
    currentCamera: 'perspective',
    
    // Actions
    setQuality: (quality) => set({ quality }),
    toggleShadows: () => set((state) => ({ shadows: !state.shadows })),
    togglePostProcessing: () => set((state) => ({ 
      postProcessing: !state.postProcessing 
    })),
    setCamera: (camera) => set({ currentCamera: camera }),
    
    // Computed
    isHighPerformance: () => {
      const state = get()
      return state.quality === 'high' && state.shadows && state.postProcessing
    }
  }))
)

// Subscribe to specific changes
useThreeStore.subscribe(
  (state) => state.quality,
  (quality) => {
    console.log('Quality changed to:', quality)
  }
)
```

### 2. Local State Management

```tsx
// components/InteractiveGroup.tsx
interface InteractionState {
  selected: string | null
  hovered: string | null
  dragStart: THREE.Vector3 | null
}

export function InteractiveGroup({ children }) {
  const [interaction, setInteraction] = useState<InteractionState>({
    selected: null,
    hovered: null,
    dragStart: null
  })
  
  const handleInteraction = useCallback((
    type: keyof InteractionState,
    value: any
  ) => {
    setInteraction(prev => ({ ...prev, [type]: value }))
  }, [])
  
  return (
    <group>
      {React.Children.map(children, child =>
        React.cloneElement(child, {
          isSelected: interaction.selected === child.props.id,
          isHovered: interaction.hovered === child.props.id,
          onSelect: () => handleInteraction('selected', child.props.id),
          onHover: (hovered: boolean) => 
            handleInteraction('hovered', hovered ? child.props.id : null)
        })
      )}
    </group>
  )
}
```

## Asset Management

### 1. Lazy Loading

```tsx
// components/LazyModel.tsx
const Model = lazy(() => import('./Model'))

export function LazyModel() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Model />
    </Suspense>
  )
}

function LoadingPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color="gray" wireframe />
    </mesh>
  )
}
```

### 2. Asset Preloading

```tsx
// utils/preloader.ts
import { useGLTF, useTexture } from '@react-three/drei'

// Preload assets
export function preloadAssets() {
  // Preload models
  useGLTF.preload('/models/character.glb')
  useGLTF.preload('/models/environment.glb')
  
  // Preload textures
  useTexture.preload('/textures/diffuse.jpg')
  useTexture.preload('/textures/normal.jpg')
  useTexture.preload('/textures/roughness.jpg')
}

// Call in app initialization
preloadAssets()
```

### 3. Texture Management

```tsx
// hooks/useOptimizedTexture.ts
export function useOptimizedTexture(
  url: string,
  options: {
    compression?: boolean
    generateMipmaps?: boolean
    anisotropy?: number
  } = {}
) {
  const {
    compression = true,
    generateMipmaps = true,
    anisotropy = 4
  } = options
  
  const texture = useTexture(url)
  
  useLayoutEffect(() => {
    if (texture) {
      // Optimize texture settings
      texture.generateMipmaps = generateMipmaps
      texture.minFilter = generateMipmaps 
        ? THREE.LinearMipmapLinearFilter 
        : THREE.LinearFilter
      texture.anisotropy = Math.min(anisotropy, 
        renderer.capabilities.getMaxAnisotropy())
      
      // Apply compression if supported
      if (compression && renderer.capabilities.isWebGL2) {
        texture.format = THREE.RGBAFormat
        texture.type = THREE.UnsignedByteType
      }
      
      texture.needsUpdate = true
    }
  }, [texture, generateMipmaps, anisotropy, compression])
  
  return texture
}
```

## Testing & Debugging

### 1. Debug Components

```tsx
// components/debug/DebugOverlay.tsx
export function DebugOverlay({ children }) {
  const [showStats, setShowStats] = useState(false)
  const [showHelpers, setShowHelpers] = useState(false)
  const [showWireframe, setShowWireframe] = useState(false)
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' && e.ctrlKey) {
        setShowStats(prev => !prev)
      }
      if (e.key === 'h' && e.ctrlKey) {
        setShowHelpers(prev => !prev)
      }
      if (e.key === 'w' && e.ctrlKey) {
        setShowWireframe(prev => !prev)
      }
    }
    
    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [])
  
  return (
    <>
      {showStats && <Stats />}
      {showHelpers && <Helpers />}
      <WireframeMode enabled={showWireframe}>
        {children}
      </WireframeMode>
    </>
  )
}
```

### 2. Performance Profiling

```tsx
// hooks/useProfiler.ts
export function useProfiler(name: string) {
  const frameTimeRef = useRef<number[]>([])
  const renderCountRef = useRef(0)
  
  useEffect(() => {
    renderCountRef.current++
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${name}] Render #${renderCountRef.current}`)
    }
  })
  
  useFrame(() => {
    const start = performance.now()
    
    return () => {
      const frameTime = performance.now() - start
      frameTimeRef.current.push(frameTime)
      
      // Log average every 60 frames
      if (frameTimeRef.current.length >= 60) {
        const avg = frameTimeRef.current.reduce((a, b) => a + b) / 60
        
        if (avg > 16.67) {
          console.warn(`[${name}] Slow frame avg: ${avg.toFixed(2)}ms`)
        }
        
        frameTimeRef.current = []
      }
    }
  })
}
```

### 3. Error Boundaries

```tsx
// components/ErrorBoundary.tsx
export class R3FErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('R3F Error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshBasicMaterial color="red" wireframe />
          <Html center>
            <div style={{ color: 'white', background: 'red', padding: '10px' }}>
              Error: {this.state.error?.message}
            </div>
          </Html>
        </mesh>
      )
    }
    
    return this.props.children
  }
}
```

## Mobile & Cross-Platform

### 1. Responsive Canvas

```tsx
// components/ResponsiveCanvas.tsx
export function ResponsiveCanvas({ children }) {
  const { isMobile, isTablet } = useDeviceDetection()
  const [dpr, setDpr] = useState([1, 2])
  
  useEffect(() => {
    if (isMobile) {
      setDpr([1, 1.5])
    } else if (isTablet) {
      setDpr([1, 2])
    } else {
      setDpr([1, window.devicePixelRatio])
    }
  }, [isMobile, isTablet])
  
  return (
    <Canvas
      dpr={dpr}
      shadows={!isMobile}
      gl={{
        antialias: !isMobile,
        powerPreference: isMobile ? 'default' : 'high-performance',
        stencil: false
      }}
      style={{
        touchAction: 'none' // Prevent scrolling on touch devices
      }}
    >
      <AdaptivePerformance>
        {children}
      </AdaptivePerformance>
    </Canvas>
  )
}
```

### 2. Touch Controls

```tsx
// components/TouchControls.tsx
export function TouchControls() {
  const { camera } = useThree()
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        }
      }
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && touchStartRef.current) {
        const deltaX = e.touches[0].clientX - touchStartRef.current.x
        const deltaY = e.touches[0].clientY - touchStartRef.current.y
        
        // Rotate camera based on touch movement
        camera.rotation.y += deltaX * 0.01
        camera.rotation.x += deltaY * 0.01
        
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        }
      }
    }
    
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [camera])
  
  return null
}
```

## Production Checklist

### Pre-Deployment Checklist

```tsx
// utils/production-checks.ts
export function runProductionChecks() {
  const checks = {
    performance: checkPerformance(),
    memory: checkMemoryUsage(),
    textures: checkTextureOptimization(),
    shaders: checkShaderComplexity(),
    geometry: checkGeometryComplexity()
  }
  
  return checks
}

function checkPerformance() {
  // Check average FPS
  // Check frame time
  // Check draw calls
  return { passed: true, details: {} }
}

function checkMemoryUsage() {
  // Check texture memory
  // Check geometry memory
  // Check total memory usage
  return { passed: true, details: {} }
}

// ... other check functions
```

### Production Configuration

```tsx
// config/production.ts
export const PRODUCTION_CONFIG = {
  canvas: {
    dpr: [1, Math.min(window.devicePixelRatio, 2)],
    shadows: true,
    shadowMap: {
      enabled: true,
      type: THREE.PCFSoftShadowMap
    },
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.5
  },
  
  performance: {
    maxDrawCalls: 200,
    maxTriangles: 2_000_000,
    maxTextureSize: 2048,
    targetFPS: 60
  },
  
  quality: {
    mobile: {
      shadows: false,
      postProcessing: false,
      antialias: false,
      maxLights: 3
    },
    desktop: {
      shadows: true,
      postProcessing: true,
      antialias: true,
      maxLights: 8
    }
  }
}
```

### Monitoring & Analytics

```tsx
// hooks/useAnalytics.ts
export function usePerformanceAnalytics() {
  const metricsRef = useRef({
    fps: [],
    frameTime: [],
    drawCalls: [],
    triangles: []
  })
  
  useFrame((state, delta) => {
    // Collect metrics
    metricsRef.current.fps.push(1 / delta)
    metricsRef.current.frameTime.push(delta * 1000)
    
    // Send to analytics every 5 seconds
    if (state.clock.elapsedTime % 5 < delta) {
      sendAnalytics({
        avgFPS: average(metricsRef.current.fps),
        avgFrameTime: average(metricsRef.current.frameTime),
        // ... other metrics
      })
      
      // Reset metrics
      metricsRef.current = {
        fps: [],
        frameTime: [],
        drawCalls: [],
        triangles: []
      }
    }
  })
}
```

## Summary of Best Practices

### Do's ✅

1. **Structure**: Organize components by function
2. **Performance**: Profile and optimize continuously
3. **Memory**: Dispose resources properly
4. **State**: Use appropriate state management
5. **Loading**: Implement proper loading states
6. **Errors**: Handle errors gracefully
7. **Mobile**: Optimize for mobile devices
8. **Testing**: Test on real devices
9. **Documentation**: Document complex components
10. **Monitoring**: Track performance in production

### Don'ts ❌

1. **Don't** create objects in render loops
2. **Don't** forget to dispose resources
3. **Don't** use setState for animations
4. **Don't** ignore mobile limitations
5. **Don't** load full resolution always
6. **Don't** skip performance profiling
7. **Don't** use complex shaders everywhere
8. **Don't** raycast everything
9. **Don't** forget error boundaries
10. **Don't** deploy without testing

### Performance Targets

- **Desktop**: 60 FPS, <16ms frame time
- **Mobile**: 30 FPS, <33ms frame time
- **Draw Calls**: <200 (mobile), <500 (desktop)
- **Triangles**: <1M (mobile), <5M (desktop)
- **Texture Memory**: <128MB (mobile), <512MB (desktop)

### Tools & Resources

- [R3F DevTools](https://github.com/pmndrs/react-three-fiber/devtools)
- [Spector.js](https://spector.babylonjs.com/) - WebGL inspector
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
- [Three.js Editor](https://threejs.org/editor/) - Scene debugging

Remember: **Measure, don't guess!** Always profile before optimizing.