import type { CollectionAfterChangeHook } from 'payload'
import type { Destination } from '@/payload-types'

export const cacheAreaExplorerData: CollectionAfterChangeHook<Destination> = async ({
  doc,
  req,
  previousDoc,
  operation,
}) => {
  // Only cache if 3D map is enabled and coordinates are available
  if (!doc.enable3DMap) {
    return doc
  }

  // Skip if document doesn't have an ID yet (not saved)
  if (!doc.id) {
    return doc
  }

  const lat = doc.locationData?.coordinates?.lat || doc.lat
  const lng = doc.locationData?.coordinates?.lng || doc.lng

  if (!lat || !lng) {
    return doc
  }

  // Check if coordinates or POI settings have changed
  const coordsChanged = operation === 'create' || 
    previousDoc?.lat !== doc.lat || 
    previousDoc?.lng !== doc.lng ||
    previousDoc?.locationData?.coordinates?.lat !== doc.locationData?.coordinates?.lat ||
    previousDoc?.locationData?.coordinates?.lng !== doc.locationData?.coordinates?.lng

  const configChanged = operation === 'create' ||
    JSON.stringify(previousDoc?.areaExplorerConfig) !== JSON.stringify(doc.areaExplorerConfig)

  if (!coordsChanged && !configChanged) {
    return doc
  }

  try {
    // Trigger caching in the background
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    await fetch(`${baseUrl}/api/area-explorer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destinationId: doc.id,
      }),
    })
  } catch (error) {
    // Don't fail the save operation if caching fails
    console.error('Failed to cache area explorer data:', error)
  }

  return doc
}