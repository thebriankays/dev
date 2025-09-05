import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const { airports } = await request.json()
    
    if (!airports || !Array.isArray(airports)) {
      return NextResponse.json({ error: 'Airports array required' }, { status: 400 })
    }
    
    const payload = await getPayload({ config })
    const results = []
    
    for (const airportData of airports) {
      try {
        // Check if airport already exists
        const existing = await payload.find({
          collection: 'airports',
          where: {
            or: [
              { iata: { equals: airportData.iata || '' } },
              { icao: { equals: airportData.icao || '' } }
            ]
          },
          limit: 1
        })
        
        if (existing.docs.length === 0 && (airportData.iata || airportData.icao)) {
          // Look up country if provided
          let countryId = null
          if (airportData.country || airportData.countryCode) {
            const countryQuery = await payload.find({
              collection: 'countries',
              where: {
                or: [
                  { name: { equals: airportData.country || '' } },
                  { code: { equals: airportData.countryCode || '' } }
                ]
              },
              limit: 1
            })
            
            if (countryQuery.docs.length > 0) {
              countryId = countryQuery.docs[0].id
            }
          }
          
          // Skip if no country found (country is required)
          if (!countryId) {
            results.push({
              code: airportData.iata || airportData.icao,
              status: 'skipped',
              reason: 'Country not found'
            })
            continue
          }
          
          // Create new airport
          const newAirport = await payload.create({
            collection: 'airports',
            data: {
              name: airportData.name,
              iata: airportData.iata || null,
              icao: airportData.icao || null,
              city: airportData.city,
              country: countryId, // Required relationship field
              latitude: airportData.latitude,
              longitude: airportData.longitude,
              elevation: airportData.elevation || null,
              type: airportData.type || 'medium'
            }
          })
          
          results.push({
            code: airportData.iata || airportData.icao,
            status: 'created',
            id: newAirport.id
          })
        } else if (existing.docs.length > 0) {
          // Update existing if needed
          const existingAirport = existing.docs[0]
          const needsUpdate = 
            !existingAirport.latitude || 
            !existingAirport.longitude ||
            (airportData.name && existingAirport.name !== airportData.name)
          
          if (needsUpdate) {
            await payload.update({
              collection: 'airports',
              id: existingAirport.id,
              data: {
                name: airportData.name || existingAirport.name,
                latitude: airportData.latitude || existingAirport.latitude,
                longitude: airportData.longitude || existingAirport.longitude,
                elevation: airportData.elevation || existingAirport.elevation,
                city: airportData.city || existingAirport.city
              }
            })
            
            results.push({
              code: airportData.iata || airportData.icao,
              status: 'updated'
            })
          } else {
            results.push({
              code: airportData.iata || airportData.icao,
              status: 'exists'
            })
          }
        }
      } catch (error) {
        results.push({
          code: airportData.iata || airportData.icao || 'unknown',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    })
    
  } catch (error) {
    console.error('Error caching airports:', error)
    return NextResponse.json({ error: 'Failed to cache airports' }, { status: 500 })
  }
}