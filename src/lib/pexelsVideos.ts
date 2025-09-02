// Add video-related types and functions to pexels.ts

import { isAPICallAllowed } from './apiRateLimit';

// Define video-related interfaces for Pexels API
interface PexelsVideoFile {
  id: number
  quality: string
  file_type: string
  width: number
  height: number
  link: string
}

interface PexelsVideo {
  id: number
  width: number
  height: number
  url: string
  image: string
  duration: number
  user: {
    id: number
    name: string
    url: string
  }
  video_files: PexelsVideoFile[]
}

interface PexelsVideoResponse {
  page: number
  per_page: number
  videos: PexelsVideo[]
  total_results: number
  next_page: string
  url: string
}

// Function to fetch videos by query
export async function fetchPexelsVideosByQuery(
  query: string,
  count: number = 1
): Promise<PexelsVideo[]> {
  const API_KEY = process.env.NEXT_PUBLIC_PEXELS_ACCESS_KEY

  if (!API_KEY) {
    console.warn('Missing Pexels API key in environment variables')
    return []
  }

  // Rate limiting check - 200 calls per hour for Pexels free tier
  if (!isAPICallAllowed('pexels-video', 200, 3600000)) {
    console.warn('Pexels Video API rate limit reached')
    return []
  }

  // Enforce a maximum of 15 videos per request (Pexels limit)
  const safeCount = Math.min(count, 15)
  
  try {
    const response = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${safeCount}`,
      {
        headers: {
          Authorization: `${API_KEY}`,
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    )

    // Handle rate limit information if available
    const rateLimit = response.headers.get('X-Ratelimit-Limit')
    const rateLimitRemaining = response.headers.get('X-Ratelimit-Remaining')
    
    if (rateLimit && rateLimitRemaining) {
      console.log(`Pexels API Rate Limit: ${rateLimitRemaining}/${rateLimit} remaining`)
    }
    
    if (!response.ok) {
      console.warn(`Pexels API responded with status: ${response.status}`)
      return []
    }

    const data = await response.json() as PexelsVideoResponse
    return data.videos
  } catch (error) {
    console.warn('Error fetching videos from Pexels:', error)
    return []
  }
}