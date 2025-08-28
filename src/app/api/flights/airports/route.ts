import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '1000')
    const country = searchParams.get('country')
    const type = searchParams.get('type') // large, medium, etc.
    
    // Build where query
    const where: any = {}
    
    if (country) {
      where.country = { equals: country }
    }
    
    if (type) {
      // Map old enum values to new ones
      const typeMapping: { [key: string]: string } = {
        'large_airport': 'large',
        'medium_airport': 'medium',
        'small_airport': 'small',
        'heliport': 'heliport',
        'seaplane_base': 'seaplane',
        'closed': 'closed'
      }
      
      // Support multiple types separated by comma
      if (type.includes(',')) {
        const types = type.split(',').map(t => typeMapping[t.trim()] || t.trim())
        where.type = { in: types }
      } else {
        const mappedType = typeMapping[type] || type
        where.type = { equals: mappedType }
      }
    }
    
    // Query airports from Payload CMS
    const result = await payload.find({
      collection: 'airports',
      where,
      limit,
      depth: 0,
      select: {
        id: true,
        type: true,
        name: true,
        latitude: true,
        longitude: true,
        elevation: true,
        country: true,
        region: true,
        city: true,
        iata: true,
        icao: true,
      }
    })
    
    // Transform the data for the map
    const airports = result.docs.map((airport: any) => ({
      id: airport.id,
      code: airport.iata || airport.icao || airport.id,
      iata: airport.iata,
      icao: airport.icao,
      ident: airport.icao,
      name: airport.name,
      type: airport.type,
      latitude: airport.latitude,
      longitude: airport.longitude,
      elevation: airport.elevation,
      country: airport.country,
      region: airport.region,
      municipality: airport.city,
    }))
    
    return NextResponse.json({
      airports,
      total: result.totalDocs,
      hasMore: result.hasNextPage
    })
  } catch (error) {
    console.error('Error fetching airports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch airports' },
      { status: 500 }
    )
  }
}
