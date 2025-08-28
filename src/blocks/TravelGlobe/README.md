# TravelGlobe Block

A comprehensive, interactive 3D globe visualization component for displaying travel-related data.

## Features

### Data Views (Tabs)
1. **Travel Advisories** - Color-coded country risk levels (1-4)
2. **Visa Requirements** - Entry requirements by country  
3. **Michelin Restaurants** - Star-rated restaurant locations
4. **Major Airports** - International airports with flight routes

### Capabilities
- Full React Three Fiber implementation (works with shared canvas)
- GeoJSON country polygon rendering
- Interactive points and arcs
- Search functionality
- Details sidebar
- Auto-rotation
- Zoom/pan controls

## Data Sources

Currently using mock data. In production, connect to Payload collections:

### Travel Advisories Collection
```typescript
{
  countryCode: string      // ISO 2-letter code
  countryName: string  
  level: 1 | 2 | 3 | 4    // Risk level
  description: string
  updated: date
  risks: string[]
}
```

### Visa Requirements Collection  
```typescript
{
  countryCode: string
  countryName: string
  requirement: 'visa_free' | 'visa_on_arrival' | 'e_visa' | 'eta' | 'visa_required' | 'no_admission'
  duration: number        // Days allowed
  details: string
  cost: number
}
```

### Michelin Restaurants Collection
```typescript
{
  name: string
  city: string
  country: string
  latitude: number
  longitude: number
  stars: 1 | 2 | 3
  cuisine: string
  chef: string
  address: string
}
```

### Airports Collection
```typescript
{
  code: string           // IATA code
  name: string
  city: string
  country: string
  latitude: number
  longitude: number
  type: 'international' | 'domestic'
  terminals: number
  passengers: number     // Annual
}
```

## Required Textures

Place in `/public/textures/`:
- `earth-day.jpg` - Earth day texture
- `earth-topology.jpg` - Bump/elevation map
- `earth-night.jpg` - Night lights (optional)
- `earth-clouds.jpg` - Cloud layer (optional)

## GeoJSON Data

For country polygons, the component loads from:
- CDN: `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`
- Or place in `/public/data/countries.geojson`

## Usage

```typescript
<TravelGlobeComponent
  enabledViews={['travelAdvisory', 'visaRequirements', 'michelinRestaurants', 'airports']}
  initialView="travelAdvisory"
  globeSettings={{
    rotationSpeed: 0.5,
    showAtmosphere: true,
    atmosphereColor: '#3a7ca5'
  }}
  glassEffect={{
    enabled: true,
    variant: 'panel'
  }}
/>
```

## Styling

See `TravelGlobe.scss` for customization.

## Performance Notes

- Uses React Three Fiber with shared canvas architecture
- Polygons are triangulated on the fly (consider pre-processing for large datasets)
- Points and arcs are rendered as separate meshes for interactivity
- Auto-rotation can be disabled for better performance
