# Flight Tracker Component

A real-time flight tracking component for Payload CMS that displays live aircraft data using the OpenSky Network API with OAuth2 authentication, IP-based geolocation, FlightAware data enrichment, and smooth GSAP animations.

## Features

### Core Functionality
- **Real-time Flight Tracking**: Live aircraft positions updated every 30-60 seconds
- **Smooth Animations**: GSAP-powered animations for fluid aircraft movement (60fps)
- **IP-Based Geolocation**: Automatic map centering without browser permission prompts
- **OAuth2 Authentication**: Higher rate limits with OpenSky Network API
- **Weather Integration**: Real-time weather data for origin and destination airports
- **FlightAware Scraping**: Enhanced flight details including gates, times, and progress

### User Interface
- **Interactive Map**: Mapbox GL JS with 2D view
- **Flight Selection**: Click any aircraft to view detailed information
- **Flight Routes**: Display great circle routes for selected flights only
- **Flight Search**: Search for specific flights by callsign
- **Responsive Design**: Mobile-friendly layout with overlay controls
- **Progress Indicators**: Real-time flight progress with distance and time remaining

### Data Sources
1. **OpenSky Network API**: Real-time aircraft positions with OAuth2
2. **FlightAware Scraper**: Detailed flight information with 5-minute cache
3. **OpenWeatherMap API**: Current weather conditions at airports
4. **IP-API**: IP-based geolocation for initial map positioning
5. **Seeded Database**: Airlines, airports, and routes data

## Installation

### Prerequisites
```bash
# Required environment variables in .env
OPENSKY_CLIENT_ID=your-client-id
OPENSKY_CLIENT_SECRET=your-client-secret
OPENWEATHERMAP_API_KEY=your-api-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token  # Optional, has fallback
```

### Dependencies
```bash
pnpm add mapbox-gl @types/mapbox-gl gsap @gsap/react @turf/turf cheerio got-scraping node-cache
```

### Database Setup
```bash
# Seed the database with airlines, airports, and routes
pnpm seed
```

## Usage

### Basic Implementation
```tsx
import FlightTracker from '@/components/FlightTracker'

export default function FlightPage() {
  return (
    <FlightTracker
      enableSearch={true}
      defaultLocation={{ lat: 40.7128, lng: -74.0060 }}
      searchRadius={2}
    />
  )
}
```

### Component Props
```typescript
interface FlightTrackerProps {
  enableSearch?: boolean       // Show search input (default: true)
  enableGeolocation?: boolean   // Use IP geolocation (default: true) 
  defaultLocation?: {           // Fallback coordinates (default: NYC)
    lat: number
    lng: number
  }
  searchRadius?: number        // Search area in degrees (default: 2)
}
```

## Architecture

### Client-Side
- **FlightTracker.tsx**: Main component with state management
- **MapboxMap.tsx**: Mapbox GL integration with GSAP animations
- **FlightCard.tsx**: Detailed flight information display
- **FlightSearch.tsx**: Search input component
- **types.ts**: TypeScript interfaces

### Server-Side API Routes
- `/api/flights`: OpenSky Network API with OAuth2 (cached)
- `/api/flights/flightaware`: FlightAware scraper (5-min cache)
- `/api/geolocation`: IP-based geolocation service
- `/api/weather`: OpenWeatherMap integration
- `/api/flights/search`: Flight search endpoint

### Animation System
The component uses GSAP for smooth animations:
1. **Position Prediction**: Calculates future position based on velocity
2. **Interpolation**: Smooth movement between API updates
3. **Frame Rate**: 60fps animation independent of API polling
4. **Marker Management**: Efficient DOM updates with refs

### Caching Strategy
- **OpenSky API**: 30-45 second cache based on auth status
- **FlightAware**: 5-minute cache for scraped data
- **Weather Data**: 5-minute cache
- **Database**: Persistent storage for enriched data

## Recent Updates (2024)

### Fixed Issues
1. ✅ **No More Geolocation Prompts**: IP-based location detection
2. ✅ **Instant Flight Loading**: Fixed 2-3 minute delay
3. ✅ **Smooth Plane Movement**: GSAP animations instead of jumping
4. ✅ **Route Display**: Only shows for selected flight
5. ✅ **Weather Integration**: Real-time weather at airports
6. ✅ **Complete Flight Details**: All times, gates, and progress
7. ✅ **Removed Aircraft Photos**: Using airline logos instead

### Technical Improvements
- Proper TypeScript types with strict checking
- React hooks best practices
- Memory leak prevention
- Error boundaries for stability
- Performance optimizations

## Flight Card Display

The flight card shows comprehensive information:

### Flight Summary
- Airline logo and name
- Flight callsign
- Route (origin → destination)
- Current status

### Departure & Arrival Times
- Gate departure/arrival times
- Takeoff/landing times
- Scheduled vs actual times
- Taxi times
- Average delays

### Flight Progress
- Distance flown and remaining
- Time elapsed and remaining
- Visual progress bar with plane icon
- Total travel time

### Weather Information
- Origin and destination weather
- Temperature and conditions
- Weather icons

### Technical Data
- Altitude, speed, heading
- Vertical rate
- ICAO24 and squawk codes
- Aircraft type and registration

## API Rate Limits

### OpenSky Network
- **Anonymous**: 400 credits/day, 10-second resolution
- **Authenticated**: 4000-8000 credits/day, 5-second resolution
- **Credit Usage**: Based on search area (1-4 credits per request)

### FlightAware
- Web scraping with 5-minute cache
- Falls back to mock data if blocked

### OpenWeatherMap
- 60 calls/minute (free tier)
- 1000 calls/day

## Performance Optimizations

1. **Dynamic Imports**: Code splitting for map components
2. **Memoization**: React.memo for expensive components
3. **Batch Updates**: Grouped state updates
4. **Efficient Markers**: Reuse DOM elements
5. **Smart Polling**: Adaptive intervals based on auth
6. **Local Lookups**: Database queries for static data

## Troubleshooting

### Common Issues

1. **Flights not appearing**
   - Check OpenSky credentials in .env
   - Verify API rate limits not exceeded
   - Check browser console for errors

2. **Jerky animations**
   - Ensure GSAP is properly installed
   - Check browser performance
   - Verify no conflicting CSS animations

3. **FlightAware data missing**
   - Normal for many flights
   - Check if scraper is being blocked
   - Falls back to mock data automatically

4. **Map not loading**
   - Verify Mapbox token (or use default)
   - Check internet connection
   - Clear browser cache

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Requires WebGL support

## Future Enhancements
- [ ] WebSocket for real-time updates
- [ ] Flight history and replay
- [ ] Airport detail overlays
- [ ] Multiple map providers
- [ ] 3D globe view at low zoom
- [ ] Flight path predictions
- [ ] Airline statistics

## License
Proprietary - All rights reserved

## Credits
- OpenSky Network - Real-time flight data
- FlightAware - Flight details and tracking
- Mapbox - Interactive maps
- GSAP - Animation engine
- OpenWeatherMap - Weather data
