import { NextRequest, NextResponse } from 'next/server'

// Cache for JetPhotos data to reduce requests
const photoCache = new Map<string, { url: string | null; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Scrape JetPhotos for aircraft images
async function getJetPhotosImage(registration: string): Promise<string | null> {
  try {
    // Check cache first
    const cached = photoCache.get(registration)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.url
    }

    // Clean up registration (remove dashes, spaces)
    const cleanReg = registration.replace(/[-\s]/g, '').toUpperCase()
    
    // JetPhotos search URL
    const searchUrl = `https://www.jetphotos.com/photo/keyword/${cleanReg}`
    
    console.log('Searching JetPhotos for registration:', cleanReg)
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    if (!response.ok) {
      console.error('JetPhotos response not OK:', response.status)
      photoCache.set(registration, { url: null, timestamp: Date.now() })
      return null
    }
    
    const html = await response.text()
    
    // Look for the first image result
    // JetPhotos uses various patterns for photo thumbnails
    const imagePatterns = [
      /<img[^>]+class="result__photo__img"[^>]+src="([^"]+)"/i,
      /<div[^>]+class="result__photoLink"[^>]*>\s*<img[^>]+src="([^"]+)"/i,
      /<img[^>]+src="([^"]+)"[^>]+class="result__photo__img"/i,
      /data-lazy-src="([^"]+\.jpg)"/i,
      /src="(https:\/\/cdn\.jetphotos\.com\/[^"]+)"/i
    ]
    
    let match = null
    for (const pattern of imagePatterns) {
      match = html.match(pattern)
      if (match) break
    }
    
    if (match && match[1]) {
      let imageUrl = match[1]
      
      // Convert thumbnail to larger image
      // JetPhotos URLs typically have format: //cdn.jetphotos.com/200/5/1234567_8901234567.jpg
      // We want to change /200/ to /640/ for a larger image
      if (imageUrl.includes('/200/')) {
        imageUrl = imageUrl.replace('/200/', '/640/')
      }
      
      // Ensure https
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl
      }
      
      console.log('Found JetPhotos image:', imageUrl)
      
      // Cache the result
      photoCache.set(registration, { url: imageUrl, timestamp: Date.now() })
      
      return imageUrl
    }
    
    // No image found - cache null result
    console.log('No JetPhotos image found for:', registration)
    photoCache.set(registration, { url: null, timestamp: Date.now() })
    
    return null
    
  } catch (error) {
    console.error('Error scraping JetPhotos:', error)
    return null
  }
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of photoCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION * 2) {
      photoCache.delete(key)
    }
  }
}, CACHE_DURATION)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const registration = searchParams.get('registration')
  const icao24 = searchParams.get('icao24')
  
  if (!registration && !icao24) {
    return NextResponse.json({ error: 'Registration or ICAO24 required' }, { status: 400 })
  }
  
  try {
    const searchTerm = registration || icao24 || ''
    
    // Try to get image from JetPhotos
    const photoUrl = await getJetPhotosImage(searchTerm)
    
    return NextResponse.json({
      photo_url: photoUrl,
      search_url: `https://www.jetphotos.com/photo/keyword/${searchTerm}`,
      source: 'jetphotos',
      registration: registration,
      icao24: icao24,
      cached: photoCache.has(searchTerm)
    })
    
  } catch (error) {
    console.error('Error fetching aircraft photo:', error)
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 })
  }
}
