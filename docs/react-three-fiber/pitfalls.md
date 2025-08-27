# React Three Fiber Common Pitfalls & Solutions

## Overview

This guide covers common performance pitfalls in React Three Fiber and how to avoid them. Learn from these mistakes to build performant 3D applications from the start.

## Table of Contents

1. [React-Specific Pitfalls](#react-specific-pitfalls)
2. [Memory Leaks](#memory-leaks)
3. [Render Loop Issues](#render-loop-issues)
4. [State Management Pitfalls](#state-management-pitfalls)
5. [Event Handling Problems](#event-handling-problems)
6. [Texture & Asset Issues](#texture--asset-issues)
7. [Animation Pitfalls](#animation-pitfalls)
8. [Mobile-Specific Issues](#mobile-specific-issues)
9. [Debugging Techniques](#debugging-techniques)

## React-Specific Pitfalls

### 1. Creating Objects in Render

❌ **Bad: Creating new objects every render**
```tsx
export function BadMesh() {
  return (
    <mesh 
      // Creates new array every render!
      position={[0, 0, 0]} 
      // Creates new object every render!
      rotation={{ x: 0, y: 0, z: 0 }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="red" />
    </mesh>
  )
}
```

✅ **Good: Use constants or memoization**
```tsx
const POSITION = [0, 0, 0] as const
const ROTATION = [0, 0, 0] as const

export function GoodMesh() {
  // Or use useMemo for dynamic values
  const position = useMemo(() => [x, y, z], [x, y, z])
  
  return (
    <mesh position={POSITION} rotation={ROTATION}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="red" />
    </mesh>
  )
}
```

### 2. Inline Functions in useFrame

❌ **Bad: Recreating functions every frame**
```tsx
export function BadAnimation() {
  const meshRef = useRef()
  
  useFrame(() => {
    // Creating new function every frame!
    const updateRotation = () => {
      meshRef.current.rotation.x += 0.01
    }
    updateRotation()
  })
  
  return <mesh ref={meshRef}>...</mesh>
}
```

✅ **Good: Define functions outside or memoize**
```tsx
export function GoodAnimation() {
  const meshRef = useRef()
  
  const updateRotation = useCallback((mesh, delta) => {
    mesh.rotation.x += delta
  }, [])
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      updateRotation(meshRef.current, delta)
    }
  })
  
  return <mesh ref={meshRef}>...</mesh>
}
```

### 3. Unnecessary Re-renders

❌ **Bad: Component re-renders on every frame**
```tsx
export function BadParent() {
  const [rotation, setRotation] = useState(0)
  
  useFrame(() => {
    // This causes the entire component tree to re-render!
    setRotation(r => r + 0.01)
  })
  
  return (
    <group rotation-y={rotation}>
      <ExpensiveChild />
      <AnotherExpensiveChild />
    </group>
  )
}
```

✅ **Good: Use refs for animation state**
```tsx
export function GoodParent() {
  const groupRef = useRef()
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta
    }
  })
  
  return (
    <group ref={groupRef}>
      <ExpensiveChild />
      <AnotherExpensiveChild />
    </group>
  )
}
```

### 4. Component Mounting/Unmounting

❌ **Bad: Conditional rendering causing remounts**
```tsx
export function BadConditional({ show }) {
  return (
    <>
      {show && (
        // This unmounts and remounts the mesh!
        <mesh>
          <expensiveGeometry />
          <expensiveMaterial />
        </mesh>
      )}
    </>
  )
}
```

✅ **Good: Use visibility instead**
```tsx
export function GoodConditional({ show }) {
  return (
    <mesh visible={show}>
      <expensiveGeometry />
      <expensiveMaterial />
    </mesh>
  )
}
```

## Memory Leaks

### 1. Not Disposing Resources

❌ **Bad: Not cleaning up geometries and materials**
```tsx
export function LeakyComponent() {
  const [geometry] = useState(() => new THREE.BoxGeometry(1, 1, 1))
  const [material] = useState(() => new THREE.MeshBasicMaterial())
  
  // No cleanup!
  return <mesh geometry={geometry} material={material} />
}
```

✅ **Good: Proper disposal**
```tsx
export function CleanComponent() {
  const [geometry] = useState(() => new THREE.BoxGeometry(1, 1, 1))
  const [material] = useState(() => new THREE.MeshBasicMaterial())
  
  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])
  
  return <mesh geometry={geometry} material={material} />
}
```

### 2. Texture Memory Leaks

❌ **Bad: Loading textures without disposal**
```tsx
export function LeakyTexture({ url }) {
  const [texture, setTexture] = useState(null)
  
  useEffect(() => {
    new THREE.TextureLoader().load(url, setTexture)
    // No cleanup!
  }, [url])
  
  return <meshBasicMaterial map={texture} />
}
```

✅ **Good: Use useTexture or dispose manually**
```tsx
import { useTexture } from '@react-three/drei'

export function CleanTexture({ url }) {
  // Drei's useTexture handles disposal automatically
  const texture = useTexture(url)
  
  return <meshBasicMaterial map={texture} />
}

// Or manual disposal
export function ManualCleanTexture({ url }) {
  const [texture, setTexture] = useState(null)
  
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(url, setTexture)
    
    return () => {
      texture?.dispose()
    }
  }, [url])
  
  return <meshBasicMaterial map={texture} />
}
```

### 3. Event Listener Leaks

❌ **Bad: Not removing event listeners**
```tsx
export function LeakyEvents() {
  const meshRef = useRef()
  
  useEffect(() => {
    const handleClick = () => console.log('clicked')
    
    if (meshRef.current) {
      meshRef.current.addEventListener('click', handleClick)
      // No cleanup!
    }
  }, [])
  
  return <mesh ref={meshRef} />
}
```

✅ **Good: Clean up event listeners**
```tsx
export function CleanEvents() {
  const meshRef = useRef()
  
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    
    const handleClick = () => console.log('clicked')
    mesh.addEventListener('click', handleClick)
    
    return () => {
      mesh.removeEventListener('click', handleClick)
    }
  }, [])
  
  return <mesh ref={meshRef} />
}
```

## Render Loop Issues

### 1. Heavy Calculations in useFrame

❌ **Bad: Complex calculations every frame**
```tsx
export function BadCalculations() {
  const meshRef = useRef()
  const [particles] = useState(() => generateParticles(10000))
  
  useFrame(() => {
    if (!meshRef.current) return
    
    // Heavy calculation every frame!
    const complexResult = particles.reduce((acc, particle) => {
      return acc + Math.sin(particle.x) * Math.cos(particle.y)
    }, 0)
    
    meshRef.current.rotation.y = complexResult
  })
  
  return <mesh ref={meshRef} />
}
```

✅ **Good: Optimize or throttle calculations**
```tsx
export function GoodCalculations() {
  const meshRef = useRef()
  const [particles] = useState(() => generateParticles(10000))
  const frameCount = useRef(0)
  const cachedResult = useRef(0)
  
  useFrame(() => {
    if (!meshRef.current) return
    
    // Throttle heavy calculations
    frameCount.current++
    if (frameCount.current % 30 === 0) {
      cachedResult.current = particles.reduce((acc, particle) => {
        return acc + Math.sin(particle.x) * Math.cos(particle.y)
      }, 0)
    }
    
    meshRef.current.rotation.y = cachedResult.current
  })
  
  return <mesh ref={meshRef} />
}
```

### 2. Synchronous Operations

❌ **Bad: Blocking operations in render loop**
```tsx
export function BadSync() {
  const meshRef = useRef()
  
  useFrame(() => {
    // Blocking operation!
    const data = fetchSyncData() // Synchronous API call
    meshRef.current.position.x = data.x
  })
  
  return <mesh ref={meshRef} />
}
```

✅ **Good: Use async patterns**
```tsx
export function GoodAsync() {
  const meshRef = useRef()
  const [targetX, setTargetX] = useState(0)
  
  // Fetch data outside render loop
  useEffect(() => {
    fetchAsyncData().then(data => setTargetX(data.x))
  }, [])
  
  useFrame(() => {
    if (meshRef.current) {
      // Smooth interpolation to target
      meshRef.current.position.x = THREE.MathUtils.lerp(
        meshRef.current.position.x,
        targetX,
        0.1
      )
    }
  })
  
  return <mesh ref={meshRef} />
}
```

### 3. useFrame Priority Issues

❌ **Bad: All animations at same priority**
```tsx
export function BadPriority() {
  // All these run at the same priority
  useFrame(() => updatePhysics())
  useFrame(() => updateParticles())
  useFrame(() => updateUI())
  useFrame(() => updateBackground())
}
```

✅ **Good: Use priority system**
```tsx
export function GoodPriority() {
  // Critical updates first
  useFrame(() => updatePhysics(), -1)
  
  // Normal updates
  useFrame(() => updateParticles(), 0)
  
  // Low priority updates
  useFrame(() => updateUI(), 1)
  useFrame(() => updateBackground(), 2)
}
```

## State Management Pitfalls

### 1. Shared Mutable State

❌ **Bad: Mutating shared objects**
```tsx
const sharedPosition = new THREE.Vector3()

export function BadSharedState() {
  useFrame(() => {
    // Multiple components mutating same object!
    sharedPosition.x += 0.01
  })
  
  return <mesh position={sharedPosition} />
}
```

✅ **Good: Use immutable updates or separate instances**
```tsx
export function GoodSharedState() {
  const position = useMemo(() => new THREE.Vector3(), [])
  
  useFrame(() => {
    position.x += 0.01
  })
  
  return <mesh position={position} />
}
```

### 2. Global State Updates

❌ **Bad: Updating global state in render loop**
```tsx
import { useStore } from './store'

export function BadGlobalUpdate() {
  const setScore = useStore(state => state.setScore)
  
  useFrame(() => {
    // Updates global state every frame!
    setScore(score => score + 1)
  })
  
  return <mesh />
}
```

✅ **Good: Batch or throttle updates**
```tsx
export function GoodGlobalUpdate() {
  const setScore = useStore(state => state.setScore)
  const scoreRef = useRef(0)
  const lastUpdate = useRef(0)
  
  useFrame((state) => {
    scoreRef.current += 1
    
    // Update global state only once per second
    if (state.clock.elapsedTime - lastUpdate.current > 1) {
      setScore(scoreRef.current)
      lastUpdate.current = state.clock.elapsedTime
    }
  })
  
  return <mesh />
}
```

## Event Handling Problems

### 1. Event Propagation

❌ **Bad: Not stopping propagation**
```tsx
export function BadEventBubbling() {
  return (
    <group onClick={() => console.log('group clicked')}>
      <mesh onClick={() => console.log('mesh clicked')}>
        {/* Both handlers fire! */}
      </mesh>
    </group>
  )
}
```

✅ **Good: Control event propagation**
```tsx
export function GoodEventBubbling() {
  return (
    <group onClick={() => console.log('group clicked')}>
      <mesh 
        onClick={(e) => {
          e.stopPropagation()
          console.log('mesh clicked')
        }}
      >
        {/* Only mesh handler fires */}
      </mesh>
    </group>
  )
}
```

### 2. Pointer Events Performance

❌ **Bad: Raycasting everything**
```tsx
export function BadRaycasting() {
  return (
    <Canvas>
      {/* All 1000 meshes are raycast tested! */}
      {Array.from({ length: 1000 }).map((_, i) => (
        <mesh key={i} onClick={() => console.log(i)}>
          <sphereGeometry />
        </mesh>
      ))}
    </Canvas>
  )
}
```

✅ **Good: Optimize raycasting**
```tsx
export function GoodRaycasting() {
  return (
    <Canvas raycaster={{ filter: (items, state) => {
      // Only test visible items
      return items.filter(item => item.object.visible)
    }}}>
      <Bvh>
        {/* Use BVH for faster raycasting */}
        {Array.from({ length: 1000 }).map((_, i) => (
          <mesh 
            key={i} 
            onClick={() => console.log(i)}
            raycast={useConditionalRaycast(i)}
          >
            <sphereGeometry />
          </mesh>
        ))}
      </Bvh>
    </Canvas>
  )
}
```

## Texture & Asset Issues

### 1. Loading Large Textures

❌ **Bad: Loading full resolution always**
```tsx
export function BadTextureLoading() {
  // Always loads 4K texture!
  const texture = useTexture('/textures/4k-texture.jpg')
  
  return <meshBasicMaterial map={texture} />
}
```

✅ **Good: Load appropriate resolution**
```tsx
export function GoodTextureLoading() {
  const { isMobile } = useDeviceDetection()
  
  // Load different resolutions based on device
  const textureUrl = isMobile 
    ? '/textures/1k-texture.jpg' 
    : '/textures/4k-texture.jpg'
  
  const texture = useTexture(textureUrl)
  
  return <meshBasicMaterial map={texture} />
}
```

### 2. Not Using Suspense

❌ **Bad: No loading state**
```tsx
export function BadLoading() {
  const gltf = useGLTF('/model.glb')
  
  // Might error or show nothing while loading
  return <primitive object={gltf.scene} />
}
```

✅ **Good: Proper loading states**
```tsx
export function GoodLoading() {
  return (
    <Suspense fallback={<LoadingMesh />}>
      <AsyncModel />
    </Suspense>
  )
}

function AsyncModel() {
  const gltf = useGLTF('/model.glb')
  return <primitive object={gltf.scene} />
}

function LoadingMesh() {
  return (
    <mesh>
      <boxGeometry />
      <meshBasicMaterial color="gray" wireframe />
    </mesh>
  )
}
```

## Animation Pitfalls

### 1. Animating with setState

❌ **Bad: Using React state for animations**
```tsx
export function BadStateAnimation() {
  const [rotation, setRotation] = useState(0)
  
  useFrame(() => {
    // Causes re-render every frame!
    setRotation(r => r + 0.01)
  })
  
  return <mesh rotation-y={rotation} />
}
```

✅ **Good: Use refs for animations**
```tsx
export function GoodRefAnimation() {
  const meshRef = useRef()
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta
    }
  })
  
  return <mesh ref={meshRef} />
}
```

### 2. Not Using Delta Time

❌ **Bad: Frame-dependent animation**
```tsx
export function BadFrameDependent() {
  const meshRef = useRef()
  
  useFrame(() => {
    // Speed depends on frame rate!
    meshRef.current.rotation.y += 0.01
  })
  
  return <mesh ref={meshRef} />
}
```

✅ **Good: Use delta time**
```tsx
export function GoodDeltaTime() {
  const meshRef = useRef()
  
  useFrame((state, delta) => {
    // Consistent speed regardless of frame rate
    meshRef.current.rotation.y += delta * 0.5 // 0.5 radians per second
  })
  
  return <mesh ref={meshRef} />
}
```

## Mobile-Specific Issues

### 1. High DPR on Mobile

❌ **Bad: Using device pixel ratio blindly**
```tsx
export function BadMobileDPR() {
  return (
    // Can be 3+ on modern phones!
    <Canvas dpr={window.devicePixelRatio}>
      <Scene />
    </Canvas>
  )
}
```

✅ **Good: Cap DPR on mobile**
```tsx
export function GoodMobileDPR() {
  const { isMobile } = useDeviceDetection()
  
  return (
    <Canvas dpr={isMobile ? [1, 1.5] : [1, 2]}>
      <Scene />
    </Canvas>
  )
}
```

### 2. Complex Shaders on Mobile

❌ **Bad: Same shaders for all devices**
```tsx
const complexShader = {
  vertexShader: complexVertexShader,
  fragmentShader: complexFragmentShader // Lots of calculations
}

export function BadMobileShader() {
  return (
    <mesh>
      <planeGeometry />
      <shaderMaterial {...complexShader} />
    </mesh>
  )
}
```

✅ **Good: Adaptive shader complexity**
```tsx
export function GoodMobileShader() {
  const { isMobile } = useDeviceDetection()
  
  const shader = isMobile ? simpleShader : complexShader
  
  return (
    <mesh>
      <planeGeometry />
      <shaderMaterial {...shader} />
    </mesh>
  )
}
```

## Debugging Techniques

### 1. Performance Profiling

```tsx
export function DebugWrapper({ children, name }) {
  const renderCount = useRef(0)
  const renderTime = useRef([])
  
  useEffect(() => {
    renderCount.current++
    console.log(`${name} render count:`, renderCount.current)
  })
  
  useFrame(() => {
    const start = performance.now()
    
    // Your logic here
    
    const end = performance.now()
    renderTime.current.push(end - start)
    
    // Log average every 60 frames
    if (renderTime.current.length >= 60) {
      const avg = renderTime.current.reduce((a, b) => a + b) / 60
      console.log(`${name} avg frame time:`, avg.toFixed(2), 'ms')
      renderTime.current = []
    }
  })
  
  return children
}
```

### 2. Memory Monitoring

```tsx
export function MemoryMonitor() {
  useEffect(() => {
    const checkMemory = () => {
      if (performance.memory) {
        const used = performance.memory.usedJSHeapSize / 1048576
        const total = performance.memory.totalJSHeapSize / 1048576
        console.log(`Memory: ${used.toFixed(2)}MB / ${total.toFixed(2)}MB`)
      }
    }
    
    const interval = setInterval(checkMemory, 5000)
    return () => clearInterval(interval)
  }, [])
  
  return null
}
```

### 3. Render Tracking

```tsx
export function RenderTracker({ children }) {
  const renders = useRef(0)
  
  useEffect(() => {
    renders.current++
    console.trace(`Component rendered ${renders.current} times`)
  })
  
  return children
}
```

## Best Practices Summary

### Do's
- ✅ Use refs for animations
- ✅ Memoize expensive calculations
- ✅ Dispose of resources properly
- ✅ Use Suspense for async loading
- ✅ Throttle expensive operations
- ✅ Test on real devices
- ✅ Profile performance regularly
- ✅ Use delta time for animations

### Don'ts
- ❌ Create objects in render
- ❌ Use setState for animations
- ❌ Forget to dispose resources
- ❌ Block the main thread
- ❌ Ignore mobile limitations
- ❌ Raycast everything
- ❌ Load full resolution always
- ❌ Mutate shared state

## Common Error Messages

### "Cannot update a component while rendering a different component"
```tsx
// Usually caused by setting state during render
// Solution: Move state updates to useEffect or event handlers
```

### "Maximum update depth exceeded"
```tsx
// Infinite loop in useFrame or useEffect
// Solution: Check dependencies and conditions
```

### "WebGL context lost"
```tsx
// Too many resources or GPU crash
// Solution: Implement context loss handling and reduce resource usage
```