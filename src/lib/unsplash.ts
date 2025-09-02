// lib/unsplash.ts

import { getLocalImages, saveImagesLocally } from './localImages'
import { isAPICallAllowed } from './apiRateLimit'

// Special result type to handle 403 errors without breaking type safety
export type ImageFetchResult = UnsplashImage[] | { error: '403' }

// Define interfaces for Unsplash API response data
interface UnsplashPhotoUrls {
  raw: string
  full: string
  regular: string
  small: string
  thumb: string
}

interface UnsplashPhoto {
  id: string
  urls: UnsplashPhotoUrls
  width: number
  height: number
  blur_hash?: string
  // Add other properties you need from the Unsplash API
}

export interface UnsplashImage {
  url: string
  width: number
  height: number
  blurDataURL?: string
}

// Search for photos by category/query
export async function fetchUnsplashImagesByQuery(
  query: string,
  count: number = 30,
): Promise<ImageFetchResult> {
  // First check if we have local images for this query
  const localImages = await getLocalImages('unsplash', query, count)
  console.log(`Found ${localImages.length} local unsplash images for query: ${query}`)

  // If we have enough local images, return them
  if (localImages.length >= count) {
    return localImages.slice(0, count)
  }

  // If we don't have enough images, fetch from API
  const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

  if (!ACCESS_KEY) {
    console.warn('UNSPLASH_ACCESS_KEY is not set in environment variables')
    return localImages.length > 0 ? localImages : []
  }

  // Rate limiting check - 50 calls per hour for Unsplash free tier
  if (!isAPICallAllowed('unsplash', 50, 3600000)) {
    console.warn('Unsplash API rate limit reached, returning local images')
    return localImages.length > 0 ? localImages : []
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query,
      )}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${ACCESS_KEY}`,
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      },
    )

    if (response.status === 403) {
      console.warn('Unsplash API returned 403 Forbidden - likely rate limited or invalid key')
      return { error: '403' }
    }

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    const images: UnsplashImage[] = data.results.map((photo: UnsplashPhoto) => ({
      url: photo.urls.regular,
      width: photo.width,
      height: photo.height,
      blurDataURL: photo.blur_hash
        ? `data:image/svg+xml;base64,${Buffer.from(
            `<svg width="${photo.width}" height="${photo.height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${photo.blur_hash}"/></svg>`,
          ).toString('base64')}`
        : undefined,
    }))

    // Save fetched images locally for future use
    await saveImagesLocally(images, 'unsplash', query)

    return images
  } catch (error) {
    console.error('Error fetching Unsplash images:', error)
    // Return local images if we have any, otherwise empty array
    return localImages.length > 0 ? localImages : []
  }
}

// Get random photos
export async function fetchUnsplashRandomImages(count: number = 10): Promise<ImageFetchResult> {
  // First check if we have local images
  const localImages = await getLocalImages('unsplash', 'random', count)

  // If we have enough local images, return them
  if (localImages.length >= count) {
    return localImages.slice(0, count)
  }

  const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

  if (!ACCESS_KEY) {
    console.warn('UNSPLASH_ACCESS_KEY is not set in environment variables')
    return localImages.length > 0 ? localImages : []
  }

  // Rate limiting check - 50 calls per hour for Unsplash free tier
  if (!isAPICallAllowed('unsplash-random', 50, 3600000)) {
    console.warn('Unsplash API rate limit reached, returning local images')
    return localImages.length > 0 ? localImages : []
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?count=${count}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${ACCESS_KEY}`,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour (shorter for random images)
      },
    )

    if (response.status === 403) {
      console.warn('Unsplash API returned 403 Forbidden - likely rate limited or invalid key')
      return { error: '403' }
    }

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const photos = Array.isArray(data) ? data : [data] // Handle both single and multiple responses

    const images: UnsplashImage[] = photos.map((photo: UnsplashPhoto) => ({
      url: photo.urls.regular,
      width: photo.width,
      height: photo.height,
      blurDataURL: photo.blur_hash
        ? `data:image/svg+xml;base64,${Buffer.from(
            `<svg width="${photo.width}" height="${photo.height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${photo.blur_hash}"/></svg>`,
          ).toString('base64')}`
        : undefined,
    }))

    // Save fetched images locally for future use
    await saveImagesLocally(images, 'unsplash', 'random')

    return images
  } catch (error) {
    console.error('Error fetching random Unsplash images:', error)
    // Return local images if we have any, otherwise empty array
    return localImages.length > 0 ? localImages : []
  }
}

// Helper function to check if a result is an error
export function isImageError(result: ImageFetchResult): result is { error: '403' } {
  return typeof result === 'object' && 'error' in result && result.error === '403'
}