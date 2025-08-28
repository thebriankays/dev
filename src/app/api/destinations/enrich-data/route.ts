import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { GoogleMapsService } from '@/lib/external-apis/google-maps'
import { TravelAdvisoryService } from '@/lib/external-apis/travel-advisory'
import { WeatherService } from '@/lib/external-apis/weather'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    
    const body = await request.json()
    const { destinationId, services = ['google-maps', 'travel-advisory', 'weather'] } = body

    if (!destinationId) {
      return NextResponse.json(
        { error: 'Destination ID is required' },
        { status: 400 }
      )
    }

    // Get destination
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

    const updates: any = {}
    const logs = []

    // Google Maps enrichment
    if (services.includes('google-maps') && process.env.GOOGLE_MAPS_API_KEY) {
      try {
        const googleMapsService = new GoogleMapsService({
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        })

        // Get place details if not already available
        if (!destination.locationData?.placeID) {
          const placeDetails = await googleMapsService.searchPlace(destination.title)
          if (placeDetails) {
            updates.locationData = {
              ...destination.locationData,
              placeID: placeDetails.placeId,
              coordinates: placeDetails.coordinates ? {
                lat: placeDetails.coordinates.latitude,
                lng: placeDetails.coordinates.longitude
              } : undefined
            }
          }
        }

        // Get nearby airports
        if (destination.locationData?.coordinates) {
          const airports = await googleMapsService.getNearbyAirports(
            destination.locationData.coordinates.lat ?? 0,
            destination.locationData.coordinates.lng ?? 0
          )
          
          updates.nearbyAirports = airports.slice(0, 5).map(airport => ({
            name: airport.name,
            code: '', // Would need additional lookup for IATA codes
            distance: Math.round(airport.geometry?.location ? 
              calculateDistance(
                destination.locationData?.coordinates?.lat ?? 0,
                destination.locationData?.coordinates?.lng ?? 0,
                airport.geometry.location.lat,
                airport.geometry.location.lng
              ) : 0
            ),
            transferTime: 'Unknown'
          }))
        }

        logs.push({
          service: 'google-maps',
          status: 'success',
          timestamp: new Date().toISOString()
        })

      } catch (error) {
        logs.push({
          service: 'google-maps',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }
    }

    // Travel Advisory enrichment
    if (services.includes('travel-advisory')) {
      try {
        const travelAdvisoryService = new TravelAdvisoryService()
        
        // Get country code (would need proper mapping)
        let countryCode = ''
        if (destination.countryRelation) {
          const countryId = typeof destination.countryRelation === 'object' 
            ? destination.countryRelation.id 
            : destination.countryRelation
          const country = await payload.findByID({
            collection: 'countries',
            id: countryId,
          })
          countryCode = country?.code || ''
        }

        if (countryCode) {
          const advisory = await travelAdvisoryService.getTravelAdvisory(countryCode)
          if (advisory) {
            updates.travelAdvisory = {
              level: advisory.level,
              summary: advisory.summary,
              details: advisory.details,
              lastUpdated: advisory.lastUpdated,
              sourceUrl: advisory.sourceUrl
            }
          }

          const visaInfo = await travelAdvisoryService.getVisaRequirements(countryCode)
          if (visaInfo) {
            updates.visaRequirements = visaInfo
          }

          const healthInfo = await travelAdvisoryService.getHealthRequirements(countryCode)
          if (healthInfo) {
            updates.healthRequirements = healthInfo
          }
        }

        logs.push({
          service: 'travel-advisory',
          status: 'success',
          timestamp: new Date().toISOString()
        })

      } catch (error) {
        logs.push({
          service: 'travel-advisory',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }
    }

    // Weather enrichment
    if (services.includes('weather') && process.env.WEATHER_API_KEY && destination.locationData?.coordinates) {
      try {
        const weatherService = new WeatherService(process.env.WEATHER_API_KEY)
        
        const weatherData = await weatherService.getWeatherData(
          destination.locationData.coordinates.lat ?? 0,
          destination.locationData.coordinates.lng ?? 0,
          destination.title
        )

        updates.climateOverview = weatherData.bestTimeToVisit.overall
        updates.bestTimeToVisit = weatherData.bestTimeToVisit
        updates.seasonalWeather = weatherData.seasonal
        updates.weatherAlerts = weatherData.weatherAlerts

        logs.push({
          service: 'weather',
          status: 'success',
          timestamp: new Date().toISOString()
        })

      } catch (error) {
        logs.push({
          service: 'weather',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }
    }

    // Update destination with enriched data
    if (Object.keys(updates).length > 0) {
      await payload.update({
        collection: 'destinations',
        id: destinationId,
        data: updates,
      })
    }

    return NextResponse.json({
      success: true,
      updated: Object.keys(updates).length > 0,
      logs,
      message: 'Destination data enriched successfully'
    })

  } catch (error) {
    console.error('Error enriching destination data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const d = R * c // Distance in kilometers
  return d
}