# TravelDataGlobe Component Documentation

## Overview
The TravelDataGlobe is a complex, interactive 3D globe visualization component that displays travel-related data including:
- Travel advisories (threat levels by country)
- Visa requirements between countries
- Michelin restaurants worldwide
- Major airports

## Component Origin & Migration History

### Original Version
- **Location**: `D:\Payload\payload-main` (old repository)
- **Architecture**: Each component had its own canvas (individual canvas per component)
- **Framework**: Older version of the website

### Current Version
- **Location**: `D:\Payload\dev` (current repository)
- **Architecture**: Shared canvas architecture (all WebGL components share a single canvas)
- **Migration Date**: Recent port from old architecture
- **Key Change**: Adapted from standalone canvas to shared canvas system

## Architecture

### Shared Canvas System
The component now works within a shared canvas architecture where:
1. A single WebGL canvas is rendered at the app level
2. Components use `ViewportRenderer` to render content to specific viewport areas
3. WebGL content is tunneled through React portals
4. The canvas is managed by the `SharedCanvasProvider`

### Component Structure
```
TravelDataGlobeBlock/
├── Component.tsx           # Server component - fetches data from Payload CMS
├── Component.client.tsx    # Client component - handles UI and interactions
├── types.ts               # TypeScript interfaces
├── styles.scss            # Component styles
└── README.md             # This file
```

### WebGL Components
```
webgl/components/globe/TravelDataGlobe/
├── TravelDataGlobe.tsx        # Main globe wrapper
├── TravelDataGlobeManual.tsx  # Three.js implementation
├── Atmosphere.tsx             # Atmosphere glow effect
├── Markers.tsx               # Airport/restaurant markers
├── Arcs.tsx                  # Visa connection arcs
├── Clouds.tsx                # Cloud layer
├── Countries.tsx             # Country polygons overlay
├── utils.ts                  # Utility functions
└── index.tsx                 # Exports
```

## Data Flow

### 1. Server-Side Data Fetching
```typescript
// Component.tsx fetches from Payload CMS collections:
- travel-advisories
- visa-requirements  
- michelin-restaurants
- airports
```

### 2. GeoJSON Data
- Loads country polygons from `/public/datamaps.world.json`
- Used for country boundaries and interaction

### 3. Data Transformation
- Server component transforms raw CMS data to component-specific formats
- Passes transformed data to client component

### 4. Client-Side Rendering
- Client component manages state and user interactions
- WebGL content rendered through shared canvas

## Known Issues & Fixes Applied

### 1. ✅ FIXED: Duplicate Key Errors
**Problem**: React duplicate key warnings for list items
**Solution**: Added unique key generation with prefixes and indices

### 2. ✅ FIXED: White Background/Canvas Issues
**Problem**: Component showing white background instead of transparent
**Solutions Applied**:
- Removed `<color attach="background" args={['transparent']} />` (THREE.js doesn't recognize 'transparent')
- Added `background: transparent !important` to all container styles
- Disabled glass effect by default
- Canvas configured with `alpha: true`

### 3. ✅ FIXED: Gray Circle Around Globe
**Problem**: Atmosphere effect too prominent
**Solution**: Reduced atmosphere intensity from 0.15 to 0.05

### 4. ⚠️ PARTIAL: Visa Data Loading
**Problem**: Shows "Loading visa data..." indefinitely
**Potential Causes**:
- Empty `visa-requirements` collection in database
- Data transformation issues
**Debug**: Check server console for logged data counts

### 5. ✅ FIXED: Advisory "New" Pill
**Problem**: Missing indicator for advisories added in last 30 days
**Solution**: Added date comparison logic and pill rendering

### 6. ✅ FIXED: Globe Spinning to Location
**Problem**: Globe not rotating to selected country
**Solution**: Implemented `focusOnLocation` method with camera animation

### 7. ✅ FIXED: Airport Markers
**Problem**: Showing text labels instead of pin markers
**Solution**: Replaced text with 3D pin/star markers with hover tooltips

### 8. ✅ FIXED: Advisory Text Display
**Problem**: Not showing full advisory text
**Solution**: Split text by newlines and render paragraphs

### 9. ✅ FIXED: Department of State Logo
**Problem**: Logo not visible in advisory details
**Solution**: Added logo as watermark in detail panel

### 10. ✅ FIXED: TypeScript/ESLint Errors
**Problem**: Multiple type safety issues
**Solution**: Properly typed all functions and removed 'any' types

## Dependencies

### Required Packages
```json
{
  "@react-three/fiber": "^9.3.0",
  "@react-three/drei": "^10.7.4",
  "three": "^0.160.0",
  "@fortawesome/react-fontawesome": "^3.0.1",
  "@turf/centroid": "^7.2.0"
}
```

### Payload Collections Required
1. **travel-advisories**
   - country (relationship)
   - threatLevel/level (number 1-4)
   - description/summary (text)
   - pubDate/updatedAt (date)

2. **visa-requirements**
   - country (relationship)
   - destinationCountry (text)
   - requirement (select: visa_free, visa_on_arrival, e_visa, visa_required)
   - duration (number)
   - details (text)

3. **michelin-restaurants**
   - name (text)
   - stars (number 1-3)
   - cuisine (text)
   - city (text)
   - country (relationship/text)
   - location (point/coordinates)
   - greenStar (boolean)

4. **airports**
   - name (text)
   - iataCode/code (text)
   - city (text)
   - country (relationship/text)
   - location (point/coordinates)

## Textures & Assets Required
```
/public/
├── earth-blue-marble.jpg    # Globe texture
├── earth-topology.png       # Bump map
├── clouds.png               # Cloud layer
├── earth-lights.jpg         # Specular map (optional)
├── department-of-state.png  # US State Dept logo
├── datamaps.world.json     # Country polygons GeoJSON
└── flags/                   # Country flag images
```

## Component Props

### BlockConfig
```typescript
{
  enabledViews: ['travelAdvisory', 'visaRequirements', 'michelinRestaurants', 'airports']
  initialView: 'travelAdvisory'
  globeImageUrl: '/earth-blue-marble.jpg'
  bumpImageUrl: '/earth-topology.png'
  autoRotateSpeed: 0.5
  atmosphereColor: '#3a7ca5'
  atmosphereAltitude: 0.15  // Deprecated
  enableGlassEffect: false
  marqueeText: "Sweet Serenity Getaways • 🦋 • Travel Tools • 🦋 •"
  tabIndicatorColor: '#81d6e3'
}
```

## CSS Classes & Styling

### Key Classes
- `.travel-data-globe-block` - Main wrapper
- `.tdg-container` - Container element
- `.tdg-tabs-container` - Tab navigation
- `.tdg-info-panel` - Side panels
- `.tdg-globe-wrapper` - Globe viewport
- `.tdg-detail-overlay` - Detail view overlay

### Transparency Fixes
All containers have `background: transparent !important` to ensure no white backgrounds

## Troubleshooting

### Issue: White Background Still Visible
1. Check parent components for background colors
2. Verify SharedCanvas has `alpha: true`
3. Add to global styles:
```scss
body, html, .layout, .main-content {
  background: transparent !important;
}
```

### Issue: No Visa Data Showing
1. Check server console for data count logs
2. Verify visa-requirements collection has data in Payload admin
3. Check data transformation in Component.tsx
4. Ensure country names match between collections

### Issue: Globe Not Rendering
1. Check browser console for WebGL errors
2. Verify textures are loading (Network tab)
3. Ensure SharedCanvas is properly initialized
4. Check if WebGL is enabled in browser

### Issue: Performance Problems
1. Reduce polygon complexity in datamaps.world.json
2. Lower atmosphere quality
3. Reduce marker count
4. Disable cloud layer
5. Lower autoRotateSpeed

## View Modes

### Travel Advisory
- Shows color-coded threat levels (1-4)
- Green = Safe, Yellow = Caution, Orange = Reconsider, Red = Do Not Travel
- Displays advisory text and date

### Visa Requirements
- Select passport country to see visa requirements
- Shows visa-free destinations with arc connections
- Color codes: Green = Visa Free, Light Green = On Arrival, Blue = e-Visa, Red = Required

### Michelin Restaurants
- Star ratings (1-3 stars)
- Green star for sustainability
- Filterable by name, city, country, cuisine

### Airports
- Major airports with IATA codes
- Interactive pins with hover details
- Searchable by name, code, city, country

## Future Improvements

1. **Performance**
   - Implement LOD (Level of Detail) for polygons
   - Add WebWorker for data processing
   - Implement virtual scrolling for lists

2. **Features**
   - Add flight path animations
   - Real-time flight tracking
   - Weather overlay
   - Time zone display
   - Save favorite locations

3. **Data**
   - Integration with live APIs
   - Historical data comparison
   - Predictive analytics
   - User reviews/ratings

## Debug Mode

Add to Component.tsx for debugging:
```typescript
console.log('TravelDataGlobe Debug:', {
  visaCount: transformedData.visaRequirements?.length,
  advisoryCount: transformedData.travelAdvisories?.length,
  airportCount: transformedData.airports?.length,
  restaurantCount: transformedData.restaurants?.length
})
```

## Contact & Support

This component was ported and extensively debugged during the migration from the old architecture to the new shared canvas system. For questions about the shared canvas architecture, refer to the main project documentation.

Last Updated: Current Session
Migration Status: Complete with known issues documented
