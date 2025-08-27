# 3D Carousel Component

A sophisticated WebGL-powered 3D carousel component that displays travel destination images in various 3D arrangements with interactive controls and visual effects.

## Features

- **Multiple Layout Options**:
  - Circular: Images arranged in a circle
  - Cylinder: Full cylindrical arrangement
  - Helix: Spiral/helix pattern
  - Wave: Sinusoidal wave layout

- **Interactive Controls**:
  - Mouse drag to rotate
  - Mouse wheel for navigation
  - Keyboard arrow keys support
  - Touch/swipe gestures
  - Click to focus/expand items
  - Navigation dots

- **Visual Effects**:
  - Depth-based scaling and fading
  - Reflection effects on ground plane
  - Particle effects for active items
  - Hover glow and expansion
  - Smooth momentum scrolling
  - Fog for depth perception

- **Integration Features**:
  - Works with shared canvas system
  - GSAP animation integration
  - Mouse follower state changes
  - Responsive design

## Usage

```tsx
import { ThreeDCarousel } from '@/webgl/components/carousels/ThreeDCarousel'
import type { TravelDestination } from '@/webgl/components/carousels/ThreeDCarousel/types'

const destinations: TravelDestination[] = [
  {
    id: '1',
    image: 'path/to/image.jpg',
    title: 'Santorini',
    location: 'Greece',
    description: 'Beautiful island destination',
    rating: 4.8,
    price: 'From $2,499'
  },
  // ... more destinations
]

function MyComponent() {
  return (
    <ThreeDCarousel
      destinations={destinations}
      layout="circular"
      autoRotate={true}
      rotationSpeed={0.2}
      enableReflections={true}
      enableParticles={true}
      enableDepthFade={true}
      radius={8}
      spacing={3}
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| destinations | TravelDestination[] | required | Array of destination objects |
| layout | CarouselLayout | 'circular' | Layout style: 'circular', 'cylinder', 'helix', or 'wave' |
| autoRotate | boolean | true | Enable automatic rotation |
| rotationSpeed | number | 0.2 | Speed of auto-rotation |
| enableReflections | boolean | true | Show reflection ground plane |
| enableParticles | boolean | true | Enable particle effects |
| enableDepthFade | boolean | true | Apply depth-based fading |
| radius | number | 8 | Radius of circular layouts |
| spacing | number | 3 | Spacing between items |
| className | string | '' | Additional CSS classes |

## TravelDestination Type

```typescript
interface TravelDestination {
  id: string
  image: string
  title: string
  location: string
  description?: string
  rating?: number
  price?: string
}
```

## Demo

Visit `/three-d-carousel-demo` to see the component in action with interactive controls.