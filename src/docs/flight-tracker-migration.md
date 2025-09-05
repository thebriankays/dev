# FlightTracker Migration Guide

## Migrating from Old Implementation to New Architecture

This guide helps you migrate from the previous FlightTracker implementation to the new GSAP-powered, fully-featured version.

## Breaking Changes

### 1. Component Props
**Old:**
```typescript
interface FlightTrackerProps {
  userLocation?: { lat: number; lng: number }
  mapProvider?: 'mapbox' | 'leaflet'
}
```

**New:**
```typescript
interface FlightTrackerProps {
  enableSearch?: boolean
  enableGeolocation?: boolean  // Now IP-based, no permissions
  defaultLocation?: Coordinates
  searchRadius?: number
}
```

### 2. API Endpoints
**Old:** `/api/flights/flightstats`  
**New:** `/api/flights` (OpenSky with OAuth2)

**Old:** Browser geolocation  
**New:** `/api/geolocation` (IP-based)

### 3. Flight Data Structure
**Old:**
```typescript
interface Flight {
  // Basic fields only
  icao24: string
  callsign: string
  latitude: number
  longitude: number
}
```

**New:**
```typescript
interface Flight {
  // All old fields plus:
  display_longitude?: number  // GSAP animated position
  display_latitude?: number   // GSAP animated position
  predicted_position?: {...}  // Calculated future position
  originAirport?: AirportData // Full airport object
  destinationAirport?: AirportData
  // FlightAware enriched data:
  gateDepartureTime?: string
  takeoffTime?: string
  landingTime?: string
  gateArrivalTime?: string
  elapsedTime?: string
  remainingTime?: string
  weatherOrigin?: any
  weatherDestination?: any
}
```

## Step-by-Step Migration

### Step 1: Update Environment Variables
```bash
# Remove old:
FLIGHTSTATS_APP_ID=xxx
FLIGHTSTATS_APP_KEY=xxx

# Add new:
OPENSKY_CLIENT_ID=xxx
OPENSKY_CLIENT_SECRET=xxx
OPENWEATHERMAP_API_KEY=xxx
```

### Step 2: Install New Dependencies
```bash
# Remove old packages
pnpm remove flightstats-api leaflet react-leaflet

# Add new packages
pnpm add gsap @gsap/react cheerio got-scraping node-cache
```

### Step 3: Update Component Usage
**Old:**
```tsx
<FlightTracker
  userLocation={userLocation}
  mapProvider="mapbox"
/>
```

**New:**
```tsx
<FlightTracker
  enableSearch={true}
  enableGeolocation={true}  // IP-based, no prompts
  defaultLocation={{ lat: 40.7128, lng: -74.0060 }}
  searchRadius={2}
/>
```

### Step 4: Update Data Fetching
**Old:**
```typescript
// Manual geolocation request
navigator.geolocation.getCurrentPosition(...)

// Direct API calls
fetch('https://api.flightstats.com/...')
```

**New:**
```typescript
// Automatic IP geolocation
const location = await fetch('/api/geolocation')

// Proxied API with caching
const flights = await fetch('/api/flights?lat=...')
```

### Step 5: Update Animation Logic
**Old (Jerky Updates):**
```typescript
// Direct position updates
marker.setLngLat([flight.longitude, flight.latitude])
```

**New (Smooth GSAP):**
```typescript
// GSAP handles interpolation
gsap.to(animatedPos, {
  lat: predictedPosition.lat,
  lng: predictedPosition.lng,
  duration: 30,
  ease: "none",
  onUpdate: () => marker.setLngLat([animatedPos.lng, animatedPos.lat])
})
```

### Step 6: Update Flight Selection
**Old:**
```typescript
// All routes shown by default
flights.forEach(flight => drawRoute(flight))
```

**New:**
```typescript
// Route only for selected flight
if (selectedFlight) {
  drawRoute(selectedFlight)
}
```

### Step 7: Update Styles
**Old:**
```scss
.flight-tracker-card {
  width: 350px;
  // Limited styling
}
```

**New:**
```scss
.flight-tracker-card {
  width: 450px;
  // Enhanced sections:
  &__progress { /* Progress bar */ }
  &__weather { /* Weather display */ }
  &__times { /* Departure/arrival times */ }
}
```

## Database Migration

### 1. Run Updated Seed
```bash
pnpm seed:openflights
```

### 2. Create Flight Cache Collection
```typescript
// payload.config.ts
collections: [
  // ... existing collections
  {
    slug: 'flight-cache',
    fields: [
      { name: 'flightCode', type: 'text', required: true },
      { name: 'rawData', type: 'json' },
      { name: 'cacheExpiry', type: 'date' },
      // ... other fields
    ]
  }
]
```

## API Migration

### Replace FlightStats with OpenSky
**Old Route:**
```typescript
// api/flights/flightstats/route.ts
export async function GET(request) {
  const response = await fetch('https://api.flightstats.com/...')
  // ...
}
```

**New Route:**
```typescript
// api/flights/route.ts
export async function GET(request) {
  const token = await getOAuthToken()
  const response = await fetch('https://opensky-network.org/api/states/all', {
    headers: { Authorization: `Bearer ${token}` }
  })
  // ...
}
```

### Add New API Routes
Create these new files:
- `api/geolocation/route.ts` - IP-based location
- `api/weather/route.ts` - Weather data
- `api/flights/flightaware/route.ts` - Enhanced scraper

## Common Issues & Solutions

### Issue: Flights Not Loading
**Solution:** Check OpenSky OAuth2 credentials in .env

### Issue: Jerky Movement
**Solution:** Ensure GSAP is properly imported and animations are initialized

### Issue: All Routes Showing
**Solution:** Update logic to only show selectedFlightRoute

### Issue: No Weather Data
**Solution:** Add OPENWEATHERMAP_API_KEY to .env

### Issue: FlightAware Mock Data
**Solution:** This is normal due to scraping protection; the system falls back gracefully

## Performance Improvements

### Before
- 2-3 minute initial load time
- Jerky, teleporting aircraft
- All routes rendered (performance hit)
- Browser permission prompts

### After
- Instant initial load
- Smooth 60fps animations
- Single route rendering
- No permission prompts

## Testing the Migration

### 1. Verify Data Sources
```typescript
// Check OpenSky connection
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://opensky-network.org/api/states/all?lamin=45&lomin=-10&lamax=50&lomax=5"

// Check IP geolocation
curl http://localhost:3000/api/geolocation

// Check weather
curl "http://localhost:3000/api/weather?lat=40.7128&lng=-74.0060"
```

### 2. Test Core Features
- [ ] Map loads without permission prompts
- [ ] Flights appear immediately
- [ ] Planes move smoothly
- [ ] Click plane shows route
- [ ] Flight card displays all data
- [ ] Weather shows for airports
- [ ] Search finds flights

### 3. Performance Checks
- [ ] Animation at 60fps
- [ ] API calls cached properly
- [ ] Memory usage stable
- [ ] No console errors

## Rollback Plan

If you need to rollback:

1. Restore old component files from git
2. Restore old environment variables
3. Remove new dependencies
4. Clear browser cache
5. Restart development server

## Support

For migration assistance:
- Check console for detailed error messages
- Review network tab for API failures
- Verify all environment variables are set
- Ensure database is properly seeded

## Conclusion

The new FlightTracker offers significant improvements:
- Better user experience (no prompts, smooth animations)
- More comprehensive data (weather, times, progress)
- Better performance (caching, GSAP)
- More reliable (fallbacks, error handling)

The migration requires updating several components but results in a professional-grade flight tracking system.
