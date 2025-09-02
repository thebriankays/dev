# TravelDataGlobe Block

A comprehensive interactive 3D globe component for visualizing travel data including:
- U.S. Travel Advisories with threat levels
- Visa requirements between countries
- Michelin restaurants worldwide
- International airports

## Architecture

This block follows the shared canvas architecture using:
- `BlockWrapper` for WebGL content tunneling
- React Three Fiber (R3F) for 3D rendering
- View-based rendering for proper canvas sharing
- Dynamic imports for optimal loading

## File Structure

```
TravelDataGlobeBlock/
├── Component.tsx           # Server component (data fetching)
├── Component.client.tsx    # Client component (UI & interactions)
├── types.ts               # TypeScript type definitions
├── styles.scss            # Component styles
├── components/
│   ├── AdvisoryPanel.tsx # Travel advisory list panel
│   └── AdvisoryDetails.tsx # Advisory detail overlay
└── README.md              # This file
```

## Data Flow

1. **Server Component** (`Component.tsx`):
   - Fetches data from Payload CMS collections
   - Transforms data to match component requirements
   - Passes data to client component

2. **Client Component** (`Component.client.tsx`):
   - Manages UI state (selected country, view, etc.)
   - Renders info panels and tabs
   - Passes WebGL content to BlockWrapper

3. **WebGL Component** (`TravelDataGlobe`):
   - Renders 3D globe with countries
   - Handles interactions (hover, click)
   - Shows visa arcs and markers

## Key Features

### Travel Advisories
- Color-coded threat levels (1-4)
- NEW pill for recent advisories (< 30 days)
- Flag display for each country
- Full advisory text with State Department branding

### Visa Requirements
- Shows all countries with visa data (199 countries)
- Passport country selection
- Arc visualization for visa-free/on-arrival destinations
- Color-coded visa requirements

### Interactive Globe
- Country polygons with proper colors
- Hover effects
- Click to select and spin to location
- Marker drops on selected country
- Cloud layer animation

## Usage

The block is used via BlockWrapper which handles:
- WebGL content tunneling
- View tracking for canvas sharing
- Glass effects (optional)
- Interactive pointer events

```tsx
<BlockWrapper 
  webglContent={webglContent}
  interactive={true}
  disableDefaultCamera={true}
>
  {/* UI content */}
</BlockWrapper>
```

## Important Notes

1. **DO NOT use ViewportRenderer** - BlockWrapper handles View tracking
2. **Globe textures** must be in `/public`:
   - `/earth-blue-marble.jpg`
   - `/earth-topology.jpg`
   - `/clouds.png`
3. **Flags** should be in `/public/flags/`
4. **State Department logo** at `/public/department-of-state.png`

## Troubleshooting

### White Canvas Issue
- Ensure using BlockWrapper's webglContent prop
- Don't duplicate View components
- Check SharedCanvas clear settings

### Countries Not Showing
- Verify polygon data is loaded
- Check texture loading
- Ensure Countries component is rendering

### Only 6 Visa Countries
- This was fixed by showing ALL countries in visa data
- Previously only showed passport countries
- Now displays 199 countries

### Performance
- Globe uses dynamic import for code splitting
- Textures loaded asynchronously
- Post-processing effects can be adjusted

## Dependencies

- `@react-three/fiber` - R3F core
- `@react-three/drei` - R3F helpers
- `@react-three/postprocessing` - Effects
- `three` - Three.js
- `gsap` - Animations
