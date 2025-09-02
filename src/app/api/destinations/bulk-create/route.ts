import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    
    const body = await request.json()
    const { destinations } = body

    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return NextResponse.json(
        { error: 'No destinations provided' },
        { status: 400 }
      )
    }

    const results = {
      created: 0,
      errors: [] as string[],
      destinations: [] as any[],
    }

    // Process destinations in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < destinations.length; i += batchSize) {
      const batch = destinations.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (dest) => {
          try {
            // Check if destination already exists
            const existing = await payload.find({
              collection: 'destinations',
              where: {
                or: [
                  { 'locationData.placeID': { equals: dest.locationData?.placeID } },
                  {
                    and: [
                      { title: { equals: dest.title } },
                      { city: { equals: dest.city } },
                    ],
                  },
                ],
              },
              limit: 1,
            })

            if (existing.docs.length > 0) {
              results.errors.push(`Destination "${dest.title}" already exists`)
              return
            }

            // Prepare the destination data
            const destData: any = {
              title: dest.title,
              locationData: dest.locationData,
              city: dest.city,
              state: dest.state,
              continent: dest.continent,
              lat: dest.lat,
              lng: dest.lng,
              googleMapsUri: dest.googleMapsUri,
              content: {
                root: {
                  type: 'root',
                  children: [
                    {
                      type: 'paragraph',
                      version: 1,
                      children: [
                        {
                          type: 'text',
                          version: 1,
                          text: `Welcome to ${dest.title}! This destination is located at coordinates ${dest.lat}, ${dest.lng}.`,
                        },
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
              },
            }

            // If we have country data, try to find and link the country relation
            if (dest.locationData?.tempCountryData?.countryCode) {
              const countryCode = dest.locationData.tempCountryData.countryCode
              
              // Find country by code
              const country = await payload.find({
                collection: 'countries',
                where: {
                  code: { equals: countryCode },
                },
                limit: 1,
              })

              if (country.docs.length > 0) {
                destData.countryRelation = country.docs[0].id
                
                // Also set currency and language relations if available
                if (country.docs[0].currencies && country.docs[0].currencies.length > 0) {
                  destData.currencyRelation = country.docs[0].currencies[0]
                }
                
                if (country.docs[0].languages && country.docs[0].languages.length > 0) {
                  destData.languagesRelation = country.docs[0].languages
                }
                
                // Try to find and link the region/state if we have state data
                if (dest.state) {
                  const region = await payload.find({
                    collection: 'regions',
                    where: {
                      and: [
                        { name: { equals: dest.state } },
                        { country: { equals: country.docs[0].id } },
                      ],
                    },
                    limit: 1,
                  })
                  
                  if (region.docs.length > 0) {
                    destData.regionRelation = region.docs[0].id
                  } else {
                    // If region doesn't exist, we could create it here
                    // For now, just log it
                    console.log(`Region "${dest.state}" not found for country ${country.docs[0].name}`)
                  }
                }
              }
            }

            // Create the destination
            const created = await payload.create({
              collection: 'destinations',
              data: destData,
            })

            // Skip AI content generation for now since the module is not available
            // This can be added back later when the AI content generator is implemented

            results.created++
            results.destinations.push({
              id: created.id,
              title: created.title,
              slug: created.slug,
            })
          } catch (error) {
            console.error('Error creating destination:', error)
            results.errors.push(
              `Failed to create "${dest.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          }
        })
      )
    }

    return NextResponse.json({
      created: results.created,
      errors: results.errors,
      destinations: results.destinations,
      message: `Successfully created ${results.created} of ${destinations.length} destinations`,
    })
  } catch (error) {
    console.error('Bulk create error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process bulk creation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}