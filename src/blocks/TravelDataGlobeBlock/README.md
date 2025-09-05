# Travel Data Globe Block

An interactive 3D globe visualization for displaying travel advisories, visa requirements, Michelin restaurants, and international airports.

## Features

- **Interactive 3D Globe**: WebGL-powered globe with rotation and zoom controls
- **Travel Advisories**: U.S. State Department travel advisory levels (1-4) with detailed information
- **Visa Requirements**: Global visa requirements for different passport countries
- **Michelin Restaurants**: Locations and ratings of Michelin-starred restaurants worldwide
- **International Airports**: Major international airports with location data
- **Dynamic UI**: Collapsible panels, searchable lists, and responsive design
- **Tab Navigation**: Smooth switching between different data views with animated toggle

## Components

### Main Components
- `Component.tsx` - Main block component with data fetching
- `Component.wrapper.tsx` - Client-side wrapper with state management
- `config.ts` - Block configuration and field definitions
- `styles.scss` - Complete styling for the block

### Data Types
- `types.ts` - TypeScript interfaces for all data structures

### Features
- **Filtering & Sorting**: 
  - Filter advisories by level (1-4)
  - Sort by country name or advisory level
  - Search functionality across all data types

- **Visual Indicators**:
  - Color-coded advisory levels
  - NEW badge for recent advisories
  - Country flags
  - Michelin star ratings

- **Responsive Design**:
  - Collapsible side panels
  - Mobile-friendly layout
  - Adaptive globe sizing

## Usage

```typescript
import TravelDataGlobeBlock from '@/blocks/TravelDataGlobeBlock'

// In your page component
<TravelDataGlobeBlock {...blockData} />
```

## Data Sources

- **Travel Advisories**: Fetched from `/api/global-travel-data/advisories`
- **Visa Requirements**: Fetched from `/api/global-travel-data/visa-requirements`
- **Michelin Restaurants**: Fetched from `/api/global-travel-data/michelin-restaurants` 
- **Airports**: Fetched from `/api/global-travel-data/airports`
- **GeoJSON**: World borders from `/datamaps.world.json`

## Styling

The block uses SCSS with CSS variables for theming:
- Dark glassmorphic panels
- Smooth animations and transitions
- Custom scrollbars
- Responsive typography

## Key Features

### Advisory Panel
- Expandable accordion items
- Published date at top of details
- Full text display (no truncation)
- Level-based color coding

### Tab System
- Glass morphism design inspired by the codepen example
- Smooth toggle animation
- Active state indication
- Icon and label for each tab

### Globe Interaction
- Click countries to view details
- Hover for country names
- Zoom with scroll
- Rotate with mouse drag
- Focus animation to selected locations

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

Requires WebGL support for 3D globe rendering.

## Performance Considerations

- Globe uses React Three Fiber for optimized WebGL rendering
- Data is fetched once on component mount
- Memoized computations for filtering and sorting
- Lazy loading of globe component

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- High contrast text on dark backgrounds
- Readable font sizes and spacing

## Configuration

The block accepts configuration through the CMS:
- Initial view selection
- Auto-rotate speed
- Globe texture URLs
- Atmosphere color and altitude
- Enabled data views

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Dependencies

- React 18+
- Three.js / React Three Fiber
- FontAwesome icons
- Next.js Image component
- TypeScript

## Future Enhancements

- Real-time data updates
- Additional data layers (weather, flights, etc.)
- Export functionality
- User preferences persistence
- Multi-language support

## License

Proprietary - All rights reserved
