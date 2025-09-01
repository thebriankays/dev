# TravelDataGlobe Component

A React Three Fiber globe visualization component using r3f-globe for the shared canvas architecture.

## Features

- Interactive 3D globe with country polygons
- Travel advisory visualization with color-coded risk levels
- Visa requirements display with arc connections
- Michelin star restaurant markers
- Airport location markers
- Smooth animations and camera controls
- Glass morphism UI design

## Required Textures

The component requires the following texture files in the `public` folder:

1. **Globe Surface Texture** (`/earth-blue-marble.jpg`)
   - High-resolution Earth surface texture
   - Equirectangular projection
   - Already exists in public folder

2. **Bump Map Texture** (`/earth-topology.png`)
   - Grayscale height map for Earth's terrain
   - Creates 3D relief effect
   - Already exists in public folder

3. **Department of State Logo** (`/department-of-state.png`)
   - Used in the travel advisory panels
   - Already exists in public folder

4. **Michelin Guide Logo** (`/michelin-guide.png`)
   - Used in the restaurant panel
   - May need to be added if not present

5. **Country Flags** (`/flags/[country-code].svg`)
   - SVG flags for each country
   - Named by ISO 2-letter country codes (e.g., us.svg, gb.svg)
   - Some flags may already exist

## Usage

```typescript
import { TravelDataGlobe } from '@/webgl/components/globe/TravelDataGlobe'

<TravelDataGlobe
  polygons={polygonData}
  borders={borderData}
  airports={airportData}
  restaurants={restaurantData}
  globeImageUrl="/earth-blue-marble.jpg"
  bumpImageUrl="/earth-topology.png"
  autoRotateSpeed={0.5}
  atmosphereColor="#3a7ca5"
  atmosphereAltitude={0.15}
  onCountryClick={handleCountryClick}
  onAirportClick={handleAirportClick}
  onRestaurantClick={handleRestaurantClick}
  onCountryHover={handleCountryHover}
  selectedCountry={selectedCountry}
  hoveredCountry={hoveredCountry}
  currentView="travelAdvisory"
  visaArcs={visaArcs}
  showMarkers={showMarkers}
/>
```

## Props

- `polygons`: Array of country polygons (PolyAdv | VisaPolygon)
- `borders`: Country border data
- `airports`: Array of airport data
- `restaurants`: Array of Michelin restaurant data
- `globeImageUrl`: URL to globe surface texture
- `bumpImageUrl`: URL to bump map texture
- `autoRotateSpeed`: Globe auto-rotation speed
- `atmosphereColor`: Color of atmosphere glow
- `atmosphereAltitude`: Height of atmosphere effect
- `onCountryClick`: Handler for country clicks
- `onAirportClick`: Handler for airport clicks
- `onRestaurantClick`: Handler for restaurant clicks
- `onCountryHover`: Handler for country hover
- `selectedCountry`: Currently selected country name
- `hoveredCountry`: Currently hovered country name
- `currentView`: Current data view mode
- `visaArcs`: Array of visa requirement arcs
- `showMarkers`: Whether to show location markers

## Integration with Shared Canvas

This component is designed to work within the shared canvas architecture. It should be rendered inside a `<View>` component from `@react-three/drei` and wrapped with the `BlockWrapper` component for proper integration.