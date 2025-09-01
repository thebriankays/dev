# Fixing Cesium Rendering Errors - Complete Guide

## The Error
You're seeing "Request has failed" and "An error occurred while rendering" errors from Cesium. This is typically caused by:
1. Missing Cesium assets
2. Incorrect webpack configuration
3. Missing dependencies

## Solution Steps

### Step 1: Install Required Dependencies

Run these commands in your terminal:

```bash
# Install missing dependencies
pnpm add react-google-autocomplete
pnpm add -D copy-webpack-plugin

# Or run the install script:
bash install-dependencies.sh
```

### Step 2: Clear Build Cache

```bash
# Remove Next.js build cache
rm -rf .next
rm -rf public/cesium

# Clear node_modules if needed (optional)
rm -rf node_modules
pnpm install
```

### Step 3: Verify Environment Variables

Your `.env` file should have the Google Maps API key configured:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

Optionally, add a Cesium Ion token (not required, default is provided):
```
NEXT_PUBLIC_CESIUM_ION_API_KEY=your_cesium_token_here
```

### Step 4: Restart Development Server

```bash
pnpm dev
```

### Step 5: Test the Components

Open your browser and navigate to:
- http://localhost:3000/explore (AreaExplorer)
- http://localhost:3000/itinerary (Storytelling)

## What Was Fixed

### 1. CesiumViewer Component
- ✅ Added proper dynamic imports for Cesium
- ✅ Set CESIUM_BASE_URL for asset loading
- ✅ Added error boundaries and fallbacks
- ✅ Improved WebGL context handling
- ✅ Added proper cleanup on unmount

### 2. Next.js Configuration
- ✅ Added CopyPlugin to copy Cesium assets to public folder
- ✅ Configured webpack to handle Cesium's workers and assets
- ✅ Set proper fallbacks for Node.js modules

### 3. Error Handling
- ✅ Graceful fallback when 3D tiles fail
- ✅ Error display with helpful messages
- ✅ Console warnings instead of crashes

## If Errors Persist

### Check Browser Console
Look for specific error messages:

1. **"Failed to load resource: cesium/..."**
   - Cesium assets not copied properly
   - Solution: Restart dev server

2. **"Google Maps API key invalid"**
   - API key issues
   - Solution: Verify key in Google Cloud Console

3. **"WebGL not supported"**
   - Browser/GPU issues
   - Solution: Try Chrome/Edge, enable hardware acceleration

### Browser Requirements
- Use Chrome, Edge, or Firefox (latest versions)
- Enable WebGL and hardware acceleration
- Allow location permissions if prompted

### API Key Checklist
Ensure these APIs are enabled in Google Cloud Console:
- ✅ Maps JavaScript API
- ✅ Places API  
- ✅ Geocoding API
- ✅ Google Maps 3D Tiles API (Photorealistic)

### Alternative: Simplified Mode
If 3D tiles continue to fail, the component will automatically fall back to:
- Standard Cesium imagery (satellite view)
- Basic 3D terrain
- All other features remain functional

## File Changes Summary

### Modified Files:
1. `/src/components/CesiumViewer/CesiumViewer.tsx` - Fixed imports and error handling
2. `/next.config.mjs` - Added Cesium asset handling
3. Created install scripts for dependencies

### How It Works Now:
1. Cesium loads dynamically (avoiding SSR issues)
2. Assets are copied to `/public/cesium` on build
3. Fallback to standard imagery if 3D tiles fail
4. Proper cleanup prevents memory leaks

## Testing Checklist

After following the steps above:

- [ ] No console errors on page load
- [ ] 3D map renders (either Google tiles or Cesium default)
- [ ] Search box accepts input without errors
- [ ] Camera controls work (orbit, zoom, etc.)
- [ ] Place markers appear when selecting types
- [ ] Storytelling chapters navigate smoothly

## Performance Tips

1. **Close unnecessary browser tabs** - WebGL uses GPU resources
2. **Use production build for testing** - `pnpm build && pnpm start`
3. **Enable GPU acceleration** in browser settings
4. **Reduce place markers** if performance degrades

## Still Having Issues?

If problems persist after following all steps:

1. **Share the exact error message** from browser console
2. **Check Network tab** for failed requests
3. **Verify Node version** - use Node 18 or higher
4. **Try incognito mode** to rule out extensions

The implementation is now more robust with proper error handling and fallbacks. The Cesium rendering error should be resolved after following these steps.
