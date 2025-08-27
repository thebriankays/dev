# Whatamesh Component

An animated WebGL mesh background component built with React Three Fiber for the shared canvas architecture.

## Features

- **Animated Gradients**: Smooth, flowing gradient animations with customizable colors
- **3D Noise Displacement**: Organic mesh deformation using Simplex 3D noise
- **Mouse Interaction**: Responds to mouse movement with subtle effects
- **Iridescent Effects**: Fresnel-based iridescence for visual depth
- **Performance Optimized**: Uses shader-based animations for smooth performance
- **Fully Customizable**: Colors, speed, amplitude, and other parameters

## Usage

### Basic Usage

```tsx
import { Whatamesh } from '@/webgl/components/whatamesh'
import { ViewportRenderer } from '@/webgl/components/view'

function MyComponent() {
  return (
    <ViewportRenderer>
      <Whatamesh />
    </ViewportRenderer>
  )
}
```

### With Custom Props

```tsx
<Whatamesh
  colorStart="#ff6b6b"
  colorEnd="#feca57"
  colorAccent="#ff9ff3"
  speed={0.3}
  amplitude={0.5}
  frequency={1.5}
  opacity={0.8}
  interactive={true}
  mouseInfluence={true}
/>
```

### Using WhatameshBackground Wrapper

```tsx
import { WhatameshBackground } from '@/webgl/components/whatamesh'

function MyPage() {
  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <WhatameshBackground
        colorStart="#0abde3"
        colorEnd="#006ba6"
        colorAccent="#48dbfb"
      />
      {/* Your content here */}
    </div>
  )
}
```

### Using WhatameshBlock

```tsx
import { WhatameshBlock } from '@/webgl/components/whatamesh/WhatameshBlock'

function HeroSection() {
  return (
    <WhatameshBlock
      title="Welcome"
      subtitle="To the world of animated backgrounds"
      content="Experience smooth WebGL animations"
      variant="sunset"
      interactive={true}
    />
  )
}
```

## Props

### Whatamesh Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `colorStart` | `string` | `#667eea` | Starting color of the gradient |
| `colorEnd` | `string` | `#764ba2` | Ending color of the gradient |
| `colorAccent` | `string` | `#f093fb` | Accent color for highlights |
| `speed` | `number` | `0.3` | Animation speed (0.1 - 1.0) |
| `amplitude` | `number` | `0.5` | Displacement amplitude (0.1 - 1.0) |
| `frequency` | `number` | `1.5` | Noise frequency (0.5 - 3.0) |
| `gradientSpeed` | `number` | `0.2` | Gradient animation speed |
| `opacity` | `number` | `0.8` | Overall opacity (0 - 1) |
| `position` | `[number, number, number]` | `[0, 0, -500]` | 3D position |
| `scale` | `number` | `1` | Mesh scale factor |
| `segments` | `number` | `128` | Mesh subdivision segments |
| `interactive` | `boolean` | `true` | Enable pointer events |
| `mouseInfluence` | `boolean` | `true` | Enable mouse effects |

### WhatameshBlock Variants

- `default` - Purple gradient
- `sunset` - Warm orange/pink gradient
- `ocean` - Blue gradient
- `aurora` - Cyan/purple gradient
- `volcanic` - Red/orange gradient

## Utilities

The component exports utility functions for dynamic control:

```tsx
import { WhatameshUtils } from '@/webgl/components/whatamesh'

// Update colors dynamically
WhatameshUtils.updateColors(material, {
  start: '#ff0000',
  end: '#00ff00',
  accent: '#0000ff'
})

// Update animation parameters
WhatameshUtils.updateAnimation(material, {
  speed: 0.5,
  amplitude: 0.8,
  frequency: 2.0
})
```

## Integration with Payload Blocks

The component is designed to work seamlessly with Payload CMS blocks:

1. Use `WhatameshBlock` for quick integration
2. Or create custom blocks using the base `Whatamesh` component
3. Ensure proper ViewportRenderer wrapping for shared canvas integration

## Performance Notes

- Uses GPU-based animations via shaders
- Automatically adjusts to viewport size
- Supports on-demand rendering with the shared canvas
- Minimal CPU overhead due to shader-based calculations

## Demo

Visit `/whatamesh-demo` to see an interactive demo with controls.