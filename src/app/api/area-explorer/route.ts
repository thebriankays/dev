import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { getMapCacheService } from '@/services/mapCache'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const destinationId = searchParams.get('destinationId')
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radius = parseInt(searchParams.get('radius') || '1000', 10)
    const types = searchParams.get('types')?.split(',') || []
    const dataType = searchParams.get('dataType') || 'places-nearby'

    if (!destinationId || !lat || !lng) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })
    const cacheService = getMapCacheService(payload)

    // Check cache first
    if (dataType === 'places-nearby') {
      const cachedData = await cacheService.getCachedPlaces(
        { lat, lng },
        radius,
        types
      )

      if (cachedData) {
        return NextResponse.json({
          source: 'cache',
          data: cachedData,
        })
      }

      // If not cached, fetch from Google Places API
      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Google Maps API key not configured' },
          { status: 500 }
        )
      }

      // Fetch places for each type
      const allPlaces: any[] = []
      const maxResultsPerType = Math.floor(30 / types.length)

      for (const type of types) {
        const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
        url.searchParams.append('location', `${lat},${lng}`)
        url.searchParams.append('radius', radius.toString())
        url.searchParams.append('type', type)
        url.searchParams.append('key', apiKey)

        const response = await fetch(url.toString())
        const data = await response.json()

        if (data.status === 'OK' && data.results) {
          // Limit results based on density
          const limitedResults = data.results.slice(0, maxResultsPerType)
          allPlaces.push(...limitedResults)
        }
      }

      // Transform the data to only include what we need
      const transformedPlaces = allPlaces.map(place => ({
        place_id: place.place_id,
        name: place.name,
        vicinity: place.vicinity,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        types: place.types,
        geometry: {
          location: place.geometry.location,
        },
        icon: place.icon,
        photos: place.photos?.slice(0, 1), // Only keep first photo to reduce size
        business_status: place.business_status,
        price_level: place.price_level,
      }))

      // Cache the results
      await cacheService.setCachedPlaces(
        destinationId,
        { lat, lng },
        radius,
        types,
        transformedPlaces
      )

      return NextResponse.json({
        source: 'api',
        data: transformedPlaces,
      })
    }

    // For other data types (future expansion)
    return NextResponse.json(
      { error: 'Unsupported data type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in area-explorer API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint to pre-cache data for a destination
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { destinationId } = body

    if (!destinationId) {
      return NextResponse.json(
        { error: 'Missing destinationId' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })
    
    // Get destination details
    const destination = await payload.findByID({
      collection: 'destinations',
      id: destinationId,
    })

    if (!destination || !destination.enable3DMap) {
      return NextResponse.json(
        { error: 'Destination not found or 3D map not enabled' },
        { status: 404 }
      )
    }

    const lat = destination.locationData?.coordinates?.lat || destination.lat
    const lng = destination.locationData?.coordinates?.lng || destination.lng

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Destination coordinates not found' },
        { status: 400 }
      )
    }

    const config3D = destination.areaExplorerConfig || {}
    const radius = config3D.searchRadius || 1000
    const types = config3D.poiTypes || ['restaurant', 'tourist_attraction', 'lodging']

    // Trigger caching in the background
    const cacheService = getMapCacheService(payload)
    
    // Check if already cached
    const cachedData = await cacheService.getCachedPlaces(
      { lat, lng },
      radius,
      types
    )

    if (cachedData) {
      return NextResponse.json({
        message: 'Data already cached',
        cached: true,
      })
    }

    // If not cached, trigger a GET request to cache it
    const url = new URL(request.url)
    url.pathname = '/api/area-explorer'
    url.searchParams.set('destinationId', destinationId)
    url.searchParams.set('lat', lat.toString())
    url.searchParams.set('lng', lng.toString())
    url.searchParams.set('radius', radius.toString())
    url.searchParams.set('types', types.join(','))
    url.searchParams.set('dataType', 'places-nearby')

    // Fetch to trigger caching
    await fetch(url.toString())

    return NextResponse.json({
      message: 'Caching initiated',
      cached: false,
    })
  } catch (error) {
    console.error('Error in area-explorer POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
