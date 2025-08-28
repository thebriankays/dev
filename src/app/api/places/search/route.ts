import { NextRequest, NextResponse } from 'next/server'

// Google Places API types
interface PlaceResult {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
}

interface PlaceDetails {
  result: {
    place_id: string
    name: string
    formatted_address: string
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
    address_components: Array<{
      long_name: string
      short_name: string
      types: string[]
    }>
    photos?: Array<{
      photo_reference: string
    }>
    types: string[]
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ destinations: [] })
    }

    // First, use Google Places Autocomplete to find places
    const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&types=(cities)&key=${apiKey}`

    const autocompleteResponse = await fetch(autocompleteUrl)
    const autocompleteData = await autocompleteResponse.json()

    if (!autocompleteData.predictions || autocompleteData.predictions.length === 0) {
      return NextResponse.json({ destinations: [] })
    }

    // Get details for each place
    const destinations = await Promise.all(
      autocompleteData.predictions.slice(0, 5).map(async (prediction: PlaceResult) => {
        // Get place details
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=name,formatted_address,geometry,address_components,photos,types&key=${apiKey}`
        
        const detailsResponse = await fetch(detailsUrl)
        const detailsData: PlaceDetails = await detailsResponse.json()
        
        if (!detailsData.result) {
          return null
        }

        const place = detailsData.result

        // Extract city and country from address components
        let city = place.name
        let country = ''
        
        for (const component of place.address_components || []) {
          if (component.types.includes('country')) {
            country = component.long_name
          }
          if (component.types.includes('locality')) {
            city = component.long_name
          }
        }

        // Get photo URL if available
        let image = null
        if (place.photos && place.photos.length > 0) {
          const photoReference = place.photos[0].photo_reference
          image = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${apiKey}`
        }

        return {
          id: place.place_id,
          name: place.name,
          city: city,
          country: country,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          image: image,
          description: prediction.description
        }
      })
    )

    // Filter out any null results
    const validDestinations = destinations.filter(d => d !== null)

    return NextResponse.json({ destinations: validDestinations })
  } catch (error) {
    console.error('Error searching places:', error)
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    )
  }
}
