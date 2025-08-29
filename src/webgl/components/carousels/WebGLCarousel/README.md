# WebGL Carousel Component

A high-performance WebGL carousel component built with React Three Fiber, featuring smooth transitions, custom shaders, and post-processing effects.

## Features

- Smooth WebGL-powered transitions
- Custom vertex and fragment shaders for wave effects
- Post-processing with transmission material
- Pyramidal index positioning for depth effect
- Touch and mouse drag support
- Wheel scroll navigation
- Hover effects with scaling
- Click to expand/close functionality

## Usage

```tsx
import { WebGLCarousel } from '@/webgl/components/carousels'

// Basic usage with default images
<WebGLCarousel />

// Custom images
const images = [
  { image: '/path/to/image1.jpg' },
  { image: '/path/to/image2.jpg' },
  { image: '/path/to/image3.jpg' },
]

<WebGLCarousel images={images} />
```

## Props

- `images`: Array of image objects with `image` property (string URL)
- `className`: Optional CSS class name

## Integration with Shared Canvas

This carousel is designed to work within the shared canvas system. Make sure to wrap it in a Canvas component:

```tsx
import { Canvas } from '@react-three/fiber'
import { WebGLCarousel } from '@/webgl/components/carousels'

function App() {
  return (
    <Canvas>
      <WebGLCarousel />
    </Canvas>
  )
}
```

## Customization

### Plane Settings
You can modify the carousel appearance by adjusting the plane settings in `Carousel.tsx`:

```typescript
const planeSettings = {
  width: 1,      // Width of each carousel item
  height: 2.5,   // Height of each carousel item  
  gap: 0.1       // Gap between items
}
```

### Speed Settings
Adjust interaction speeds:

```typescript
const speedWheel = 0.02  // Mouse wheel scroll speed
const speedDrag = -0.3   // Mouse/touch drag speed
```

## Performance Notes

- Images are preloaded using Three.js TextureLoader
- Shaders are optimized for GPU performance
- Uses GSAP for smooth animations
- Post-processing effects can be disabled for better performance on lower-end devices