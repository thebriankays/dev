# Three.js Tips & Tricks for R3F

## Overview

This guide contains advanced Three.js tips and tricks specifically for React Three Fiber developers. Learn how to leverage Three.js features effectively within the R3F ecosystem.

## Table of Contents

1. [Geometry Optimization](#geometry-optimization)
2. [Material Techniques](#material-techniques)
3. [Lighting Strategies](#lighting-strategies)
4. [Camera Tricks](#camera-tricks)
5. [Post-Processing Effects](#post-processing-effects)
6. [Custom Shaders](#custom-shaders)
7. [Advanced Texturing](#advanced-texturing)
8. [Performance Tricks](#performance-tricks)
9. [Utility Functions](#utility-functions)

## Geometry Optimization

### 1. Merging Geometries

```tsx
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'
import { useMemo } from 'react'

export function MergedGeometry({ positions }) {
  const geometry = useMemo(() => {
    const geometries = positions.map(pos => {
      const geo = new THREE.BoxGeometry(1, 1, 1)
      geo.translate(...pos)
      return geo
    })
    
    // Merge all geometries into one
    return mergeGeometries(geometries)
  }, [positions])
  
  return (
    <mesh>
      <primitive object={geometry} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  )
}
```

### 2. Geometry Instancing with Attributes

```tsx
export function InstancedGeometryWithAttributes({ count = 1000 }) {
  const meshRef = useRef()
  
  // Custom per-instance attributes
  const colorArray = useMemo(() => {
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      colors[i3] = Math.random()
      colors[i3 + 1] = Math.random()
      colors[i3 + 2] = Math.random()
    }
    return colors
  }, [count])
  
  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <boxGeometry>
        <instancedBufferAttribute
          attach="attributes-instanceColor"
          args={[colorArray, 3]}
        />
      </boxGeometry>
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  )
}
```

### 3. Geometry Simplification

```tsx
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier'

export function SimplifiedGeometry({ complexity = 0.5 }) {
  const geometry = useMemo(() => {
    const original = new THREE.TorusKnotGeometry(10, 3, 100, 16)
    const modifier = new SimplifyModifier()
    
    // Reduce vertex count
    const targetCount = Math.floor(
      original.attributes.position.count * complexity
    )
    
    return modifier.modify(original, targetCount)
  }, [complexity])
  
  return (
    <mesh>
      <primitive object={geometry} />
      <meshNormalMaterial />
    </mesh>
  )
}
```

### 4. Bounding Box Helpers

```tsx
export function BoundingBoxHelper({ children }) {
  const groupRef = useRef()
  const [bbox, setBbox] = useState(null)
  
  useEffect(() => {
    if (groupRef.current) {
      const box = new THREE.Box3().setFromObject(groupRef.current)
      setBbox(box)
    }
  }, [children])
  
  return (
    <>
      <group ref={groupRef}>{children}</group>
      {bbox && (
        <box3Helper args={[bbox, 'yellow']} />
      )}
    </>
  )
}
```

## Material Techniques

### 1. Material Property Animation

```tsx
export function AnimatedMaterial() {
  const materialRef = useRef()
  
  useFrame((state) => {
    if (materialRef.current) {
      // Animate multiple properties
      materialRef.current.emissiveIntensity = 
        Math.sin(state.clock.elapsedTime * 2) * 0.5 + 0.5
      
      materialRef.current.roughness = 
        Math.cos(state.clock.elapsedTime) * 0.5 + 0.5
    }
  })
  
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        ref={materialRef}
        color="orange"
        emissive="orange"
        emissiveIntensity={0}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  )
}
```

### 2. Multi-Material Meshes

```tsx
export function MultiMaterialMesh() {
  const materials = useMemo(() => [
    new THREE.MeshBasicMaterial({ color: 'red' }),
    new THREE.MeshBasicMaterial({ color: 'green' }),
    new THREE.MeshBasicMaterial({ color: 'blue' }),
    new THREE.MeshBasicMaterial({ color: 'yellow' }),
    new THREE.MeshBasicMaterial({ color: 'purple' }),
    new THREE.MeshBasicMaterial({ color: 'orange' })
  ], [])
  
  return (
    <mesh material={materials}>
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  )
}
```

### 3. Material Cloning & Modification

```tsx
export function ClonedMaterial({ baseMaterial }) {
  const material = useMemo(() => {
    const cloned = baseMaterial.clone()
    
    // Modify cloned material
    cloned.color = new THREE.Color('hotpink')
    cloned.wireframe = true
    cloned.transparent = true
    cloned.opacity = 0.5
    
    return cloned
  }, [baseMaterial])
  
  return (
    <mesh>
      <torusGeometry args={[1, 0.4, 16, 100]} />
      <primitive object={material} />
    </mesh>
  )
}
```

### 4. Custom Material Uniforms

```tsx
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

const PulseMaterial = shaderMaterial(
  {
    time: 0,
    pulseSpeed: 2,
    pulseAmplitude: 0.5,
    color: new THREE.Color('hotpink')
  },
  // Vertex shader
  `
    varying vec2 vUv;
    uniform float time;
    uniform float pulseAmplitude;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      float pulse = sin(time * 2.0) * pulseAmplitude;
      pos *= 1.0 + pulse;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform vec3 color;
    varying vec2 vUv;
    
    void main() {
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

extend({ PulseMaterial })

export function PulsingMesh() {
  const materialRef = useRef()
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <pulseMaterial ref={materialRef} />
    </mesh>
  )
}
```

## Lighting Strategies

### 1. Light Probes for IBL

```tsx
import { LightProbe } from 'three'
import { useCubeTexture } from '@react-three/drei'

export function ImageBasedLighting() {
  const envMap = useCubeTexture(
    ['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'],
    { path: '/cubemap/' }
  )
  
  return (
    <>
      <ambientLight intensity={0.1} />
      <primitive object={new LightProbe()} intensity={1}>
        <primitive attach="sh" object={envMap} />
      </primitive>
    </>
  )
}
```

### 2. Shadow Optimization

```tsx
export function OptimizedShadows() {
  const lightRef = useRef()
  
  useEffect(() => {
    if (lightRef.current) {
      // Optimize shadow camera frustum
      const light = lightRef.current
      light.shadow.camera.near = 0.5
      light.shadow.camera.far = 50
      light.shadow.camera.left = -10
      light.shadow.camera.right = 10
      light.shadow.camera.top = 10
      light.shadow.camera.bottom = -10
      light.shadow.camera.updateProjectionMatrix()
      
      // Use shadow cascades for large scenes
      light.shadow.mapSize.width = 2048
      light.shadow.mapSize.height = 2048
      light.shadow.bias = -0.0005
      light.shadow.normalBias = 0.02
    }
  }, [])
  
  return (
    <directionalLight
      ref={lightRef}
      castShadow
      position={[10, 10, 5]}
      intensity={1}
    />
  )
}
```

### 3. Dynamic Light LOD

```tsx
export function DynamicLightLOD({ quality = 'medium' }) {
  const lightConfig = {
    low: { count: 1, shadows: false, intensity: 1 },
    medium: { count: 3, shadows: true, intensity: 0.7 },
    high: { count: 5, shadows: true, intensity: 0.5 }
  }
  
  const config = lightConfig[quality]
  
  return (
    <>
      <ambientLight intensity={0.2} />
      {Array.from({ length: config.count }).map((_, i) => (
        <pointLight
          key={i}
          position={[
            Math.sin(i * Math.PI * 2 / config.count) * 5,
            2,
            Math.cos(i * Math.PI * 2 / config.count) * 5
          ]}
          intensity={config.intensity}
          castShadow={config.shadows}
          shadow-mapSize={[512, 512]}
        />
      ))}
    </>
  )
}
```

### 4. Light Helpers

```tsx
export function LightDebugging({ showHelpers = true }) {
  const dirLightRef = useRef()
  const spotLightRef = useRef()
  
  return (
    <>
      <directionalLight ref={dirLightRef} position={[5, 5, 5]} />
      <spotLight ref={spotLightRef} position={[0, 10, 0]} angle={0.3} />
      
      {showHelpers && (
        <>
          {dirLightRef.current && (
            <directionalLightHelper args={[dirLightRef.current, 5]} />
          )}
          {spotLightRef.current && (
            <spotLightHelper args={[spotLightRef.current]} />
          )}
        </>
      )}
    </>
  )
}
```

## Camera Tricks

### 1. Cinematic Camera Movement

```tsx
export function CinematicCamera() {
  const { camera } = useThree()
  const cameraPath = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-10, 5, 10),
      new THREE.Vector3(-5, 2, 5),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(5, 2, -5),
      new THREE.Vector3(10, 5, -10)
    ])
    curve.closed = true
    return curve
  }, [])
  
  useFrame((state) => {
    const t = (state.clock.elapsedTime * 0.1) % 1
    const point = cameraPath.getPoint(t)
    const lookAt = cameraPath.getPoint((t + 0.01) % 1)
    
    camera.position.copy(point)
    camera.lookAt(lookAt)
  })
  
  return null
}
```

### 2. Depth of Field Effect

```tsx
import { DepthOfField, EffectComposer } from '@react-three/postprocessing'

export function DOFCamera() {
  const meshRef = useRef()
  const { camera } = useThree()
  
  useFrame(() => {
    if (meshRef.current) {
      // Auto-focus on mesh
      const distance = camera.position.distanceTo(meshRef.current.position)
      // Update DOF focus distance
    }
  })
  
  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry />
        <meshStandardMaterial color="red" />
      </mesh>
      
      <EffectComposer>
        <DepthOfField
          focusDistance={0.01}
          focalLength={0.02}
          bokehScale={2}
          height={480}
        />
      </EffectComposer>
    </>
  )
}
```

### 3. Multiple Cameras

```tsx
export function MultiCameraScene() {
  const [activeCamera, setActiveCamera] = useState('perspective')
  const perspectiveCam = useRef()
  const orthographicCam = useRef()
  
  const { set } = useThree()
  
  useEffect(() => {
    const camera = activeCamera === 'perspective' 
      ? perspectiveCam.current 
      : orthographicCam.current
      
    if (camera) {
      set({ camera })
    }
  }, [activeCamera, set])
  
  return (
    <>
      <perspectiveCamera
        ref={perspectiveCam}
        position={[0, 5, 10]}
        fov={50}
      />
      <orthographicCamera
        ref={orthographicCam}
        position={[0, 5, 10]}
        zoom={50}
      />
      
      <Html>
        <button onClick={() => setActiveCamera('perspective')}>
          Perspective
        </button>
        <button onClick={() => setActiveCamera('orthographic')}>
          Orthographic
        </button>
      </Html>
    </>
  )
}
```

### 4. Camera Shake Effect

```tsx
export function CameraShake({ intensity = 0.5, decay = 0.95 }) {
  const { camera } = useThree()
  const shake = useRef({ x: 0, y: 0, z: 0 })
  const originalPosition = useRef(camera.position.clone())
  
  useFrame(() => {
    // Apply shake
    camera.position.x = originalPosition.current.x + shake.current.x
    camera.position.y = originalPosition.current.y + shake.current.y
    camera.position.z = originalPosition.current.z + shake.current.z
    
    // Decay shake
    shake.current.x *= decay
    shake.current.y *= decay
    shake.current.z *= decay
  })
  
  const triggerShake = () => {
    shake.current = {
      x: (Math.random() - 0.5) * intensity,
      y: (Math.random() - 0.5) * intensity,
      z: (Math.random() - 0.5) * intensity
    }
  }
  
  return (
    <mesh onClick={triggerShake}>
      <boxGeometry />
      <meshBasicMaterial color="red" />
    </mesh>
  )
}
```

## Post-Processing Effects

### 1. Custom Post-Processing Pass

```tsx
import { Pass } from 'postprocessing'
import { useMemo, forwardRef } from 'react'

class CustomPass extends Pass {
  constructor({ strength = 0.5 }) {
    super('CustomPass')
    this.uniforms = new Map([
      ['strength', new THREE.Uniform(strength)]
    ])
  }
  
  get fragmentShader() {
    return `
      uniform float strength;
      
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 color = inputColor.rgb;
        
        // Custom effect
        color = mix(color, vec3(1.0) - color, strength);
        
        outputColor = vec4(color, inputColor.a);
      }
    `
  }
}

const CustomEffect = forwardRef(({ strength }, ref) => {
  const effect = useMemo(() => new CustomPass({ strength }), [strength])
  return <primitive ref={ref} object={effect} />
})

export function CustomPostProcessing() {
  return (
    <EffectComposer>
      <CustomEffect strength={0.5} />
    </EffectComposer>
  )
}
```

### 2. Selective Bloom

```tsx
import { Bloom, EffectComposer, Selection, Select } from '@react-three/postprocessing'

export function SelectiveBloom() {
  return (
    <>
      <Selection>
        <EffectComposer>
          <Bloom
            intensity={2}
            luminanceThreshold={0}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
        
        <Select enabled>
          {/* Only this mesh will bloom */}
          <mesh>
            <sphereGeometry />
            <meshBasicMaterial color="hotpink" />
          </mesh>
        </Select>
        
        {/* This mesh won't bloom */}
        <mesh position={[2, 0, 0]}>
          <boxGeometry />
          <meshBasicMaterial color="blue" />
        </mesh>
      </Selection>
    </>
  )
}
```

### 3. Performance-Friendly Effects

```tsx
export function AdaptivePostProcessing() {
  const [quality, setQuality] = useState('medium')
  const { gl } = useThree()
  
  useEffect(() => {
    // Check GPU capabilities
    const renderer = gl
    const maxSamples = renderer.capabilities.maxSamples
    
    if (maxSamples < 4) {
      setQuality('low')
    } else if (maxSamples >= 8) {
      setQuality('high')
    }
  }, [gl])
  
  const effectProps = {
    low: { samples: 2, blur: 0.5 },
    medium: { samples: 4, blur: 1 },
    high: { samples: 8, blur: 2 }
  }[quality]
  
  return (
    <EffectComposer multisampling={effectProps.samples}>
      <Bloom luminanceThreshold={0.8} radius={effectProps.blur} />
    </EffectComposer>
  )
}
```

## Custom Shaders

### 1. Vertex Displacement

```tsx
const DisplacementMaterial = shaderMaterial(
  {
    time: 0,
    displacementScale: 1,
    noiseScale: 5
  },
  // Vertex shader
  `
    uniform float time;
    uniform float displacementScale;
    uniform float noiseScale;
    varying vec2 vUv;
    varying float vDisplacement;
    
    // Simplex noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      vUv = uv;
      
      float noise = snoise(vec2(position.x * noiseScale, position.y * noiseScale + time));
      vDisplacement = noise;
      
      vec3 newPosition = position + normal * noise * displacementScale;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  // Fragment shader
  `
    varying vec2 vUv;
    varying float vDisplacement;
    
    void main() {
      vec3 color = mix(vec3(0.1, 0.1, 0.8), vec3(1.0, 0.5, 0.0), vDisplacement + 0.5);
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

extend({ DisplacementMaterial })

export function DisplacementPlane() {
  const materialRef = useRef()
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[10, 10, 100, 100]} />
      <displacementMaterial
        ref={materialRef}
        displacementScale={2}
        noiseScale={0.5}
      />
    </mesh>
  )
}
```

### 2. Fragment Shader Effects

```tsx
const HolographicMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0x00ff88)
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      // Holographic effect
      float stripes = sin((vPosition.y - time * 2.0) * 20.0);
      float scanline = sin(time * 10.0 + vPosition.y * 50.0) * 0.04;
      
      vec3 hologram = color * (0.5 + stripes * 0.5);
      hologram += scanline;
      
      // Edge glow
      vec2 uv2 = vUv * 2.0 - 1.0;
      float edgeGlow = 1.0 - dot(uv2, uv2);
      hologram += color * pow(edgeGlow, 3.0) * 0.5;
      
      gl_FragColor = vec4(hologram, 0.9);
    }
  `
)

extend({ HolographicMaterial })

export function HolographicMesh() {
  const materialRef = useRef()
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh>
      <torusKnotGeometry args={[1, 0.4, 100, 16]} />
      <holographicMaterial
        ref={materialRef}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
```

## Advanced Texturing

### 1. Procedural Textures

```tsx
export function ProceduralTexture() {
  const texture = useMemo(() => {
    const size = 512
    const data = new Uint8Array(size * size * 4)
    
    for (let i = 0; i < size * size; i++) {
      const x = (i % size) / size
      const y = Math.floor(i / size) / size
      
      // Create procedural pattern
      const pattern = Math.sin(x * 20) * Math.cos(y * 20)
      const value = (pattern + 1) * 0.5 * 255
      
      data[i * 4] = value // R
      data[i * 4 + 1] = value * 0.5 // G
      data[i * 4 + 2] = value * 0.25 // B
      data[i * 4 + 3] = 255 // A
    }
    
    const texture = new THREE.DataTexture(data, size, size)
    texture.needsUpdate = true
    
    return texture
  }, [])
  
  return (
    <mesh>
      <planeGeometry args={[5, 5]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}
```

### 2. Video Textures

```tsx
export function VideoTexture({ src }) {
  const [video] = useState(() => {
    const vid = document.createElement('video')
    vid.src = src
    vid.crossOrigin = 'anonymous'
    vid.loop = true
    vid.muted = true
    vid.play()
    return vid
  })
  
  const texture = useMemo(() => {
    const tex = new THREE.VideoTexture(video)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.format = THREE.RGBFormat
    tex.encoding = THREE.sRGBEncoding
    return tex
  }, [video])
  
  useFrame(() => {
    if (texture.needsUpdate) {
      texture.needsUpdate = true
    }
  })
  
  return (
    <mesh>
      <planeGeometry args={[16, 9]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}
```

### 3. Canvas Textures

```tsx
export function CanvasTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    // Draw on canvas
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, 512, 512)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '48px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('R3F', 256, 256)
    
    // Create gradient
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
    gradient.addColorStop(0, 'rgba(255, 0, 255, 0.5)')
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0.5)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    
    return texture
  }, [])
  
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}
```

## Performance Tricks

### 1. Object Pooling

```tsx
export function ObjectPool({ maxObjects = 100 }) {
  const pool = useRef([])
  const active = useRef(new Set())
  
  // Initialize pool
  useEffect(() => {
    for (let i = 0; i < maxObjects; i++) {
      const obj = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )
      obj.visible = false
      pool.current.push(obj)
    }
  }, [maxObjects])
  
  const acquire = () => {
    const obj = pool.current.find(o => !active.current.has(o))
    if (obj) {
      active.current.add(obj)
      obj.visible = true
      return obj
    }
    return null
  }
  
  const release = (obj) => {
    active.current.delete(obj)
    obj.visible = false
    obj.position.set(0, 0, 0)
    obj.rotation.set(0, 0, 0)
    obj.scale.set(1, 1, 1)
  }
  
  return { acquire, release, pool: pool.current }
}
```

### 2. Texture Atlas Generator

```tsx
export function useTextureAtlas(images) {
  const atlas = useMemo(() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Calculate atlas size
    const itemSize = 256
    const columns = Math.ceil(Math.sqrt(images.length))
    const rows = Math.ceil(images.length / columns)
    
    canvas.width = columns * itemSize
    canvas.height = rows * itemSize
    
    const uvMap = {}
    
    images.forEach((img, index) => {
      const x = (index % columns) * itemSize
      const y = Math.floor(index / columns) * itemSize
      
      ctx.drawImage(img, x, y, itemSize, itemSize)
      
      // Store UV coordinates
      uvMap[index] = {
        x: x / canvas.width,
        y: y / canvas.height,
        w: itemSize / canvas.width,
        h: itemSize / canvas.height
      }
    })
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    
    return { texture, uvMap }
  }, [images])
  
  return atlas
}
```

### 3. Geometry Batching

```tsx
export function BatchedMeshes({ meshData }) {
  const batchedGeometry = useMemo(() => {
    const geometries = []
    const materials = []
    
    meshData.forEach(({ geometry, material, matrix }) => {
      const geo = geometry.clone()
      geo.applyMatrix4(matrix)
      geometries.push(geo)
      materials.push(material)
    })
    
    // Merge geometries
    const merged = mergeGeometries(geometries)
    
    // Clean up
    geometries.forEach(g => g.dispose())
    
    return merged
  }, [meshData])
  
  return (
    <mesh>
      <primitive object={batchedGeometry} />
      <meshBasicMaterial vertexColors />
    </mesh>
  )
}
```

## Utility Functions

### 1. World Position Helper

```tsx
export function useWorldPosition(ref) {
  const [worldPos, setWorldPos] = useState(new THREE.Vector3())
  
  useFrame(() => {
    if (ref.current) {
      ref.current.getWorldPosition(worldPos)
      setWorldPos(worldPos.clone())
    }
  })
  
  return worldPos
}

// Usage
export function TrackedMesh() {
  const meshRef = useRef()
  const worldPosition = useWorldPosition(meshRef)
  
  return (
    <>
      <mesh ref={meshRef}>
        <boxGeometry />
        <meshBasicMaterial color="red" />
      </mesh>
      
      <Html position={worldPosition}>
        <div>
          Position: {worldPosition.x.toFixed(2)}, 
          {worldPosition.y.toFixed(2)}, 
          {worldPosition.z.toFixed(2)}
        </div>
      </Html>
    </>
  )
}
```

### 2. Raycasting Helper

```tsx
export function useRaycast() {
  const { camera, scene } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  
  const raycast = useCallback((screenPos, objects = scene.children) => {
    raycaster.setFromCamera(screenPos, camera)
    return raycaster.intersectObjects(objects, true)
  }, [camera, scene, raycaster])
  
  return raycast
}

// Usage
export function RaycastExample() {
  const raycast = useRaycast()
  
  const handleClick = (event) => {
    const mouse = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1
    }
    
    const intersects = raycast(mouse)
    console.log('Intersected objects:', intersects)
  }
  
  return <mesh onClick={handleClick}>...</mesh>
}
```

### 3. Bounds Calculator

```tsx
export function useBounds(object) {
  const [bounds, setBounds] = useState(null)
  
  useEffect(() => {
    if (object) {
      const box = new THREE.Box3().setFromObject(object)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      
      setBounds({ box, size, center })
    }
  }, [object])
  
  return bounds
}
```

## Best Practices Summary

1. **Geometry**: Reuse, merge, and instance when possible
2. **Materials**: Share materials, use simple shaders on mobile
3. **Textures**: Use atlases, compress, and generate mipmaps
4. **Lighting**: Bake when possible, limit dynamic lights
5. **Cameras**: Optimize frustum, use LOD based on distance
6. **Shaders**: Keep simple, use vertex shaders for animation
7. **Performance**: Profile, pool objects, batch operations
8. **Memory**: Dispose unused resources, monitor usage

## Useful Three.js Constants

```tsx
// Blend modes
THREE.NoBlending
THREE.NormalBlending
THREE.AdditiveBlending
THREE.SubtractiveBlending
THREE.MultiplyBlending

// Depth modes
THREE.NeverDepth
THREE.AlwaysDepth
THREE.EqualDepth
THREE.LessDepth
THREE.LessEqualDepth
THREE.GreaterEqualDepth
THREE.GreaterDepth
THREE.NotEqualDepth

// Side rendering
THREE.FrontSide
THREE.BackSide
THREE.DoubleSide

// Wrap modes
THREE.RepeatWrapping
THREE.ClampToEdgeWrapping
THREE.MirroredRepeatWrapping

// Filter modes
THREE.NearestFilter
THREE.LinearFilter
THREE.NearestMipmapNearestFilter
THREE.LinearMipmapLinearFilter
```