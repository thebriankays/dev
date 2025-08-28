import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadHMR({ config })

    const searchParams = request.nextUrl.searchParams
    const airline = searchParams.get('airline')
    const departure = searchParams.get('departure')
    const arrival = searchParams.get('arrival')
    const flightNumber = searchParams.get('flightNumber')

    // Build where query
    const where: any = {}

    if (airline) {
      // Try to find airline by IATA or ICAO code
      const airlineResult = await payload.find({
        collection: 'airlines',
        where: {
          or: [
            { iata: { equals: airline.toUpperCase() } },
            { icao: { equals: airline.toUpperCase() } },
          ],
        },
        limit: 1,
      })

      if (airlineResult.docs.length > 0 && airlineResult.docs[0]) {
        where.airline = { equals: airlineResult.docs[0].id }
      }
    }

    if (departure && arrival) {
      // Find airports by code
      const [depAirport, arrAirport] = await Promise.all([
        payload.find({
          collection: 'airports',
          where: {
            or: [
              { iata_code: { equals: departure.toUpperCase() } },
              { icao_code: { equals: departure.toUpperCase() } },
              { ident: { equals: departure.toUpperCase() } },
            ],
          },
          limit: 1,
        }),
        payload.find({
          collection: 'airports',
          where: {
            or: [
              { iata_code: { equals: arrival.toUpperCase() } },
              { icao_code: { equals: arrival.toUpperCase() } },
              { ident: { equals: arrival.toUpperCase() } },
            ],
          },
          limit: 1,
        }),
      ])

      if (depAirport.docs.length > 0 && depAirport.docs[0]) {
        where.sourceAirport = { equals: depAirport.docs[0].id }
      }
      if (arrAirport.docs.length > 0 && arrAirport.docs[0]) {
        where.destinationAirport = { equals: arrAirport.docs[0].id }
      }
    }

    // Query routes
    const routes = await payload.find({
      collection: 'routes',
      where,
      depth: 2, // Get related airline and airport data
      limit: 10,
    })

    // Format response
    const formattedRoutes = routes.docs.map((route: any) => ({
      id: route.id,
      airline: route.airline
        ? {
            name: route.airline.name,
            iata: route.airline.iata,
            icao: route.airline.icao,
            callsign: route.airline.callsign,
          }
        : null,
      sourceAirport: route.sourceAirport
        ? {
            code:
              route.sourceAirport.iata_code ||
              route.sourceAirport.icao_code ||
              route.sourceAirport.ident,
            name: route.sourceAirport.name,
            city: route.sourceAirport.municipality,
            country: route.sourceAirport.iso_country,
            latitude: route.sourceAirport.latitude,
            longitude: route.sourceAirport.longitude,
          }
        : null,
      destinationAirport: route.destinationAirport
        ? {
            code:
              route.destinationAirport.iata_code ||
              route.destinationAirport.icao_code ||
              route.destinationAirport.ident,
            name: route.destinationAirport.name,
            city: route.destinationAirport.municipality,
            country: route.destinationAirport.iso_country,
            latitude: route.destinationAirport.latitude,
            longitude: route.destinationAirport.longitude,
          }
        : null,
      codeshare: route.codeshare,
      stops: route.stops,
      equipment: route.equipment,
    }))

    return NextResponse.json({
      routes: formattedRoutes,
      total: routes.totalDocs,
    })
  } catch (error) {
    console.error('Error fetching routes:', error)
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 })
  }
}
