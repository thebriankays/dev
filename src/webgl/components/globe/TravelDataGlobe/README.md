# TravelDataGlobe WebGL Component

A React Three Fiber (R3F) component that renders an interactive 3D globe with country data visualization. This component is designed to work within the shared canvas architecture.

## Architecture

This component is built specifically for the shared canvas pattern:
- Renders within a View tracked by BlockWrapper
- Uses R3F for declarative 3D scene management
- Integrates with the global render loop via Tunnel pattern

## File Structure

```
TravelDataGlobe/
├── TravelDataGlobe.tsx       # Main wrapper component
├── TravelDataGlobeManual.tsx # R3F scene implementation
├── Countries.tsx             # Country polygons rendering
├── VisaArcs.tsx             # Visa arc connections
├── utils.ts                 # Helper functions
└── README.md                # This file
```

## Components

### TravelDataGlobe.tsx
- Main entry point
- Forwards props to TravelDataGlobeManual
- Handles TypeScript interfaces

### TravelDataGlobeManual.tsx
The core R3F scene containing:
- **GlobeSphere**: Textured earth sphere with bump mapping
- **CloudLayer**: Animated transparent cloud layer
- **Atmosphere**: Glow effect around globe
- **Countries**: Interactive country polygons
- **CountryMarker**: White pin that drops on selected country
- **PointMarkers**: Airport/restaurant location markers
- **VisaArcs**: Arc connections between countries

### Countries.tsx
- Renders country polygons on globe surface
- Handles hover/click interactions
- Colors based on data (advisory levels, visa requirements)
- Uses proper 3D projection onto sphere

### VisaArcs.tsx
- Creates arc connections between passport and destination countries
- Color-coded by visa requirement type
- Uses Line component from drei

## Props Interface

```typescript
interface TravelDataGlobeProps {
  polygons: Array<PolyAdv | VisaPolygon>
  borders: CountryBorder
  airports: AirportData[]
  restaurants: MichelinRestaurantData[]
  
  globeImageUrl: string
  bumpImageUrl: string
  
  autoRotateSpeed: number
  atmosphereColor: string
  
  onCountryClick: (name: string) => void
  onAirportClick: (airport: AirportData) => void
  onRestaurantClick: (restaurant: MichelinRestaurantData) => void
  onCountryHover: (name: string | null) => void
  
  selectedCountry: string | null
  hoveredCountry: string | null
  currentView: 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'
  visaArcs: VisaData[]
  showMarkers: boolean
}
```

## Features

### Globe Rendering
- Textured sphere with earth imagery
- Bump mapping for terrain elevation
- Specular highlights on water
- Animated cloud layer

### Country Visualization
- GeoJSON polygon rendering
- Proper 3D sphere projection
- Color coding by data type
- Hover highlighting
- Click selection

### Camera Animation
- GSAP-powered smooth transitions
- Fly-to selected country
- Auto-rotation when idle
- OrbitControls for user interaction

### Performance Optimizations
- Memoized polygon calculations
- Efficient raycasting for interactions
- Post-processing with bloom effect
- Proper depth sorting

## Integration with Shared Canvas

This component is designed to work within the shared canvas architecture:

1. **Rendered through BlockWrapper**: The parent block passes this as `webglContent`
2. **View tracking**: BlockWrapper creates a View that tracks the DOM element
3. **Tunnel pattern**: Content is tunneled to the shared canvas
4. **No direct canvas creation**: Uses the global WebGL renderer

### Important: DO NOT
- Create your own Canvas element
- Use ViewportRenderer (BlockWrapper handles this)
- Render outside the tunnel system

## Textures Required

Place these in `/public`:
- `/earth-blue-marble.jpg` - Earth surface texture
- `/earth-topology.jpg` - Bump map for elevation
- `/clouds.png` - Transparent cloud texture

## Known Issues & Solutions

### Issue: "Div is not part of THREE namespace"
**Solution**: Use BlockWrapper's webglContent prop, not ViewportRenderer

### Issue: Countries not rendering
**Solution**: Check polygon data and ensure Countries component is included

### Issue: White overlay on canvas
**Solution**: Ensure SharedCanvas has proper clear settings

### Issue: Visa arcs not showing
**Solution**: Verify visaArcs data includes passportCountry field

## Performance Tips

1. **Reduce polygon detail**: Simplify GeoJSON if performance issues
2. **Adjust post-processing**: Bloom can be intensive
3. **Limit arc count**: Too many arcs can impact performance
4. **Texture optimization**: Use compressed textures for faster loading

## Development Notes

- Uses THREE.js r128+ features
- GSAP for animations (not React Spring)
- OrbitControls for camera manipulation
- Bloom post-processing for atmosphere

## Future Enhancements

- [ ] Level of Detail (LOD) for countries
- [ ] Texture atlas for flags
- [ ] WebWorker for data processing
- [ ] Progressive texture loading
- [ ] Touch gesture support
