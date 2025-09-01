import React from 'react'
import { TravelDataGlobeBlockClient } from './Component.client'
import type { 
  TravelDataGlobeBlockProps, 
  PolyAdv, 
  VisaPolygon, 
  AirportData, 
  MichelinRestaurantData, 
  CountryBorder,
  AdvisoryCountry,
  CountryVisaData,
  VisaRequirementCode
} from './types'
import { getPayload } from 'payload'
import config from '@/payload.config'
import fs from 'fs/promises'
import path from 'path'

// Fetch data from Payload collections
async function fetchCollectionData() {
  const payload = await getPayload({ config })
  
  try {
    // Fetch all relevant data in parallel
    const [advisories, visaRequirements, restaurants, airports] = await Promise.all([
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
        depth: 1,
      }),
    ])
    
    return {
      advisories: advisories.docs,
      visaRequirements: visaRequirements.docs,
      restaurants: restaurants.docs,
      airports: airports.docs,
    }
  } catch (error) {
    console.error('Error fetching collection data:', error)
    return {
      advisories: [],
      visaRequirements: [],
      restaurants: [],
      airports: [],
    }
  }
}

// Load country GeoJSON data for polygons and borders
async function loadGeoData(): Promise<{ polygons: Array<PolyAdv | VisaPolygon>, borders: CountryBorder }> {
  try {
    // In server component, we need to read the file directly
    const filePath = path.join(process.cwd(), 'public', 'datamaps.world.json')
    const fileContent = await fs.readFile(filePath, 'utf8')
    const data = JSON.parse(fileContent)
    
    if (data.features && Array.isArray(data.features)) {
      // Convert GeoJSON features to our polygon format
      const polygons = data.features.map((feature: any) => ({
        type: 'Feature',
        properties: {
          name: feature.properties.name || feature.properties.NAME || '',
          iso_a2: feature.properties.iso_a2 || feature.properties.ISO_A2 || '',
          iso_a3: feature.properties.iso_a3 || feature.properties.ISO_A3 || '',
        },
        geometry: feature.geometry,
      }))
      
      // For borders, we'll use the same data
      const borders: CountryBorder = {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [] },
        properties: { iso_a2: 'WORLD' }
      }
      
      return { polygons, borders }
    }
    
    return { 
      polygons: [], 
      borders: { 
        type: 'Feature', 
        geometry: { type: 'Polygon', coordinates: [] }, 
        properties: { iso_a2: 'US' } 
      } 
    }
  } catch (error) {
    console.error('Failed to load geo data:', error)
    return { 
      polygons: [], 
      borders: { 
        type: 'Feature', 
        geometry: { type: 'Polygon', coordinates: [] }, 
        properties: { iso_a2: 'US' } 
      } 
    }
  }
}

// Transform raw data to match component expectations
function transformData(rawData: any, geoData: any) {
  // Transform travel advisories to PolyAdv format
  const advisoryPolygons: PolyAdv[] = rawData.advisories.map((doc: any) => {
    const countryName = doc.country?.name || doc.title || ''
    const countryCode = doc.country?.iso2 || doc.countryTag || ''
    
    // Find matching polygon from geo data
    const matchingPolygon = geoData.polygons.find((p: any) => 
      p.properties.name === countryName || 
      p.properties.NAME === countryName ||
      p.properties.iso_a2 === countryCode
    )
    
    if (matchingPolygon) {
      return {
        ...matchingPolygon,
        level: doc.threatLevel || doc.level || 1,
        country: countryName,
        dateAdded: doc.pubDate || doc.updatedAt || new Date().toISOString(),
      }
    }
    
    return null
  }).filter(Boolean)

  // Transform visa requirements to CountryVisaData format
  const visaCountriesMap = new Map<string, CountryVisaData>()
  
  // Group visa requirements by passport country
  rawData.visaRequirements.forEach((doc: any) => {
    const passportCountry = doc.country?.name || ''
    const destinationCountry = doc.destinationCountry || ''
    
    if (!passportCountry) return
    
    if (!visaCountriesMap.has(passportCountry)) {
      visaCountriesMap.set(passportCountry, {
        countryId: doc.country?.id || doc.id,
        countryName: passportCountry,
        countryCode: doc.country?.iso2 || '',
        countryFlag: doc.country?.flag || '',
        totalDestinations: 0,
        visaRequirements: [],
      })
    }
    
    const countryData = visaCountriesMap.get(passportCountry)!
    countryData.visaRequirements.push({
      passportCountry,
      destinationCountry,
      requirement: (doc.requirement || 'visa_required') as VisaRequirementCode,
      allowedStay: doc.duration ? `${doc.duration} days` : '',
      notes: doc.details || '',
    })
    countryData.totalDestinations++
  })
  
  const visaCountries = Array.from(visaCountriesMap.values())

  // Transform travel advisories to AdvisoryCountry format
  const advisoryCountries: AdvisoryCountry[] = rawData.advisories.map((doc: any) => ({
    country: doc.country?.name || doc.title || '',
    countryFlag: doc.country?.flag || '',
    level: doc.threatLevel || doc.level || 1,
    advisoryText: doc.description || doc.summary || '',
    dateAdded: doc.pubDate || doc.updatedAt || new Date().toISOString(),
  }))

  // Transform restaurants
  const restaurantData: MichelinRestaurantData[] = rawData.restaurants.map((doc: any) => ({
    id: doc.id,
    name: doc.name || '',
    rating: doc.stars || 1,
    cuisine: doc.cuisine || '',
    location: {
      lat: doc.location?.coordinates?.[1] || doc.latitude || 0,
      lng: doc.location?.coordinates?.[0] || doc.longitude || 0,
      city: doc.city || '',
      country: doc.country?.name || doc.country || '',
      countryFlag: doc.country?.flag || '',
    },
    greenStar: doc.greenStar || false,
    description: doc.description || `${doc.stars || 1} Michelin star${doc.stars > 1 ? 's' : ''} restaurant`,
  }))

  // Transform airports
  const airportData: AirportData[] = rawData.airports.map((doc: any) => ({
    code: doc.iataCode || doc.code || '',
    name: doc.name || '',
    location: {
      lat: doc.location?.coordinates?.[1] || doc.latitude || 0,
      lng: doc.location?.coordinates?.[0] || doc.longitude || 0,
      city: doc.city || '',
      country: doc.country?.name || doc.country || '',
      countryFlag: doc.country?.flag || '',
    },
  }))

  // Create visa polygons (for visa view)
  const visaPolygons: VisaPolygon[] = geoData.polygons.map((polygon: any) => ({
    ...polygon,
    requirement: 'visa_required' as VisaRequirementCode, // Default, will be updated based on selection
  }))

  return {
    polygons: [...advisoryPolygons, ...visaPolygons],
    borders: geoData.borders,
    airports: airportData,
    restaurants: restaurantData,
    travelAdvisories: advisoryCountries,
    visaRequirements: visaCountries,
  }
}

export async function TravelDataGlobeBlock(props: any) {
  // Fetch all data server-side
  const [collectionData, geoData] = await Promise.all([
    fetchCollectionData(),
    loadGeoData()
  ])
  
  // Transform the data
  const transformedData = transformData(collectionData, geoData)
  
  // Combine with block config
  const blockProps: TravelDataGlobeBlockProps = {
    blockConfig: {
      ...props,
      enabledViews: props.enabledViews || ['travelAdvisory', 'visaRequirements', 'michelinRestaurants', 'airports'],
      initialView: props.initialView || 'travelAdvisory',
      globeImageUrl: props.globeImageUrl || '/earth-blue-marble.jpg',
      bumpImageUrl: props.bumpImageUrl || '/earth-topology.png',
      autoRotateSpeed: props.autoRotateSpeed || 0.5,
      atmosphereColor: props.atmosphereColor || '#3a7ca5',
      atmosphereAltitude: props.atmosphereAltitude || 0.15,
      enableGlassEffect: props.enableGlassEffect !== false,
      marqueeText: props.marqueeText || "Sweet Serenity Getaways  • 🦋 • Travel Tools • 🦋 •",
      tabIndicatorColor: props.tabIndicatorColor || '#81d6e3',
    },
    ...transformedData,
  }
  
  return <TravelDataGlobeBlockClient {...blockProps} />
}