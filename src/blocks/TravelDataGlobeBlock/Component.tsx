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
  
  // Debug logging
  console.log('Server: Processing visa requirements:', rawData.visaRequirements.length)
  if (rawData.visaRequirements.length > 0) {
    console.log('Server: Sample visa requirement:', rawData.visaRequirements[0])
    console.log('Server: Sample visa requirement keys:', Object.keys(rawData.visaRequirements[0]))
  }
  
  // Group visa requirements by passport country
  rawData.visaRequirements.forEach((doc: any, index: number) => {
    // Log first few docs to understand structure
    if (index < 3) {
      console.log(`Server: Visa doc ${index} structure:`, {
        keys: Object.keys(doc),
        passportCountry: doc.passportCountry,
        destinationCountry: doc.destinationCountry,
        id: doc.id
      })
    }
    
    // Extract passport country name - handle both string and object formats
    let passportCountryName = ''
    if (typeof doc.passportCountry === 'string') {
      passportCountryName = doc.passportCountry
    } else if (doc.passportCountry?.name) {
      passportCountryName = doc.passportCountry.name
    } else if (doc.passport_country) {
      passportCountryName = typeof doc.passport_country === 'string' ? doc.passport_country : doc.passport_country.name || ''
    } else if (doc.country?.name) {
      passportCountryName = doc.country.name
    } else if (doc.countryName) {
      passportCountryName = doc.countryName
    } else if (doc.from_country) {
      passportCountryName = typeof doc.from_country === 'string' ? doc.from_country : doc.from_country.name || ''
    }
    
    // Extract destination country name - handle both string and object formats
    let destinationCountryName = ''
    if (typeof doc.destinationCountry === 'string') {
      destinationCountryName = doc.destinationCountry
    } else if (doc.destinationCountry?.name) {
      destinationCountryName = doc.destinationCountry.name
    } else if (doc.destination_country) {
      destinationCountryName = typeof doc.destination_country === 'string' ? doc.destination_country : doc.destination_country.name || ''
    } else if (doc.destination) {
      destinationCountryName = typeof doc.destination === 'string' ? doc.destination : doc.destination.name || ''
    } else if (doc.to_country) {
      destinationCountryName = typeof doc.to_country === 'string' ? doc.to_country : doc.to_country.name || ''
    }
    
    if (!passportCountryName || !destinationCountryName) {
      if (!passportCountryName) {
        console.log('Server: Missing passport country in doc:', Object.keys(doc), doc.passportCountry, doc.passport_country, doc.country)
      }
      if (!destinationCountryName) {
        console.log('Server: Missing destination country in doc:', Object.keys(doc), doc.destinationCountry, doc.destination_country, doc.destination)
      }
      return
    }
    
    // Extract country code and flag from passport country object if available
    const countryCode = doc.passportCountry?.iso2 || doc.passportCountry?.iso_a2 || 
                       doc.passport_country?.iso2 || doc.country?.iso2 || 
                       doc.countryCode || doc.country_code || ''
    const countryFlag = doc.passportCountry?.flag || doc.passport_country?.flag || 
                       doc.country?.flag || doc.flag || ''
    
    if (!visaCountriesMap.has(passportCountryName)) {
      visaCountriesMap.set(passportCountryName, {
        countryId: doc.id || `visa-${passportCountryName}`,
        countryName: passportCountryName,
        countryCode: countryCode,
        countryFlag: countryFlag,
        totalDestinations: 0,
        visaRequirements: [],
      })
    }
    
    const countryData = visaCountriesMap.get(passportCountryName)!
    countryData.visaRequirements.push({
      passportCountry: passportCountryName,
      destinationCountry: destinationCountryName,
      requirement: (doc.requirement || doc.visa_type || doc.visaType || 'visa_required') as VisaRequirementCode,
      allowedStay: doc.allowedStay || doc.allowed_stay || doc.duration ? `${doc.duration || doc.allowedStay || doc.allowed_stay} days` : '',
      notes: doc.notes || doc.details || '',
    })
    countryData.totalDestinations++
  })
  
  const visaCountries = Array.from(visaCountriesMap.values())
  console.log('Server: Transformed visa countries:', visaCountries.length)
  console.log('Server: Unique passport countries found:', Array.from(visaCountriesMap.keys()).slice(0, 10))
  if (visaCountries.length > 0) {
    console.log('Server: First visa country:', visaCountries[0])
  }

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
  
  // Debug: Log the fetched data
  console.log('TravelDataGlobe - Visa Requirements fetched:', collectionData.visaRequirements?.length || 0)
  console.log('TravelDataGlobe - Travel Advisories fetched:', collectionData.advisories?.length || 0)
  
  // Transform the data
  const transformedData = transformData(collectionData, geoData)
  
  // Debug: Log transformed data
  console.log('TravelDataGlobe - Transformed visa countries:', transformedData.visaRequirements?.length || 0)
  
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