# Complete 3D Maps Integration Setup

## Installation

Run the following command to install the missing dependency:

```bash
pnpm add react-google-autocomplete
```

## Components Overview

### 1. AreaExplorer Component (`/explore` routes)
- **Main route**: `/explore` - Free exploration with search
- **Destination route**: `/explore/[destination-slug]` - Explore specific destination
- **Features**:
  - Location search with Google Places Autocomplete
  - Dynamic/Fixed camera orbit modes
  - Adjustable rotation speed
  - Place type markers (restaurants, parks, museums, etc.)
  - Responsive controls panel

### 2. Storytelling Component (`/itinerary` routes)
- **Main route**: `/itinerary` - Default Paris demo
- **Custom route**: `/itinerary/[itinerary-slug]` - Custom travel itineraries
- **Features**:
  - Chapter-based navigation
  - Auto-play mode
  - Timeline navigation
  - Cover page with description
  - Admin integration

## Environment Variables

Add these to your `.env.local` file:

```env
# Google Maps API (Required)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Cesium Ion Token (Optional - default provided)
NEXT_PUBLIC_CESIUM_ION_API_KEY=your_cesium_ion_token
```

## Google Cloud Console Setup

Enable these APIs for your Google Maps API key:
1. **Maps JavaScript API** - Core mapping functionality
2. **Places API** - Location search and autocomplete
3. **Geocoding API** - Address to coordinates conversion
4. **Google Maps 3D Tiles API** - Photorealistic 3D tiles

## Files Created/Modified

### New Files:
- `/src/hooks/useDebounce.ts` - Debouncing hook
- `/src/components/CesiumViewer/CesiumViewer.tsx` - Refactored viewer
- `/src/components/CesiumViewer/index.ts` - Export file
- `/src/components/admin/ItineraryView.tsx` - Admin preview component

### Updated Files:
- `/src/components/AreaExplorer/index.tsx` - Fixed with all features
- `/src/components/AreaExplorer/area-explorer.scss` - New styles
- `/src/components/Storytelling/index.tsx` - Already configured
- `/src/app/(frontend)/explore/[[...slug]]/page.tsx` - Route handler
- `/src/app/(frontend)/itinerary/[[...slug]]/page.tsx` - Route handler

## Admin Portal Integration

### Creating a 3D Storytelling Itinerary:

1. **Go to Admin Panel** → Travel Itineraries → Create New
2. **Enable 3D Storytelling** - Toggle in sidebar
3. **Add Story Chapters**:
   - Title: Chapter name
   - Content: Narrative text
   - Coordinates: Set lat/lng
   - Camera options: Customize view angle
   - Duration: Time per chapter
4. **Configure Settings**:
   - Theme: Dark/Light
   - Auto-play options
   - Navigation controls
5. **View Itinerary**: Click "View 3D Storytelling" button in the admin panel

## Testing the Implementation

### Test AreaExplorer:
```bash
# Start dev server
pnpm dev

# Visit these URLs:
http://localhost:3000/explore                    # Free exploration
http://localhost:3000/explore/paris              # Specific destination (if exists)
```

### Test Storytelling:
```bash
# Visit these URLs:
http://localhost:3000/itinerary                  # Default Paris demo
http://localhost:3000/itinerary/your-slug        # Custom itinerary
```

## Features Comparison

| Feature | Google Example | Your Implementation |
|---------|---------------|---------------------|
| **AreaExplorer** | | |
| Location Search | ✅ | ✅ |
| Dynamic Orbit | ✅ | ✅ |
| Fixed Orbit | ✅ | ✅ |
| Speed Control | ✅ | ✅ |
| Place Types | ✅ | ✅ |
| Responsive UI | ✅ | ✅ |
| | | |
| **Storytelling** | | |
| Chapter Navigation | ✅ | ✅ |
| Auto-play | ✅ | ✅ |
| Timeline | ✅ | ✅ |
| Cover Page | ✅ | ✅ |
| Admin Integration | ❌ | ✅ |
| CMS Integration | ❌ | ✅ |

## Troubleshooting

### Common Issues:

1. **"Cannot read properties of undefined (reading 'scene')"**
   - Clear browser cache
   - Restart dev server: `rm -rf .next && pnpm dev`

2. **Places not showing**
   - Check Google Maps API key has Places API enabled
   - Verify API key in `.env.local`

3. **3D tiles not loading**
   - Enable Google Maps 3D Tiles API in Google Cloud Console
   - Check API key permissions

4. **Performance issues**
   - Use Chrome/Edge for best WebGL performance
   - Close other browser tabs
   - Check GPU acceleration is enabled

## API Keys

### Get Cesium Ion Token (Optional):
1. Go to https://ion.cesium.com/signup
2. Create free account
3. Go to Access Tokens
4. Copy default token or create new one

### Google Maps API Key:
1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable required APIs (listed above)
4. Create API key with restrictions

## Architecture Notes

### Component Structure:
- **CesiumViewer**: Core 3D map engine with imperative API
- **AreaExplorer**: UI controller for exploration features
- **Storytelling**: Chapter-based narrative controller
- **useDebounce**: Prevents excessive re-renders

### State Management:
- Uses React refs for stable viewer reference
- Debounced inputs prevent re-initialization
- `useImperativeHandle` for parent-child communication

### Performance Optimizations:
- Single viewer instance (no re-creates)
- Debounced search (500ms delay)
- Cesium clock integration for smooth animations
- Lazy loading of place markers

## Next Steps

1. **Customize Styling**: Modify SCSS files to match your brand
2. **Add Features**:
   - Weather overlays
   - Traffic information
   - Custom POI categories
   - Share functionality
3. **Optimize Performance**:
   - Implement view frustum culling
   - Add LOD (Level of Detail) controls
   - Cache frequently visited locations
4. **Enhance Admin**:
   - Visual chapter editor
   - Drag-drop reordering
   - Preview in admin panel
   - Batch import from CSV

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all API keys are set correctly
3. Ensure all required APIs are enabled
4. Test in incognito mode to rule out extensions

The implementation successfully replicates both Google examples with additional CMS integration for a complete travel agent platform.
