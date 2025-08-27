# Travel Data Globe Component

An interactive 3D globe visualization component for displaying global travel destinations and flight routes.

## Features

- **Interactive 3D Globe**: Realistic earth rendering with day/night textures, bump mapping, and specular highlights
- **Travel Destinations**: Pulsing markers with labels showing visitor counts and categories
- **Flight Routes**: Animated particle trails showing flight paths between destinations
- **Atmospheric Effects**: Glowing atmosphere with custom shaders
- **Advanced Filtering**: Filter destinations by category, visitor count, and search
- **Responsive Controls**: Mouse/touch rotation, zoom, and pan
- **Performance Optimized**: Uses instanced rendering and LOD for smooth performance

## Usage

```tsx
import { TravelDataGlobeWrapper } from '@/webgl/components/globe'

// Basic usage
<TravelDataGlobeWrapper />

// With custom data
<TravelDataGlobeWrapper
  destinations={customDestinations}
  routes={customRoutes}
  autoRotate={true}
  showAtmosphere={true}
  showClouds={true}
  showNightLights={true}
  onDestinationClick={(destination) => console.log('Clicked:', destination)}
  onRouteClick={(route) => console.log('Route:', route)}
/>
```

## Props

- `destinations`: Array of destination objects with location, visitor count, and category
- `routes`: Array of flight route objects with frequency and popularity
- `interactive`: Enable/disable user interactions (default: true)
- `autoRotate`: Auto-rotate the globe (default: true)
- `rotationSpeed`: Speed of auto-rotation (default: 0.001)
- `showAtmosphere`: Show atmospheric glow effect (default: true)
- `showClouds`: Show cloud layer (default: true)
- `showNightLights`: Show city lights on night side (default: true)
- `enableFilters`: Show filter control panel (default: true)
- `onDestinationClick`: Callback when destination is clicked
- `onRouteClick`: Callback when route is clicked

## Data Structure

### Destination
```typescript
interface Destination {
  id: string
  name: string
  position: [number, number] // [latitude, longitude]
  visitors: number
  category: 'city' | 'beach' | 'mountain' | 'historic' | 'nature'
  description?: string
  image?: string
}
```

### Flight Route
```typescript
interface FlightRoute {
  id: string
  from: string // destination id
  to: string // destination id
  frequency: number // flights per week
  popularity: number // 0-100
}
```

## Textures

The component uses placeholder textures by default. To use real earth textures, add the following files to `/public/textures/globe/`:

- `earth-day.jpg`: Day texture (land and ocean)
- `earth-night.jpg`: Night lights texture
- `earth-bump.jpg`: Height/bump map
- `earth-specular.jpg`: Specular map (water reflections)
- `earth-clouds.jpg`: Cloud layer texture

High-quality textures can be found at:
- [NASA Visible Earth](https://visibleearth.nasa.gov/)
- [Solar System Scope](https://www.solarsystemscope.com/textures/)

## Performance Considerations

- Uses instanced rendering for multiple destinations
- Implements LOD (Level of Detail) for markers
- Texture loading is handled asynchronously with placeholders
- Particle systems use GPU-based animations
- Control panel updates are debounced

## Customization

The component supports extensive customization through:
- Custom shaders for atmosphere and globe rendering
- Configurable particle effects for flight paths
- Themeable UI controls
- Custom destination markers and categories