import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    
    // Get the latest airport misery data from cache
    const result = await payload.find({
      collection: 'map-data-cache',
      where: {
        cacheKey: { equals: 'airport-misery-latest' },
      },
      limit: 1,
    })
    
    if (result.docs.length > 0) {
      const data = result.docs[0]
      return NextResponse.json({
        success: true,
        data: data.data,
        lastUpdated: data.lastUpdated,
        cached: true,
      })
    }
    
    // If no data in cache, return empty
    return NextResponse.json({
      success: false,
      message: 'No airport misery data available',
      cached: false,
    })
    
  } catch (error) {
    console.error('Error fetching airport misery data:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch airport misery data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
