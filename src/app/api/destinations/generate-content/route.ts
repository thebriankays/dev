import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { DestinationContentGenerator } from '@/lib/ai/content-generator'
import { GoogleMapsService } from '@/lib/external-apis/google-maps'
import { TravelAdvisoryService } from '@/lib/external-apis/travel-advisory'
import { WeatherService } from '@/lib/external-apis/weather'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const generator = new DestinationContentGenerator(payload)
    
    const body = await request.json()
    const { destinationId, sections, options } = body

    if (!destinationId) {
      return NextResponse.json(
        { error: 'Destination ID is required' },
        { status: 400 }
      )
    }

    // Get destination details
    const destination = await payload.findByID({
      collection: 'destinations',
      id: destinationId,
    })

    if (!destination) {
      return NextResponse.json(
        { error: 'Destination not found' },
        { status: 404 }
      )
    }

    // Get country information
    let countryName = ''
    if (destination.country) {
      const country = await payload.findByID({
        collection: 'countries',
        id: destination.country,
      })
      countryName = country?.name || ''
    }

    const request_data = {
      destinationId,
      destinationName: destination.name,
      country: countryName,
      sections: sections || ['basic-description', 'short-description'],
      options: options || {}
    }

    const result = await generator.generateCompleteDestination(request_data)

    return NextResponse.json({
      success: result.success,
      logs: result.logs,
      errors: result.errors,
      message: result.success 
        ? 'Content generated successfully' 
        : 'Content generation completed with errors'
    })

  } catch (error) {
    console.error('Error generating destination content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}