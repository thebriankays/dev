// lib/pexels.ts

import { UnsplashImage } from './unsplash'; // Reuse the UnsplashImage interface for consistency
import { getLocalImages, saveImagesLocally } from './localImages';
import { isAPICallAllowed } from './apiRateLimit';

// Define interfaces for Pexels API response data
interface PexelsPhotoSrc {
  original: string
  large2x: string
  large: string
  medium: string
  small: string
  portrait: string
  landscape: string
  tiny: string
}

interface PexelsPhoto {
  id: number
  width: number
  height: number
  url: string
  photographer: string
  photographer_url: string
  photographer_id: number
  avg_color: string
  src: PexelsPhotoSrc
  alt: string
}

interface PexelsPhotosResponse {
  total_results: number
  page: number
  per_page: number
  photos: PexelsPhoto[]
  next_page: string
}

// Search for photos by query
export async function fetchPexelsImagesByQuery(
  query: string,
  count: number = 30,
): Promise<UnsplashImage[]> {
  // First check if we have local images for this query
  const localImages = await getLocalImages('pexels', query, count);
  console.log(`Found ${localImages.length} local pexels images for query: ${query}`);
  
  // If we have enough local images, return them
  if (localImages.length >= count) {
    return localImages.slice(0, count);
  }
  
  // If we don't have enough local images, fetch more
  const API_KEY = process.env.NEXT_PUBLIC_PEXELS_ACCESS_KEY

  if (!API_KEY) {
    console.warn('Missing Pexels API key in environment variables')
    return localImages.length > 0 ? localImages : []
  }

  // Rate limiting check - 200 calls per hour for Pexels free tier
  if (!isAPICallAllowed('pexels', 200, 3600000)) {
    console.warn('Pexels API rate limit reached, returning local images')
    return localImages.length > 0 ? localImages : []
  }

  // Enforce a maximum of 80 images per request (Pexels limit)
  const safeCount = Math.min(count, 80);
  // Calculate how many more images we need
  const remainingCount = Math.min(safeCount - localImages.length, safeCount);
  
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${remainingCount}`,
      {
        headers: {
          Authorization: `${API_KEY}`,
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      },
    )

    // Handle rate limit information if available
    const rateLimit = response.headers.get('X-Ratelimit-Limit');
    const rateLimitRemaining = response.headers.get('X-Ratelimit-Remaining');
    
    if (rateLimit && rateLimitRemaining) {
      console.log(`Pexels API Rate Limit: ${rateLimitRemaining}/${rateLimit} remaining`);
    }
    
    if (!response.ok) {
      console.warn(`Pexels API responded with status: ${response.status}`)
      return localImages.length > 0 ? localImages : []
    }

    const data = await response.json() as PexelsPhotosResponse

    // Convert Pexels format to UnsplashImage format for consistency
    const newImages = data.photos.map((photo) => ({
      url: photo.src.original || photo.src.large2x || photo.src.large, // Use original quality, fallback to large2x then large
      width: photo.width,
      height: photo.height,
      blurDataURL: undefined,
    }));
    
    // Save images locally for future use
    saveImagesLocally(newImages, 'pexels', query);
    
    // Return combination of local and new images
    return [...localImages, ...newImages];
  } catch (error) {
    console.warn('Error fetching from Pexels:', error)
    return localImages.length > 0 ? localImages : []
  }
}

// Get curated photos
export async function fetchPexelsCuratedImages(
  count: number = 30,
): Promise<UnsplashImage[]> {
  // First check if we have local images in the curated folder
  const localImages = await getLocalImages('pexels', 'curated', count);
  console.log(`Found ${localImages.length} local pexels curated images`);
  
  // If we have enough local images, return them
  if (localImages.length >= count) {
    return localImages.slice(0, count);
  }
  
  // If we don't have enough local images, fetch more
  const API_KEY = process.env.NEXT_PUBLIC_PEXELS_ACCESS_KEY

  if (!API_KEY) {
    console.error('Missing Pexels API key in environment variables')
    return localImages.length > 0 ? localImages : []
  }

  // Rate limiting check - 200 calls per hour for Pexels free tier
  if (!isAPICallAllowed('pexels', 200, 3600000)) {
    console.warn('Pexels API rate limit reached, returning local images')
    return localImages.length > 0 ? localImages : []
  }

  // Enforce a maximum of 80 images per request (Pexels limit)
  const safeCount = Math.min(count, 80);
  // Calculate how many more images we need
  const remainingCount = Math.min(safeCount - localImages.length, safeCount);
  
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/curated?per_page=${remainingCount}`,
      {
        headers: {
          Authorization: `${API_KEY}`,
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      },
    )

    // Handle rate limit information if available
    const rateLimit = response.headers.get('X-Ratelimit-Limit');
    const rateLimitRemaining = response.headers.get('X-Ratelimit-Remaining');
    
    if (rateLimit && rateLimitRemaining) {
      console.log(`Pexels API Rate Limit: ${rateLimitRemaining}/${rateLimit} remaining`);
    }
    
    if (!response.ok) {
      console.warn(`Pexels API responded with status: ${response.status}`)
      return localImages.length > 0 ? localImages : []
    }

    const data = await response.json() as PexelsPhotosResponse

    // Convert Pexels format to UnsplashImage format for consistency
    const newImages = data.photos.map((photo) => ({
      url: photo.src.original || photo.src.large2x || photo.src.large, // Use original quality, fallback to large2x then large
      width: photo.width,
      height: photo.height,
      blurDataURL: undefined,
    }));
    
    // Save images locally for future use
    saveImagesLocally(newImages, 'pexels', 'curated');
    
    // Return combination of local and new images
    return [...localImages, ...newImages];
  } catch (error) {
    console.warn('Error fetching from Pexels:', error)
    return localImages.length > 0 ? localImages : []
  }
}

// Import the generatePlaceholderImages function from unsplash.ts so we have consistent fallbacks
// Currently imported but unused, keeping for future use when needed
// import { generatePlaceholderImages } from './unsplash';