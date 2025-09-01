# AreaExplorer Component - Setup Instructions

## What Was Fixed

1. **Re-rendering Issues**: The component was re-creating the Cesium viewer on every keystroke. Now uses stable refs and `useImperativeHandle` pattern to prevent unnecessary re-renders.

2. **Debounced Search**: Added debouncing to prevent the search from firing on every letter typed.

3. **Auto-Rotate Fixed**: Properly integrated with Cesium's clock system using `onTick` event listeners instead of `requestAnimationFrame`.

4. **Camera Controls**: Added dynamic and fixed orbit modes with speed control slider.

5. **Place Types**: Added functionality to show POI markers for selected place types (restaurants, parks, museums, etc.).

## Installation Steps

1. **Install Missing Dependency**:
   ```bash
   pnpm add react-google-autocomplete
   ```

2. **Environment Variables**: 
   Make sure you have these in your `.env.local` file:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   NEXT_PUBLIC_CESIUM_ION_API_KEY=your_cesium_ion_token
   ```

3. **Google Maps API Configuration**:
   Ensure your Google Maps API key has these APIs enabled:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Google Maps 3D Tiles API (for photorealistic tiles)

4. **Cesium Ion Token** (Optional):
   If you don't have a Cesium Ion token, you can get a free one at:
   https://ion.cesium.com/tokens
   
   The component includes a default token, but it's recommended to use your own.

## New Features

### Camera Controls
- **Auto-Orbit Toggle**: Start/stop automatic camera rotation
- **Orbit Modes**: 
  - Dynamic: Camera moves up and down while rotating
  - Fixed: Camera maintains constant height
- **Speed Slider**: Control rotation speed (1-100)

### Place Types
Select place types to display as markers on the map:
- Restaurant
- Cafe
- Park
- Museum
- Lodging
- Store
- Tourist Attraction

### Search
- Debounced location search using Google Places Autocomplete
- Type a city, address, or landmark to fly to that location

## Files Modified

1. `/src/hooks/useDebounce.ts` - New debounce hook
2. `/src/components/CesiumViewer/CesiumViewer.tsx` - Refactored viewer component
3. `/src/components/CesiumViewer/index.ts` - Export file
4. `/src/components/AreaExplorer/index.tsx` - Refactored main component
5. `/src/components/AreaExplorer/area-explorer.scss` - Updated styles

## Usage

The component is now stable and should work without errors. The main improvements:

- No more "scene undefined" errors
- Smooth camera controls
- Working auto-rotate with adjustable speed
- Place markers that update based on location
- Responsive design with controls panel on the left

## Troubleshooting

If you still see errors:

1. **Clear browser cache and restart the dev server**:
   ```bash
   rm -rf .next
   pnpm dev
   ```

2. **Check API Keys**: Ensure both Google Maps and Cesium Ion API keys are properly set

3. **Check Console**: Look for any API errors related to Google Maps services

4. **Browser Compatibility**: Use a modern browser (Chrome, Firefox, Edge) with WebGL support
