# TravelDataGlobeBlock

An interactive 3D globe visualization component for displaying travel-related data including travel advisories, visa requirements, Michelin restaurants, and airports.

## Overview

This block renders an interactive 3D globe using React Three Fiber with multiple data visualization layers:
- **Travel Advisories**: U.S. Department of State travel advisory levels (1-4) displayed as colored country polygons
- **Visa Requirements**: Interactive visa requirement visualization with arc connections
- **Michelin Restaurants**: Location markers for Michelin-starred restaurants worldwide
- **Airports**: International airport location markers

## Architecture

The component uses a shared canvas architecture where:
- The WebGL canvas is rendered at the root level
- UI components overlay the canvas with transparent backgrounds
- The globe is rendered using Three.js with React Three Fiber
- Data is loaded from GeoJSON files for country polygons

## File Structure

```
TravelDataGlobeBlock/
├── Component.wrapper.tsx    # Main component wrapper with state management
├── Component.tsx           # Server component for data fetching
├── types.ts               # TypeScript type definitions
├── styles.scss            # Component styles with glass morphism effects
└── README.md              # This file
```

## Key Features

### Visual Features
- **3D Earth Globe**: Textured sphere with bump mapping for terrain
- **Atmosphere Effect**: Subtle blue glow around the globe
- **Country Borders**: Color-coded based on advisory levels or visa requirements
- **Interactive Markers**: Clickable markers for restaurants and airports
- **Camera Animation**: Smooth camera transitions when selecting items
- **Auto-rotation**: Optional globe rotation when idle

### UI Components
- **Glass Panel**: Backdrop-filtered glass effect for the information panel
- **Tab Navigation**: Switch between different data views
- **Search Functionality**: Filter countries, restaurants, or airports
- **List Views**: Scrollable lists with country flags and status indicators
- **Detail Overlays**: Popup panels with detailed information

## Dependencies

- `@react-three/fiber`: React renderer for Three.js
- `@react-three/drei`: Useful helpers for React Three Fiber
- `three`: 3D graphics library
- `gsap`: Animation library for smooth transitions
- `@turf/centroid`: Geographic calculations
- `three-geojson-geometry`: Convert GeoJSON to Three.js geometries

## Data Sources

- **Travel Advisories**: U.S. Department of State API
- **Visa Requirements**: Passport visa requirement database
- **Michelin Restaurants**: Michelin Guide data
- **Airports**: International airport database
- **Country Polygons**: GeoJSON world map data (`/datamaps.world.json`)

## Styling

The component uses SCSS with:
- **CSS Grid**: For list item layouts to prevent text wrapping
- **Flexbox**: For component alignment
- **Glass morphism**: `backdrop-filter: blur()` for panel effects
- **Custom scrollbars**: Styled scrollbar for list containers
- **Responsive design**: Mobile-friendly layout adjustments

## Known Issues & Solutions

### Text Wrapping in Lists
- **Solution**: Uses CSS Grid with explicit column templates to ensure flag, text, and badges stay on one line

### Globe Texture Not Loading
- **Solution**: Ensure `/earth-blue-marble.jpg` and `/earth-topology.png` exist in the public folder

### White Background Issues
- **Solution**: Canvas containers use `background: transparent !important` in globals.css

### Performance
- **Solution**: Uses React.lazy() for code splitting and Suspense for loading states

## Configuration

The block accepts configuration through Payload CMS:
```typescript
{
  globeImageUrl: string         // Earth texture URL
  bumpImageUrl: string          // Bump map texture URL
  autoRotateSpeed: number       // Rotation speed (0 to disable)
  atmosphereColor: string       // Atmosphere glow color
  atmosphereAltitude: number    // Atmosphere size (0.1 - 0.3)
  enabledViews: string[]        // Which tabs to show
  initialView: string           // Default tab
}
```

## Usage

The component is integrated into Payload CMS as a block and can be added to any page through the admin interface.

## Recent Updates

- Fixed list item wrapping issues with CSS Grid layout
- Improved globe texture loading with drei's useTexture hook
- Added proper TypeScript types throughout
- Fixed atmosphere rendering with subtle glow effect
- Ensured canvas transparency in shared canvas architecture
- Added country flags to all list views
- Improved marker positioning and visibility