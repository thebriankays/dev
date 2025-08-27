# Shared Canvas WebGL Architecture for Payload CMS 3

## Overview

This architecture implements a high-performance WebGL system for a Payload CMS 3 website centered on a single, persistent WebGL canvas that renders all 3D scenes via React Three Fiber and @react-three/drei's View component.

## Core Features

- **Single Shared Canvas**: One global canvas for all WebGL content
- **Global Glass Morphism**: CSS-based glass effects with WebGL enhancements
- **GSAP Animation System**: Smooth animations with Lenis scroll integration
- **Cuberto Mouse Follower**: Advanced cursor effects
- **Server-First Architecture**: Optimal performance with SSR support

## Directory Structure

```
src/
├── providers/              # Global context providers
│   ├── Canvas/            # Shared canvas provider
│   ├── Glass/             # Glass morphism system
│   ├── MouseFollower/     # Cuberto cursor integration
│   ├── Animation/         # GSAP, Lenis, Hamo, Tempus
│   └── Theme/             # Existing theme provider
│
├── webgl/
│   ├── components/        # WebGL components
│   │   ├── canvas/       # Canvas setup and management
│   │   ├── flowmap/      # Fluid distortion effects
│   │   ├── image/        # WebGL image component
│   │   ├── postprocessing/ # Bloom, noise, vignette
│   │   ├── tunnel/       # Portal rendering system
│   │   └── view/         # View management
│   ├── hooks/            # Custom React hooks
│   ├── libs/             # Animation libraries
│   └── utils/            # Shader and helper utilities
│
├── blocks/               # Payload CMS blocks
│   ├── _shared/          # Shared block utilities
│   └── WebGLText/        # Example WebGL block
│
└── app/(frontend)/       # Next.js app directory
    └── layout.client.tsx # Client-side canvas setup
```

## Key Components

### 1. SharedCanvas Provider

The heart of the system, managing a single WebGL context shared across all components:

```typescript
<SharedCanvasProvider>
  <SharedCanvas render={true} postprocessing={true} />
  {/* All content renders here */}
</SharedCanvasProvider>
```

### 2. View System

Components connect to the canvas using the View system:

```typescript
<View track={ref}>
  <PerspectiveCamera makeDefault />
  {/* WebGL content */}
</View>
```

### 3. BlockWrapper

Bridges Payload blocks with WebGL content:

```typescript
<BlockWrapper
  glassEffect={{ enabled: true, variant: 'frost' }}
  fluidOverlay={{ enabled: true }}
  webglContent={<WebGLContent />}
>
  {/* DOM content */}
</BlockWrapper>
```

### 4. Glass Design System

Global glass morphism with CSS variables:

```scss
.glass-effect {
  backdrop-filter: blur(var(--glass-blur));
  background: var(--glass-bg-color);
  border: var(--glass-border-width) solid var(--glass-border-color);
}
```

### 5. Animation System

Integrated animation libraries:

- **GSAP**: Industry-standard animation
- **Lenis**: Smooth scroll
- **Hamo**: Lightweight animation engine
- **Tempus**: Time control system

## Usage Examples

### Creating a WebGL Block

1. Define block config:
```typescript
export const MyBlock: Block = {
  slug: 'myBlock',
  fields: [
    ...glassEffectFields,
    ...fluidOverlayFields,
    ...webglEffectFields,
  ],
}
```

2. Create server component:
```typescript
export function MyBlockComponent(props) {
  return (
    <BlockWrapper {...props}>
      <MyBlockClient {...props} />
    </BlockWrapper>
  )
}
```

3. Implement client component with WebGL:
```typescript
export function MyBlockClient() {
  return (
    <ViewportRenderer>
      <mesh>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
    </ViewportRenderer>
  )
}
```

### Using Animation Hooks

```typescript
// GSAP with automatic cleanup
useGSAP(() => {
  gsap.to(meshRef.current.position, {
    y: 100,
    duration: 1,
    ease: 'power2.out'
  })
}, [])

// Access animation utilities
const { lenis, hamo, tempus } = useAnimation()
```

### Applying Glass Effects

```typescript
const { applyGlass } = useGlass()

useEffect(() => {
  applyGlass(elementRef.current, 'frost')
}, [])
```

## Performance Considerations

1. **Single Canvas**: Reduces WebGL context switches
2. **View Culling**: Only renders visible views
3. **Demand Rendering**: Updates only when needed
4. **Asset Preloading**: Managed texture loading
5. **Shader Optimization**: Reusable materials

## Best Practices

1. **Server Components First**: Keep WebGL in client components
2. **Use BlockWrapper**: Ensures proper View setup
3. **Leverage Tunnels**: For global effects
4. **Optimize Shaders**: Share materials when possible
5. **Handle Cleanup**: Use provided hooks

## Future Enhancements

- [ ] Whatamesh background integration
- [ ] Advanced text effects with Troika
- [ ] Travel-themed components (Globe, Carousel)
- [ ] Extended post-processing pipeline
- [ ] Performance monitoring dashboard