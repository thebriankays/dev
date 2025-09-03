import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { 
  TravelDataGlobeBlockProps, 
  PreparedData,
  AdvisoryCountry,
  CountryVisaData,
  AirportData,
  MichelinRestaurantData,
  PolyAdv,
  VisaPolygon,
  CountryBorder
} from './types'

// Server-side helper functions
const isNewAdvisory = (dateAdded: string | undefined): boolean => {
  if (!dateAdded) return false
  const date = new Date(dateAdded)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 30
}

const getFlagUrl = (country: any): string => {
  // Pre-compute flag URLs server-side
  if (country?.flag) return `/flags/${country.flag}`
  if (country?.countryFlag) return `/flags/${country.countryFlag}`
  if (country?.iso2) return `/flags/${country.iso2.toLowerCase()}.svg`
  if (country?.iso_a2) return `/flags/${country.iso_a2.toLowerCase()}.svg`
  if (country?.code) return `/flags/${country.code.toLowerCase()}.svg`
  
  // Fallback to country name mapping
  const name = (country?.name || '').toLowerCase().trim()
  const countryMap: Record<string, string> = {
    'united states': 'us',
    'united states of america': 'us',
    'usa': 'us',
    'united kingdom': 'gb',
    'uk': 'gb',
    'great britain': 'gb',
    'south korea': 'kr',
    'republic of korea': 'kr',
    'north korea': 'kp',
    'china': 'cn',
    'peoples republic of china': 'cn',
    'japan': 'jp',
    'germany': 'de',
    'france': 'fr',
    'italy': 'it',
    'spain': 'es',
    'russia': 'ru',
    'russian federation': 'ru',
    'brazil': 'br',
    'india': 'in',
    'mexico': 'mx',
    'canada': 'ca',
    'australia': 'au',
    'netherlands': 'nl',
    'belgium': 'be',
    'switzerland': 'ch',
    'sweden': 'se',
    'norway': 'no',
    'denmark': 'dk',
    'finland': 'fi',
    'poland': 'pl',
    'austria': 'at',
    'portugal': 'pt',
    'greece': 'gr',
    'turkey': 'tr',
    'egypt': 'eg',
    'south africa': 'za',
    'nigeria': 'ng',
    'kenya': 'ke',
    'morocco': 'ma',
    'argentina': 'ar',
    'chile': 'cl',
    'colombia': 'co',
    'peru': 'pe',
    'venezuela': 've',
    'thailand': 'th',
    'vietnam': 'vn',
    'singapore': 'sg',
    'malaysia': 'my',
    'indonesia': 'id',
    'philippines': 'ph',
    'new zealand': 'nz',
    'ireland': 'ie',
    'israel': 'il',
    'saudi arabia': 'sa',
    'united arab emirates': 'ae',
    'uae': 'ae',
    'qatar': 'qa',
    'kuwait': 'kw',
    'pakistan': 'pk',
    'bangladesh': 'bd',
    'sri lanka': 'lk',
    'ukraine': 'ua',
    'czech republic': 'cz',
    'czechia': 'cz',
    'romania': 'ro',
    'hungary': 'hu',
    'croatia': 'hr',
    'serbia': 'rs',
    'bulgaria': 'bg',
    'slovakia': 'sk',
    'slovenia': 'si',
    'lithuania': 'lt',
    'latvia': 'lv',
    'estonia': 'ee',
    'iceland': 'is',
    'luxembourg': 'lu',
    'malta': 'mt',
    'cyprus': 'cy',
  }
  
  return countryMap[name] ? `/flags/${countryMap[name]}.svg` : '/flags/un.svg'
}

// Server Component - Fetches and transforms ALL data
export async function TravelDataGlobeBlock(props: TravelDataGlobeBlockProps) {
  const payload = await getPayload({ config })
  
  // Parallel fetch all collections
  const [
    advisoriesResult,
    visaResult,
    airportsResult,
    restaurantsResult,
    countriesResult
  ] = await Promise.all([
    payload.find({
      collection: 'travel-advisories',
      limit: 1000,
      sort: '-level',
      depth: 2,
    }),
    payload.find({
      collection: 'visa-requirements',
      limit: 2000,
      depth: 2,
    }),
    payload.find({
      collection: 'airports',
      limit: 1000,
      depth: 1,
    }),
    payload.find({
      collection: 'michelin-restaurants',
      limit: 1000,
      depth: 1,
    }),
    payload.find({
      collection: 'countries',
      limit: 500,
      depth: 1,
    }).catch(() => ({ docs: [], totalDocs: 0 })), // Fallback if countries collection doesn't exist
  ])

  console.log('Server: Data fetched -', {
    advisories: advisoriesResult.totalDocs,
    visa: visaResult.totalDocs,
    airports: airportsResult.totalDocs,
    restaurants: restaurantsResult.totalDocs,
    countries: countriesResult.totalDocs,
  })

  // Build country lookup map
  const countryLookup = new Map()
  countriesResult.docs.forEach((country: any) => {
    countryLookup.set(country.name?.toLowerCase(), country)
    if (country.code) countryLookup.set(country.code.toLowerCase(), country)
  })

  // Debug: Log first advisory to see structure
  if (advisoriesResult.docs.length > 0) {
    console.log('Sample advisory doc:', JSON.stringify(advisoriesResult.docs[0], null, 2))
  }

  // Transform travel advisories with pre-computed values
  const transformedAdvisories: AdvisoryCountry[] = advisoriesResult.docs.map((doc: any) => {
    const countryName = doc.country?.name || doc.name || 'Unknown'
    const countryData = countryLookup.get(countryName.toLowerCase()) || doc.country || doc
    
    // Try different possible field names for level
    const level = doc.level || doc.advisoryLevel || doc.advisory_level || 
                  doc.travelAdvisoryLevel || doc.travel_advisory_level || 1
    
    // Ensure level is a number between 1-4
    const validLevel = typeof level === 'number' ? Math.min(4, Math.max(1, level)) : 1
    
    return {
      country: countryName,
      countryCode: countryData?.code || '',
      countryFlag: getFlagUrl(countryData),
      level: validLevel,
      advisoryText: doc.description || doc.advisoryText || doc.advisory_text || '',
      dateAdded: doc.dateAdded || doc.date_added || doc.createdAt,
      isNew: isNewAdvisory(doc.dateAdded || doc.date_added || doc.createdAt),
      // Pre-compute display values
      levelText: `Level ${validLevel}`,
      levelDescription: 
        validLevel === 1 ? 'Exercise Normal Precautions' :
        validLevel === 2 ? 'Exercise Increased Caution' :
        validLevel === 3 ? 'Reconsider Travel' :
        'Do Not Travel',
    }
  }).sort((a, b) => {
    // Sort by level (highest first), then by name
    if (a.level !== b.level) return b.level - a.level
    // Handle undefined country names
    const aCountry = a.country || 'Unknown'
    const bCountry = b.country || 'Unknown'
    return aCountry.localeCompare(bCountry)
  })

  // Transform visa requirements into country-centric data
  const visaByCountry = new Map<string, CountryVisaData>()
  const passportCountries = new Set<string>()
  
  visaResult.docs.forEach((doc: any) => {
    const passportName = doc.passportCountry?.name || ''
    const destinationName = doc.destinationCountry?.name || ''
    
    if (passportName) passportCountries.add(passportName)
    
    // Group by destination country (for showing all countries)
    if (!visaByCountry.has(destinationName)) {
      const countryData = countryLookup.get(destinationName.toLowerCase()) || doc.destinationCountry
      visaByCountry.set(destinationName, {
        countryId: `visa-${destinationName}`,
        countryName: destinationName,
        countryCode: countryData?.code || '',
        countryFlag: getFlagUrl(countryData),
        totalDestinations: 0,
        visaFreeCount: 0,
        visaOnArrivalCount: 0,
        eVisaCount: 0,
        visaRequiredCount: 0,
        visaRequirements: []
      })
    }
    
    const country = visaByCountry.get(destinationName)!
    country.totalDestinations++
    
    // Count visa types
    switch(doc.requirement) {
      case 'visa_free':
        country.visaFreeCount = (country.visaFreeCount || 0) + 1
        break
      case 'visa_on_arrival':
        country.visaOnArrivalCount = (country.visaOnArrivalCount || 0) + 1
        break
      case 'e_visa':
      case 'eta':
        country.eVisaCount = (country.eVisaCount || 0) + 1
        break
      default:
        country.visaRequiredCount = (country.visaRequiredCount || 0) + 1
    }
    
    country.visaRequirements.push({
      passportCountry: passportName,
      destinationCountry: destinationName,
      destinationCountryCode: country.countryCode,
      destinationCountryFlag: country.countryFlag,
      requirement: doc.requirement,
      allowedStay: doc.days ? `${doc.days} days` : undefined,
      notes: doc.notes,
    })
  })

  const visaCountries = Array.from(visaByCountry.values())
    .sort((a, b) => {
      const aName = a.countryName || 'Unknown'
      const bName = b.countryName || 'Unknown'
      return aName.localeCompare(bName)
    })

  // Transform airports with pre-computed values
  const transformedAirports: AirportData[] = airportsResult.docs.map((doc: any) => {
    const countryName = doc.location?.country || ''
    const countryData = countryLookup.get(countryName.toLowerCase())
    
    return {
      code: doc.code,
      name: doc.name,
      location: {
        lat: doc.location?.lat || 0,
        lng: doc.location?.lng || 0,
        city: doc.location?.city || '',
        country: countryName,
        countryFlag: getFlagUrl(countryData || doc.location),
      },
      // Pre-compute display text
      displayName: `${doc.code} - ${doc.name}`,
      displayLocation: `${doc.location?.city || ''}, ${countryName}`,
    }
  }).sort((a, b) => {
    const aCode = a.code || ''
    const bCode = b.code || ''
    return aCode.localeCompare(bCode)
  })

  // Transform restaurants with pre-computed values
  const transformedRestaurants: MichelinRestaurantData[] = restaurantsResult.docs.map((doc: any) => {
    const countryName = doc.location?.country || ''
    const countryData = countryLookup.get(countryName.toLowerCase())
    
    return {
      id: doc.id,
      name: doc.name,
      rating: doc.rating || 1,
      cuisine: doc.cuisine || '',
      location: {
        lat: doc.location?.lat || 0,
        lng: doc.location?.lng || 0,
        city: doc.location?.city || '',
        country: countryName,
        countryFlag: getFlagUrl(countryData || doc.location),
      },
      greenStar: doc.greenStar || false,
      description: doc.description,
      // Pre-compute display values
      displayRating: '⭐'.repeat(doc.rating || 1),
      displayLocation: `${doc.location?.city || ''}, ${countryName}`,
    }
  }).sort((a, b) => {
    // Sort by rating (highest first), then by name
    if (a.rating !== b.rating) return b.rating - a.rating
    const aName = a.name || ''
    const bName = b.name || ''
    return aName.localeCompare(bName)
  })

  // Load actual country polygons from GeoJSON
  const polygons = {
    advisory: [] as PolyAdv[],
    visa: [] as VisaPolygon[],
  }
  
  // Create empty borders object for now - will be loaded client-side
  const borders: CountryBorder = {
    type: 'Feature',
    geometry: {
      type: 'MultiPolygon',
      coordinates: []
    },
    properties: {
      iso_a2: '',
      name: ''
    }
  }
  
  // For now, create empty polygons - in production, load this at build time
  // The client component will load the actual data
  // This avoids server-side import issues

  // Pre-compute statistics
  const statistics = {
    totalAdvisories: transformedAdvisories.length,
    level4Count: transformedAdvisories.filter(a => a.level === 4).length,
    level3Count: transformedAdvisories.filter(a => a.level === 3).length,
    level2Count: transformedAdvisories.filter(a => a.level === 2).length,
    level1Count: transformedAdvisories.filter(a => a.level === 1).length,
    newAdvisoriesCount: transformedAdvisories.filter(a => a.isNew).length,
    totalVisaCountries: visaCountries.length,
    passportCountriesCount: passportCountries.size,
    totalAirports: transformedAirports.length,
    totalRestaurants: transformedRestaurants.length,
    michelinStarredCount: transformedRestaurants.filter(r => r.rating >= 1).length,
    greenStarCount: transformedRestaurants.filter(r => r.greenStar).length,
  }

  // Package all data for the client
  const preparedData: PreparedData = {
    advisories: transformedAdvisories,
    visaCountries,
    airports: transformedAirports,
    restaurants: transformedRestaurants,
    polygons,
    borders,
    statistics,
    blockConfig: props.blockConfig || {},
    enabledViews: props.blockConfig?.enabledViews || [
      'travelAdvisory',
      'visaRequirements', 
      'michelinRestaurants',
      'airports'
    ],
  }

  // Use the wrapper component that properly handles BlockWrapper
  const { TravelDataGlobeWrapper } = await import('./Component.wrapper')
  return <TravelDataGlobeWrapper data={preparedData} />
}
