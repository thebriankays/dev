import type { CollectionBeforeChangeHook } from 'payload'
import { fetchUnsplashImagesByQuery, isImageError } from '@/lib/unsplash'
import { fetchPexelsImagesByQuery } from '@/lib/pexels'
import { fetchPexelsVideosByQuery } from '@/lib/pexelsVideos'
import { createMediaFromUrl, createVideoFromUrl } from '@/lib/mediaHelper'
import { buildOptimizedMediaQuery, buildVideoSearchQuery, selectBestVideoFile } from '@/lib/mediaQueryOptimizer'
import type { Destination } from '@/payload-types'

/**
 * Hook to automatically populate featuredImage and featuredVideo when creating destinations
 */
export const autoPopulateMedia: CollectionBeforeChangeHook<Destination> = async ({
  data,
  req: _req,
  operation,
}) => {
  // Only run on create operations, not updates
  if (operation !== 'create') {
    return data
  }

  // Skip if featuredImage and featuredVideo are already set
  if (data.featuredImage && data.featuredVideo) {
    return data
  }

  try {
    console.log('Auto-populating media for destination:', data.title)

    // Build optimized search queries
    const searchQuery = buildOptimizedMediaQuery(data as Partial<Destination>)
    const videoQuery = buildVideoSearchQuery(data as Partial<Destination>)

    console.log('Image search query:', searchQuery)
    console.log('Video search query:', videoQuery)

    // Auto-populate featured image if not set
    if (!data.featuredImage) {
      console.log('Fetching featured image for:', searchQuery)
      
      try {
        // Try Unsplash first
        const unsplashResult = await fetchUnsplashImagesByQuery(searchQuery, 1)
        let imageUrl: string | null = null

        if (!isImageError(unsplashResult) && unsplashResult.length > 0) {
          imageUrl = unsplashResult[0].url
          console.log('Found image from Unsplash:', imageUrl)
        } else {
          // Fallback to Pexels
          const pexelsImages = await fetchPexelsImagesByQuery(searchQuery, 1)
          if (pexelsImages.length > 0) {
            imageUrl = pexelsImages[0].url
            console.log('Found image from Pexels:', imageUrl)
          }
        }

        if (imageUrl) {
          const mediaId = await createMediaFromUrl(imageUrl, `Image of ${searchQuery}`)
          if (mediaId) {
            data.featuredImage = Number(mediaId)
            console.log('Set featuredImage ID:', mediaId)
          }
        }
      } catch (error) {
        console.error('Error fetching featured image:', error)
      }
    }

    // Auto-populate featured video if not set
    if (!data.featuredVideo) {
      console.log('Fetching featured video for:', videoQuery)
      
      try {
        const videos = await fetchPexelsVideosByQuery(videoQuery, 1)
        
        if (videos.length > 0 && videos[0].video_files?.length > 0) {
          const bestVideoFile = selectBestVideoFile(videos[0].video_files)
          
          if (bestVideoFile?.link) {
            console.log(`Selected video quality: ${bestVideoFile.quality} (${bestVideoFile.width}x${bestVideoFile.height})`)
            
            const videoMediaId = await createVideoFromUrl(bestVideoFile.link, `Video of ${videoQuery}`)
            if (videoMediaId) {
              data.featuredVideo = Number(videoMediaId)
              console.log('Set featuredVideo ID:', videoMediaId)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching featured video:', error)
      }
    }

    console.log('Media auto-population completed for:', data.title)
  } catch (error) {
    console.error('Error in autoPopulateMedia hook:', error)
    // Don't fail the entire operation if media population fails
  }

  return data
}