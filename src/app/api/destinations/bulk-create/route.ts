import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { DestinationContentGenerator } from '@/lib/ai/content-generator'
import { GoogleMapsService } from '@/lib/external-apis/google-maps'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const generator = new DestinationContentGenerator(payload)
    
    const body = await request.json()
    const { destinations, generateContent = true, options = {} } = body

    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return NextResponse.json(
        { error: 'Destinations array is required' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    // Initialize Google Maps service if API key is available
    let googleMapsService: GoogleMapsService | null = null
    if (process.env.GOOGLE_MAPS_API_KEY) {
      googleMapsService = new GoogleMapsService({
        apiKey: process.env.GOOGLE_MAPS_API_KEY
      })
    }

    for (const destinationName of destinations) {
      try {
        let placeDetails = null
        let countryId = null
        let regionId = null

        // Get place details from Google Maps
        if (googleMapsService) {
          placeDetails = await googleMapsService.searchPlace(destinationName)
        }

        // Find or create country
        if (placeDetails?.country) {
          const existingCountry = await payload.find({
            collection: 'countries',
            where: {
              name: {
                equals: placeDetails.country
              }
            }
          })

          if (existingCountry.docs.length > 0) {
            const firstCountry = existingCountry.docs[0]
            if (firstCountry) {
              countryId = firstCountry.id
            }
          } else {
            // Create new country
            const newCountry = await payload.create({
              collection: 'countries',
              data: {
                name: placeDetails.country,
                code: '', // Would need to map country name to code
                continent: 'asia' // Default continent, would need proper mapping
              }
            })
            countryId = newCountry.id
          }
        }

        // Find or create region
        if (placeDetails?.region && countryId) {
          const existingRegion = await payload.find({
            collection: 'regions',
            where: {
              and: [
                {
                  name: {
                    equals: placeDetails.region
                  }
                },
                {
                  country: {
                    equals: countryId
                  }
                }
              ]
            }
          })

          if (existingRegion.docs.length > 0) {
            const firstRegion = existingRegion.docs[0]
            if (firstRegion) {
              regionId = firstRegion.id
            }
          } else {
            // Create new region
            const newRegion = await payload.create({
              collection: 'regions',
              data: {
                name: placeDetails.region,
                country: countryId,
                type: 'region'
              }
            })
            regionId = newRegion.id
          }
        }

        // Create destination
        const destinationData: any = {
          name: destinationName,
          slug: destinationName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          status: 'draft',
          aiGenerated: generateContent,
        }

        if (placeDetails) {
          destinationData.coordinates = placeDetails.coordinates
          destinationData.googlePlaceId = placeDetails.placeId
          destinationData.timezone = placeDetails.timezone
        }

        if (countryId) {
          destinationData.country = countryId
        }

        if (regionId) {
          destinationData.region = regionId
        }

        const newDestination = await payload.create({
          collection: 'destinations',
          data: destinationData
        })

        // Generate AI content if requested
        if (generateContent) {
          const contentRequest = {
            destinationId: String(newDestination.id),
            destinationName: destinationName,
            country: placeDetails?.country || '',
            sections: ['basic-description', 'short-description'],
            options
          }

          try {
            await generator.generateCompleteDestination(contentRequest)
          } catch (contentError) {
            console.error(`Error generating content for ${destinationName}:`, contentError)
            // Continue with next destination even if content generation fails
          }
        }

        results.push({
          name: destinationName,
          id: newDestination.id,
          status: 'created',
          placeDetails: placeDetails ? {
            coordinates: placeDetails.coordinates,
            country: placeDetails.country,
            region: placeDetails.region
          } : null
        })

      } catch (error) {
        console.error(`Error creating destination ${destinationName}:`, error)
        errors.push({
          name: destinationName,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      created: results.length,
      failed: errors.length,
      results,
      errors
    })

  } catch (error) {
    console.error('Error in bulk destination creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}