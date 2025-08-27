import type { CollectionAfterChangeHook } from 'payload'

export const cachePOIData: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  previousDoc,
}) => {
  // Only run on create or when coordinates change
  if (operation === 'update') {
    const coordsChanged = 
      previousDoc?.locationData?.coordinates?.lat !== doc?.locationData?.coordinates?.lat ||
      previousDoc?.locationData?.coordinates?.lng !== doc?.locationData?.coordinates?.lng ||
      previousDoc?.lat !== doc?.lat ||
      previousDoc?.lng !== doc?.lng

    if (!coordsChanged) return doc
  }

  // Get coordinates
  const lat = doc?.locationData?.coordinates?.lat || doc?.lat
  const lng = doc?.locationData?.coordinates?.lng || doc?.lng

  if (!lat || !lng) return doc

  // Determine if 3D features are enabled
  const needs3DData = doc?.enable3DMap || doc?.areaExplorerConfig?.showPOIs

  if (!needs3DData) return doc

  try {
    // Cache POI data in the background
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return doc

    const radius = doc?.areaExplorerConfig?.searchRadius || 2000
    const poiTypes = doc?.areaExplorerConfig?.poiTypes || ['tourist_attraction', 'restaurant', 'lodging']

    // We'll use a simple fetch here, but in production you might want to use a job queue
    const cacheKey = `poi-${lat.toFixed(6)}-${lng.toFixed(6)}-r${radius}`
    
    // Check if we already have fresh cache
    const { payload } = req
    const existingCache = await payload.find({
      collection: 'map-data-cache',
      where: {
        cacheKey: { equals: cacheKey },
        expiresAt: { greater_than: new Date().toISOString() },
      },
      limit: 1,
    })

    if (existingCache.docs.length > 0) {
      // Cache is fresh, update the cached date
      await payload.update({
        collection: 'destinations',
        id: doc.id,
        data: {
          poiDataCachedAt: new Date().toISOString(),
        },
      })
      return doc
    }

    // Fetch POI data asynchronously
    const fetchPOIData = async () => {
      const allPlaces: any[] = []
      
      for (const type of poiTypes) {
        try {
          const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`
          const response = await fetch(placesUrl)
          
          if (response.ok) {
            const placesData = await response.json()
            if (placesData.results) {
              allPlaces.push(...placesData.results)
            }
          }
        } catch (error) {
          console.error(`Error fetching POI data for type ${type}:`, error)
        }
      }

      if (allPlaces.length > 0) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30) // Cache for 30 days

        try {
          // Create new cache entry
          await payload.create({
            collection: 'map-data-cache',
            data: {
              destinationId: String(doc.id),
              cacheKey,
              dataType: 'places-nearby',
              coordinates: { lat, lng },
              searchParams: { radius, types: poiTypes },
              data: allPlaces,
              expiresAt: expiresAt.toISOString(),
            },
          })
          
          // Update the destination with cache date
          await payload.update({
            collection: 'destinations',
            id: doc.id,
            data: {
              poiDataCachedAt: new Date().toISOString(),
            },
          })
          
          console.log(`Cached ${allPlaces.length} POIs for destination ${doc.title}`)
        } catch (error) {
          console.error('Error saving POI cache:', error)
        }
      }
    }

    // Execute in background (non-blocking)
    fetchPOIData().catch(error => {
      console.error('Background POI caching failed:', error)
    })

  } catch (error) {
    console.error('Error in POI caching hook:', error)
  }

  return doc
}