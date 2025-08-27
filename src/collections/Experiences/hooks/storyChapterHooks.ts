import type { CollectionBeforeChangeHook } from 'payload'

// Hook to populate coordinates from destinations
export const populateChapterCoordinates: CollectionBeforeChangeHook = async ({ 
  data, 
  req,
  operation,
  originalDoc 
}) => {
  // Only run on create or when story chapters are actually being modified
  if (!data?.destinations || !data?.storyChapters) {
    return data
  }
  
  // Skip if we're not actually changing story chapters
  if (operation === 'update' && originalDoc?.storyChapters && 
      JSON.stringify(data.storyChapters) === JSON.stringify(originalDoc.storyChapters)) {
    return data
  }

  const payload = req.payload
  
  // Check if coordinates are already populated to avoid infinite loops
  let needsUpdate = false
  for (const chapter of data.storyChapters) {
    if (chapter.useDestination && typeof chapter.destinationIndex === 'number' && !chapter.coordinates) {
      needsUpdate = true
      break
    }
  }
  
  if (!needsUpdate) {
    return data
  }
  
  // Process each chapter
  const processedChapters = await Promise.all(
    data.storyChapters.map(async (chapter: any, index: number) => {
      // If using destination index, get coordinates from destination
      if (chapter.useDestination && typeof chapter.destinationIndex === 'number') {
        const destItem = data.destinations[chapter.destinationIndex]
        
        if (destItem?.destination) {
          // If it's a relationship, we need to populate it
          let destination = destItem.destination
          
          // If it's just an ID, fetch the full destination
          if (typeof destination === 'string' || typeof destination === 'number') {
            try {
              destination = await payload.findByID({
                collection: 'destinations',
                id: destination,
                depth: 0,
              })
            } catch (error) {
              console.error('Error fetching destination:', error)
              return chapter
            }
          }

          // Add coordinates from destination
          if (destination?.locationData?.coordinates) {
            return {
              ...chapter,
              coordinates: {
                lat: destination.locationData.coordinates.lat,
                lng: destination.locationData.coordinates.lng
              },
              locationName: destination.title,
            }
          }
          // Fallback to lat/lng fields directly on destination
          else if (typeof destination?.lat === 'number' && typeof destination?.lng === 'number') {
            return {
              ...chapter,
              coordinates: {
                lat: destination.lat,
                lng: destination.lng
              },
              locationName: destination.title,
            }
          }
        } else if (destItem?.customLocation?.coordinates) {
          // Use custom location coordinates
          return {
            ...chapter,
            coordinates: {
              lat: destItem.customLocation.coordinates.lat,
              lng: destItem.customLocation.coordinates.lng
            },
            locationName: destItem.customLocation.title,
          }
        }
      } else if (!chapter.useDestination && chapter.customLocation) {
        // Chapter has direct custom location
        if (chapter.customLocation.lat !== undefined && chapter.customLocation.lng !== undefined) {
          return {
            ...chapter,
            coordinates: {
              lat: chapter.customLocation.lat,
              lng: chapter.customLocation.lng
            }
          }
        }
      }
      
      return chapter
    })
  )

  return {
    ...data,
    storyChapters: processedChapters,
  }
}