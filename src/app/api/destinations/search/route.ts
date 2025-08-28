import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (!query || query.length < 2) {
      return NextResponse.json({ destinations: [] })
    }

    // Search for destinations in the database
    const results = await payload.find({
      collection: 'destinations',
      where: {
        or: [
          {
            title: {
              contains: query,
            },
          },
          {
            city: {
              contains: query,
            },
          },
          {
            country: {
              contains: query,
            },
          },
        ],
      },
      limit: 10,
      depth: 1, // Include related data like featuredImage
    })

    // Format the destinations for the frontend
    const destinations = results.docs.map(doc => ({
      id: doc.id,
      name: doc.title || '',
      city: doc.city || '',
      country: doc.country || '',
      lat: doc.lat || 0,
      lng: doc.lng || 0,
      image: doc.featuredImage && typeof doc.featuredImage === 'object' 
        ? doc.featuredImage.url 
        : null,
    }))

    return NextResponse.json({ destinations })
  } catch (error) {
    console.error('Error searching destinations:', error)
    return NextResponse.json(
      { error: 'Failed to search destinations' },
      { status: 500 }
    )
  }
}
