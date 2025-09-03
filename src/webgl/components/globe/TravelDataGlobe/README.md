# TravelDataGlobe WebGL Component

A Three.js/React Three Fiber globe component for visualizing travel data with interactive features.

## Components

### TravelDataGlobeManual.tsx
The main globe component that renders:
- Textured Earth sphere with bump mapping
- Atmosphere glow effect  
- Country polygon overlays
- Interactive markers for locations
- Camera animations and controls

### Supporting Components

- **Countries.tsx**: Renders country polygons with color coding
- **Markers.tsx**: Renders interactive location markers
- **Arcs.tsx**: Renders visa connection arcs
- **utils.ts**: Helper functions for coordinate conversions

## Features

### Globe Rendering
- **Texture Loading**: Uses drei's `useTexture` hook for reliable texture loading
- **Bump Mapping**: Adds terrain depth to the globe surface
- **Atmosphere**: Subtle glow effect using transparent mesh
- **Lighting**: Ambient + directional lights for proper illumination

### Interactivity
- **Orbit Controls**: Mouse/touch controls for rotation and zoom
- **Click Handlers**: Select countries, restaurants, or airports
- **Hover Effects**: Highlight countries on hover
- **Camera Animation**: Smooth transitions using GSAP

### Data Visualization
- **Advisory Levels**: Color-coded countries (green to red)
- **Visa Requirements**: Arc connections between countries
- **Location Markers**: Spheres for restaurants/airports
- **Selected Indicators**: White marker for selected locations

## Props

```typescript
interface TravelDataGlobeManualProps {
  polygons: Array<PolyAdv | VisaPolygon>
  borders: CountryBorder
  airports: AirportData[]
  restaurants: MichelinRestaurantData[]
  globeImageUrl: string           // Earth texture
  bumpImageUrl: string            // Bump map texture
  autoRotateSpeed: number         // Auto-rotation speed
  atmosphereColor: string         // Glow color
  atmosphereAltitude: number      // Glow size
  onCountryClick: Function        // Country click handler
  onAirportClick: Function        // Airport click handler
  onRestaurantClick: Function     // Restaurant click handler
  onCountryHover: Function        // Hover handler
  selectedCountry: string | null
  selectedCountryCode: string | null
  hoveredCountry: string | null
  passportCountry: string | null
  currentView: string             // Active data view
  visaArcs: Array                // Visa connections
  showMarkers: boolean
  focusTarget: Object | null      // Camera focus point
}
```

## Technical Details

### Shared Canvas Architecture
This component is designed to work with a shared WebGL canvas:
- Canvas is rendered at the application root
- Component uses React Three Fiber's View component
- Background is kept transparent
- UI elements overlay the canvas

### Performance Optimizations
- Texture caching with useTexture
- Efficient geometry creation for polygons
- Conditional rendering based on view
- Frame-based animations with useFrame

### Coordinate System
- Uses latitude/longitude to 3D vector conversion
- Globe radius: 2 units
- Country polygons: radius 2.01 (slightly above surface)
- Markers: radius 2.02-2.05 (above polygons)

## Dependencies

- `three`: Core 3D library
- `@react-three/fiber`: React renderer for Three.js
- `@react-three/drei`: Helper components (OrbitControls, useTexture)
- `gsap`: Smooth camera animations

## Textures Required

Place these files in the public folder:
- `/earth-blue-marble.jpg`: Main Earth texture
- `/earth-topology.png`: Bump map for terrain
- `/clouds.png`: Optional cloud layer texture

## Common Issues

### Texture Not Loading
- Check console for 404 errors
- Verify texture files exist in public folder
- Ensure correct file extensions

### Performance Issues
- Reduce polygon complexity
- Lower sphere segment count
- Disable auto-rotation
- Use simpler materials

### Visual Issues
- Adjust lighting intensity if too dark/bright
- Modify atmosphere opacity for subtler effect
- Check z-fighting by adjusting radius values

## Future Improvements

- [ ] Add cloud layer animation
- [ ] Implement shader-based atmosphere
- [ ] Add city lights on dark side
- [ ] Optimize polygon rendering with instancing
- [ ] Add smooth arc animations for visa connections
- [ ] Implement level-of-detail (LOD) for markers