import React from 'react'
import type { TravelGlobeBlockProps, TravelAdvisory, VisaRequirement, MichelinRestaurant, AirportData, FlightRoute, CountryFeature } from './types'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@/payload.config'
import TravelGlobeWrapper from './TravelGlobeWrapper'

// Fetch data from Payload collections
async function fetchCollectionData() {
  const payload = await getPayloadHMR({ config })
  
  try {
    // Fetch all relevant data in parallel
    const [advisories, visaRequirements, restaurants, airports, routes] = await Promise.all([
      payload.find({
        collection: 'travel-advisories',
        limit: 1000,
        depth: 1,
      }),
      payload.find({
        collection: 'visa-requirements',
        limit: 1000,
        depth: 1,
      }),
      payload.find({
        collection: 'michelin-restaurants',
        limit: 1000,
        depth: 1,
      }),
      payload.find({
        collection: 'airports',
        limit: 1000,
        depth: 2,
      }),
      payload.find({
        collection: 'routes',
        limit: 1000,
        depth: 2,
      }),
    ])
    
    return {
      advisories: advisories.docs.map((doc: any) => ({
        countryCode: doc.country?.iso2 || doc.countryTag || '',
        countryName: doc.country?.name || doc.title || '',
        level: doc.threatLevel || 1,
        description: doc.description || doc.summary || '',
        updated: doc.pubDate || doc.updatedAt,
        risks: doc.categories || [],
      })),
      visaRequirements: visaRequirements.docs.map((doc: any) => ({
        countryCode: doc.country?.iso2 || '',
        countryName: doc.country?.name || '',
        requirement: doc.requirement || 'visa_required',
        duration: doc.duration || 0,
        details: doc.details || '',
      })),
      restaurants: restaurants.docs.map((doc: any) => ({
        id: doc.id,
        name: doc.name || '',
        city: doc.city || '',
        country: doc.country || '',
        latitude: doc.location?.coordinates?.[1] || 0,
        longitude: doc.location?.coordinates?.[0] || 0,
        stars: doc.stars || 1,
        cuisine: doc.cuisine || '',
        chef: doc.chef || '',
        address: doc.address || '',
      })),
      airports: airports.docs.map((doc: any) => ({
        code: doc.iataCode || doc.code || '',
        name: doc.name || '',
        city: doc.city || '',
        country: doc.country?.name || '',
        latitude: doc.location?.coordinates?.[1] || 0,
        longitude: doc.location?.coordinates?.[0] || 0,
        type: doc.type || 'international',
        terminals: doc.terminals || 1,
        passengers: doc.passengers || 0,
      })),
      flightRoutes: routes.docs
        .map((doc: any) => ({
          id: doc.id,
          from: doc.sourceAirport?.iataCode || doc.sourceAirport?.code || '',
          to: doc.destinationAirport?.iataCode || doc.destinationAirport?.code || '',
          type: doc.stops === 0 ? 'direct' : 'connecting',
          frequency: 1, // Default frequency since it's not in the collection
        })),
    }
  } catch (error) {
    console.error('Error fetching collection data:', error)
    return {
      advisories: [],
      visaRequirements: [],
      restaurants: [],
      airports: [],
      flightRoutes: [],
    }
  }
}


// Load country GeoJSON data
async function loadCountryPolygons(): Promise<CountryFeature[]> {
  try {
    const response = await fetch('/data/maps.world.json')
    const data = await response.json()
    
    if (data.features && Array.isArray(data.features)) {
      // Map the features to match our expected format
      return data.features.map((feature: any) => ({
        type: 'Feature',
        properties: {
          NAME: feature.properties.name || '',
          ISO_A2: feature.properties.iso2 || '',
          ISO_A3: feature.properties.iso3 || '',
          POP_EST: feature.properties.population || 0,
          GDP_MD_EST: feature.properties.gdp || 0,
          CONTINENT: feature.properties.continent || ''
        },
        geometry: feature.geometry
      }))
    }
    return []
  } catch (error) {
    console.error('Failed to load country data:', error)
    return []
  }
}

// Server component that fetches all data
export const TravelGlobeComponent: React.FC<TravelGlobeBlockProps> = async (props) => {
  // Fetch all data server-side
  const [collectionData, countryPolygons] = await Promise.all([
    fetchCollectionData(),
    loadCountryPolygons()
  ])
  
  return (
    <TravelGlobeWrapper
      enabledViews={props.enabledViews || ['travelAdvisory', 'visaRequirements', 'michelinRestaurants', 'airports']}
      initialView={props.initialView || 'travelAdvisory'}
      
      // Use collection data or provided data
      advisories={props.advisories || collectionData.advisories}
      visaData={props.visaRequirements || collectionData.visaRequirements}
      restaurants={props.restaurants || collectionData.restaurants}
      airports={props.airports || collectionData.airports}
      flightRoutes={props.flightRoutes || collectionData.flightRoutes}
      countryPolygons={countryPolygons}
      
      // Globe settings with defaults - using your actual texture files!
      globeSettings={{
        imageUrl: props.globeSettings?.imageUrl || '/earth-blue-marble.jpg',
        bumpUrl: props.globeSettings?.bumpUrl || '/earth-bump.jpg',
        rotationSpeed: props.globeSettings?.rotationSpeed || 0.5,
        showClouds: props.globeSettings?.showClouds,
        showAtmosphere: props.globeSettings?.showAtmosphere !== false,
        atmosphereColor: props.globeSettings?.atmosphereColor || '#3a7ca5',
      }}
      
      // Glass effects
      glassEffect={props.glassEffect}
      fluidOverlay={props.fluidOverlay}
    />
  )
}

export default TravelGlobeComponent
