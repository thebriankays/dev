# TravelGlobe Block

## Overview
The TravelGlobe block is a comprehensive travel data visualization component that displays interactive global information including:
- Travel advisories
- Visa requirements 
- Michelin restaurants
- International airports

This component is ported from the original TravelDataGlobe with full integration into the new shared canvas WebGL architecture.

## Features

### Core Features
- **Interactive Globe**: 3D globe visualization using either WebGL (shared canvas) or react-globe.gl (full features)
- **VerticalMarquee**: Animated vertical text marquee on the side
- **Glass Morphism UI**: Modern glass-effect panels and tabs
- **Multiple Data Views**: Switch between different data visualizations
- **Search & Filter**: Search functionality for each data type
- **Responsive Design**: Adapts to mobile, tablet, and desktop screens

### Data Views
1. **Travel Advisories**: U.S. State Department travel warnings by country
2. **Visa Requirements**: Visa requirements based on passport country
3. **Michelin Restaurants**: Global Michelin-starred restaurants
4. **Airports**: International airport locations and information

## Architecture

### Component Structure
```
TravelGlobe/
├── config.ts              # Payload CMS block configuration
├── types.ts               # TypeScript type definitions
├── Component.tsx          # Server component (data fetching)
├── TravelGlobe.client.tsx # Client component (interactivity)
├── TravelGlobe.scss       # Styles
├── index.ts               # Exports
└── README.md              # This file
```

### Integration Points

#### Shared Canvas Architecture
The component integrates with the shared WebGL canvas through:
- `BlockWrapper`: Manages View setup and glass effects
- `View` component: Maps DOM element to WebGL scene
- `ViewportRenderer`: Handles WebGL rendering context

#### VerticalMarquee
Uses the standalone VerticalMarquee component from `/src/components/VerticalMarquee`

#### Glass Design System
Leverages the global glass morphism system:
- Glass tabs with customizable tint, opacity, blur
- Glass panels for information display
- Configurable border styles and effects

## Usage

### Basic Implementation
```tsx
import { TravelGlobeComponent } from '@/blocks/TravelGlobe'

<TravelGlobeComponent {...blockData} />
```

### Configuration Options
The block accepts these configuration groups:

#### Globe Settings
- `interactive`: Enable user interactions
- `autoRotate`: Auto-rotation of globe
- `rotationSpeed`: Speed of rotation
- `showAtmosphere`: Display atmosphere glow
- `showClouds`: Display cloud layer
- `showNightLights`: Show city lights on dark side

#### Appearance
- `globeColor`: Base color of globe
- `landColor`: Color of land masses
- `atmosphereColor`: Atmosphere glow color
- `markerColor`: Destination marker color
- `routeColor`: Flight route color

#### Glass Effects
- Tab and panel glass customization
- Tint levels: none, light, medium, dark
- Opacity, blur, and border styles

## Data Sources

In production, data should be fetched from Payload collections:
- Travel advisories from State Department API
- Visa requirements from visa database
- Michelin restaurants from restaurant collection
- Airport data from aviation database

Currently using mock data for demonstration.

## Performance Considerations

### WebGL Mode
- Uses shared canvas for optimal performance
- Single WebGL context shared across all blocks
- Simplified globe rendering for performance

### GlobeGL Mode
- Full-featured globe with all visualizations
- Higher resource usage but more capabilities
- Better for dedicated globe pages

### Optimization Tips
- Limit destination markers to visible viewport
- Use LOD (Level of Detail) for markers
- Implement virtualization for long lists
- Cache texture maps

## Responsive Behavior

### Desktop (>1024px)
- Full layout with side panels
- Globe centered with controls
- Detail overlay slides from right

### Tablet (768px-1024px)
- Narrower side panels
- Adjusted globe size
- Compact tab labels

### Mobile (<768px)
- Panels move to bottom
- Globe takes full width
- Touch-optimized controls
- Tab labels hidden (icons only)

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Screen reader announcements for state changes
- High contrast mode compatible

## Future Enhancements

- [ ] Real-time data integration
- [ ] Flight booking integration
- [ ] Weather overlay
- [ ] Tourist attraction markers
- [ ] User-generated content pins
- [ ] AR mode for mobile devices
- [ ] Voice control interface

## Troubleshooting

### Common Issues

1. **Globe not rendering**: Check WebGL support, ensure textures are loaded
2. **Performance issues**: Switch to WebGL mode, reduce marker count
3. **Data not loading**: Verify API endpoints, check CORS settings
4. **Glass effects not visible**: Ensure glass provider is initialized

### Debug Mode
Enable debug mode in console:
```javascript
localStorage.setItem('tdg_debug', 'true')
```

## Dependencies

- `react-globe.gl`: Globe visualization library
- `@turf/centroid`: Geographic calculations
- `three.js`: 3D graphics (via @react-three/fiber)
- `gsap`: Animation library
- Glass morphism system (custom)
- VerticalMarquee component

## License

Part of the Payload CMS template. See main project license.
