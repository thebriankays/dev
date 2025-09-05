# Travel Data Globe Components

Reusable React components for the Travel Data Globe visualization system.

## Components

### AdvisoryPanel
`AdvisoryPanel.tsx`

Displays U.S. State Department travel advisories with filtering and sorting capabilities.

**Features:**
- Search by country name
- Filter by advisory level (1-4)
- Sort by country name or level
- Expandable details with full text
- NEW badge for recent advisories
- Published date display

**Props:**
```typescript
interface AdvisoryPanelProps {
  advisories: AdvisoryCountry[]
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCountry: string | null
  onCountryClick: (advisory: AdvisoryCountry) => void
}
```

### VisaPanel
`VisaPanel.tsx`

Shows visa requirements for different passport countries.

**Features:**
- Search functionality
- Country selection
- Visa-free destination count
- Flag display

**Props:**
```typescript
interface VisaPanelProps {
  countries: CountryVisaData[]
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCountry: string | null
  onCountryClick: (country: CountryVisaData) => void
}
```

### RestaurantPanel  
`RestaurantPanel.tsx`

Lists Michelin-starred restaurants with ratings and locations.

**Features:**
- Search by restaurant or location
- Star rating display (1-3 stars)
- Green star indicator for sustainability
- Location information

**Props:**
```typescript
interface RestaurantPanelProps {
  restaurants: MichelinRestaurantData[]
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedRestaurant: MichelinRestaurantData | null
  onRestaurantClick: (restaurant: MichelinRestaurantData) => void
}
```

### AirportPanel
`AirportPanel.tsx`

Displays international airports with filtering options.

**Features:**
- Search by airport name or code
- Filter international airports only
- Location coordinates
- Airport code display

**Props:**
```typescript
interface AirportPanelProps {
  airports: AirportData[]
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedAirport: AirportData | null
  onAirportClick: (airport: AirportData) => void
  showInternationalOnly: boolean
  onFilterChange: (show: boolean) => void
}
```

### AdvisoryDetails
`AdvisoryDetails.tsx`

Detailed view component for individual travel advisories.

**Features:**
- Full advisory text display
- Level indicator with color coding
- Published date
- Close button functionality

**Props:**
```typescript
interface AdvisoryDetailsProps {
  advisory: AdvisoryCountry
  onClose: () => void
}
```

### VisaDetails
`VisaDetails.tsx`

Detailed view for visa requirements of a selected country.

**Features:**
- Visa statistics (free, on arrival, eVisa, required)
- Requirement breakdown by destination
- Visual indicators for different visa types

**Props:**
```typescript
interface VisaDetailsProps {
  country: CountryVisaData
  onClose: () => void
}
```

## Usage Example

```tsx
import { AdvisoryPanel } from '@/components/TravelDataGlobe/AdvisoryPanel'

function MyComponent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  
  return (
    <AdvisoryPanel
      advisories={advisoryData}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedCountry={selectedCountry}
      onCountryClick={(advisory) => setSelectedCountry(advisory.country)}
    />
  )
}
```

## Styling

All components use shared styles from the parent block's `styles.scss`:
- Dark theme with glassmorphism effects
- Consistent color coding for advisory levels
- Smooth animations and transitions
- Custom scrollbars

### Color Scheme

Advisory Levels:
- Level 1: `#4caf50` (Green)
- Level 2: `#ffb300` (Yellow)
- Level 3: `#f4511e` (Orange)
- Level 4: `#ef4444` (Red)

UI Colors:
- Primary: `#81d6e3` (Cyan)
- Text: `#e2e8f0` (Light gray)
- Background: `rgba(20, 20, 20, 0.95)` (Dark)

## Component Architecture

All panels follow a consistent structure:
1. Search input at top
2. Filter/sort controls (where applicable)
3. Scrollable list of items
4. Expandable details on click
5. Visual indicators for status/type

## Performance Optimizations

- Memoized filtering and sorting operations
- Virtualized scrolling for large lists
- Debounced search input
- Lazy loading of detail content

## Accessibility

- Keyboard navigation support
- ARIA labels and roles
- Focus management
- High contrast text

## Testing

Components include:
- Type safety with TypeScript
- Prop validation
- Error boundaries for graceful failures

## Future Improvements

- Virtualized lists for better performance with large datasets
- Skeleton loading states
- Error states and retry logic
- Pagination for large result sets
- Export functionality
- Print-friendly views

## Dependencies

- React 18+
- TypeScript
- FontAwesome Icons
- Next.js Image component

## Contributing

When adding new panels:
1. Follow existing naming conventions
2. Implement consistent prop interface
3. Use shared styling classes
4. Include search and filter capabilities
5. Add proper TypeScript types
6. Update this README

## License

Proprietary - All rights reserved
