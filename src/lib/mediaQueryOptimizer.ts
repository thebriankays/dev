import type { Destination } from '@/payload-types'

/**
 * Builds an optimized search query for media APIs based on destination data
 */
export function buildOptimizedMediaQuery(destination: Partial<Destination>): string {
  const parts: string[] = []
  
  // ALWAYS prioritize city if available - it's the most specific
  if (destination.city) {
    parts.push(destination.city)
  }
  
  // Add title if it's different from city (for compound names)
  if (destination.title && destination.title !== destination.city) {
    // Extract unique parts from title
    const titleParts = destination.title.split(',').map(s => s.trim())
    titleParts.forEach(part => {
      if (part && !parts.includes(part)) {
        parts.push(part)
      }
    })
  }
  
  // Add country information if not already in the query
  const country = destination.countryRelation && typeof destination.countryRelation === 'object' 
    ? destination.countryRelation.name 
    : destination.countryData?.label || destination.country
    
  if (country && typeof country === 'string' && !parts.some(p => p.toLowerCase().includes(country.toLowerCase()))) {
    parts.push(country)
  }
  
  // Only add continent if we have no other location info
  if (parts.length === 0 && destination.continent) {
    parts.push(destination.continent)
  }
  
  // Add ONE contextual keyword based on the destination type
  if (parts.length > 0) {
    const locationString = parts.join(' ').toLowerCase()
    
    // Amazon/rainforest cities
    if (locationString.match(/iquitos|manaus|puerto maldonado|leticia|belem|santarem|macapa/)) {
      parts.push('amazon rainforest')
    }
    // Desert cities
    else if (locationString.match(/dubai|abu dhabi|riyadh|cairo|luxor|marrakech|phoenix|las vegas/)) {
      parts.push('desert')
    }
    // For island/beach destinations
    else if (locationString.match(/island|beach|caribbean|bahamas|maldives|seychelles|coastal|cancun|miami|malibu/)) {
      parts.push('beach')
    }
    // For mountain destinations
    else if (locationString.match(/mountain|alps|himalaya|andes|rockies|aspen|chamonix|zermatt|cusco|la paz/)) {
      parts.push('mountains')
    }
    // For known jungle/rainforest regions
    else if (locationString.match(/amazon|jungle|rainforest|borneo|congo/)) {
      parts.push('rainforest')
    }
    // For cities - check if it's a major city that should have skyline
    else if (destination.city && locationString.match(/new york|london|paris|tokyo|singapore|hong kong|chicago|toronto/)) {
      parts.push('skyline')
    }
    // Default for other cities
    else if (destination.city) {
      parts.push('city')
    }
    // Default
    else {
      parts.push('travel')
    }
  }
  
  // Filter out any undefined or empty strings before joining
  const query = parts.filter(part => part && part.length > 0).join(' ')
  
  // Return the query, or a fallback if empty
  return query || 'travel destination'
}

/**
 * Builds video-specific search query
 */
export function buildVideoSearchQuery(destination: Partial<Destination>): string {
  const baseQuery = buildOptimizedMediaQuery(destination)
  
  // Add video-specific keywords that match the destination type
  let videoKeyword = 'aerial'
  
  // Check for specific location types in the query
  const queryLower = baseQuery.toLowerCase()
  
  // Amazon/rainforest locations
  if (queryLower.includes('amazon') || queryLower.includes('rainforest')) {
    videoKeyword = 'drone rainforest jungle'
  }
  // Desert locations
  else if (queryLower.includes('desert')) {
    videoKeyword = 'drone desert dunes'
  }
  // Beach/island destinations
  else if (queryLower.includes('beach') || queryLower.includes('island')) {
    videoKeyword = 'drone beach ocean'
  }
  // Mountain destinations
  else if (queryLower.includes('mountain')) {
    videoKeyword = 'drone mountains peaks'
  }
  // Major cities with skylines
  else if (queryLower.includes('skyline')) {
    videoKeyword = 'drone skyline cityscape'
  }
  // Regular cities
  else if (queryLower.includes('city')) {
    videoKeyword = 'drone city aerial'
  }
  
  // Remove the contextual keywords we added in buildOptimizedMediaQuery before adding video-specific ones
  const cleanQuery = baseQuery.replace(/\b(travel|city|beach|mountains|skyline|amazon rainforest|desert|rainforest)\b/gi, '').trim()
  
  return `${cleanQuery} ${videoKeyword}`.trim()
}

/**
 * Gets quality parameters for different media services
 */
export interface MediaQualityParams {
  unsplash: {
    quality: number
    format: 'jpg' | 'webp'
  }
  pexels: {
    size: 'original' | 'large2x' | 'large'
  }
  pexelsVideo: {
    minWidth: number
    preferredQuality: 'hd' | 'sd' | '4k'
  }
}

export const HIGH_QUALITY_PARAMS: MediaQualityParams = {
  unsplash: {
    quality: 90,
    format: 'jpg'
  },
  pexels: {
    size: 'original'
  },
  pexelsVideo: {
    minWidth: 1920,
    preferredQuality: 'hd'
  }
}

/**
 * Filters video files to get the best quality
 */
export function selectBestVideoFile(videoFiles: any[]): any {
  if (!videoFiles || videoFiles.length === 0) return null
  
  // Sort by width (resolution) descending, then by quality
  const sorted = [...videoFiles].sort((a, b) => {
    // First, prefer higher resolution
    const widthDiff = (b.width || 0) - (a.width || 0)
    if (widthDiff !== 0) return widthDiff
    
    // Then prefer 'hd' quality
    if (a.quality === 'hd' && b.quality !== 'hd') return -1
    if (b.quality === 'hd' && a.quality !== 'hd') return 1
    
    return 0
  })
  
  // Get the highest quality that's at least 1920px wide
  const hd = sorted.find(f => (f.width || 0) >= HIGH_QUALITY_PARAMS.pexelsVideo.minWidth)
  
  // Return HD if found, otherwise the highest resolution available
  return hd || sorted[0]
}