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
  CountryBorder,
  AdvisoryLevel,
  VisaData
} from './types'

// Type definitions for Payload documents
type LooseCountry = Partial<{
  flag: string
  countryFlag: string
  iso2: string
  iso_a2: string
  code: string
  name: string
}>

type AdvisoryDoc = {
  country?: { name?: string; code?: string; flag?: string }
  name?: string
  level?: number
  advisoryLevel?: number
  advisory_level?: number
  travelAdvisoryLevel?: number
  travel_advisory_level?: number
  threatLevel?: string
  description?: string
  advisoryText?: string
  advisory_text?: string
  dateAdded?: string
  date_added?: string
  pubDate?: string
  createdAt?: string
}

type VisaDoc = {
  passportCountry?: { name?: string }
  destinationCountry?: { name?: string; code?: string; flag?: string }
  requirement: VisaData['requirement']
  days?: number
  notes?: string
}

type AirportDoc = {
  code: string
  name: string
  type?: string
  location?: {
    lat?: number
    lng?: number
    city?: string
    country?: string
  }
}

type RestaurantDoc = {
  id: string
  name: string
  rating?: number
  cuisine?: string
  location?: {
    lat?: number
    lng?: number
    city?: string
    country?: string
  }
  greenStar?: boolean
  description?: string
}

// Server-side helper functions
const isNewAdvisory = (dateAdded: string | undefined): boolean => {
  if (!dateAdded) return false
  const date = new Date(dateAdded)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 30
}

const getFlagUrl = (country: LooseCountry): string => {
  // Pre-compute flag URLs server-side
  if (country?.flag) return `/flags/${country.flag}`
  if (country?.countryFlag) return `/flags/${country.countryFlag}`
  if (country?.iso2) return `/flags/${country.iso2.toLowerCase()}.svg`
  if (country?.iso_a2) return `/flags/${country.iso_a2.toLowerCase()}.svg`
  if (country?.code) return `/flags/${country.code.toLowerCase()}.svg`
  
  // Fallback to country name mapping
  const name = (country?.name || '').toLowerCase().trim()
  const countryMap: Record<string, string> = {
    'united states': 'us', 'united states of america': 'us', 'usa': 'us',
    'united kingdom': 'gb', 'uk': 'gb', 'great britain': 'gb',
    'south korea': 'kr', 'republic of korea': 'kr',
    'north korea': 'kp', 'china': 'cn', 'peoples republic of china': 'cn',
    'japan': 'jp', 'germany': 'de', 'france': 'fr', 'italy': 'it', 'spain': 'es',
    'russia': 'ru', 'russian federation': 'ru',
    'brazil': 'br', 'india': 'in', 'mexico': 'mx',
    'canada': 'ca', 'australia': 'au', 'netherlands': 'nl', 'belgium': 'be',
    'switzerland': 'ch', 'sweden': 'se', 'norway': 'no', 'denmark': 'dk', 'finland': 'fi',
    'poland': 'pl', 'austria': 'at', 'portugal': 'pt', 'greece': 'gr', 'turkey': 'tr',
    'egypt': 'eg', 'south africa': 'za', 'nigeria': 'ng', 'kenya': 'ke', 'morocco': 'ma',
    'argentina': 'ar', 'chile': 'cl', 'colombia': 'co', 'peru': 'pe', 'venezuela': 've',
    'thailand': 'th', 'vietnam': 'vn', 'singapore': 'sg', 'malaysia': 'my',
    'indonesia': 'id', 'philippines': 'ph', 'new zealand': 'nz', 'ireland': 'ie',
    'israel': 'il', 'saudi arabia': 'sa', 'united arab emirates': 'ae', 'uae': 'ae',
    'qatar': 'qa', 'kuwait': 'kw', 'pakistan': 'pk', 'bangladesh': 'bd', 'sri lanka': 'lk',
    'ukraine': 'ua', 'czech republic': 'cz', 'czechia': 'cz',
    'romania': 'ro', 'hungary': 'hu', 'croatia': 'hr', 'serbia': 'rs',
    'bulgaria': 'bg', 'slovakia': 'sk', 'slovenia': 'si',
    'lithuania': 'lt', 'latvia': 'lv', 'estonia': 'ee', 'iceland': 'is',
    'luxembourg': 'lu', 'malta': 'mt', 'cyprus': 'cy',
  }
  
  return countryMap[name] ? `/flags/${countryMap[name]}.svg` : '/flags/un.svg'
}

// Helper to convert to AdvisoryLevel
const toAdvisoryLevel = (n: number | undefined): AdvisoryLevel => {
  const v = typeof n === 'number' ? Math.min(4, Math.max(1, n)) : 1
  return v as AdvisoryLevel
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
  const countryLookup = new Map<string, LooseCountry>()
  ;(countriesResult.docs as LooseCountry[]).forEach((country) => {
    if (country.name) countryLookup.set(country.name.toLowerCase(), country)
    if (country.code) countryLookup.set(country.code.toLowerCase(), country)
  })

  // Transform travel advisories with pre-computed values
  const transformedAdvisories: AdvisoryCountry[] = (advisoriesResult.docs as AdvisoryDoc[])
    .map((doc, index): AdvisoryCountry => {
      // Debug logging for the first few documents to see actual structure
      if (index < 3) {
        console.log(`\nAdvisory doc ${index} structure:`, {
          keys: Object.keys(doc),
          level: doc.level,
          advisoryLevel: doc.advisoryLevel, 
          threatLevel: doc.threatLevel,
          // Log the entire doc for first one to see all fields
          ...(index === 0 ? { fullDoc: doc } : {})
        })
      }
      
      const countryName = doc.country?.name || doc.name || 'Unknown'
      const countryData = countryLookup.get(countryName.toLowerCase()) || 
                         (doc.country as LooseCountry | undefined) || 
                         { name: countryName }
      
      // Try different possible field names for level
      // Also check if level might be a string that needs parsing
      let levelRaw = doc.level || 
                    doc.advisoryLevel || 
                    doc.advisory_level || 
                    doc.travelAdvisoryLevel || 
                    doc.travel_advisory_level
      
      // If still no level found, try threatLevel as either string or number
      if (!levelRaw && doc.threatLevel) {
        levelRaw = typeof doc.threatLevel === 'string' ? parseInt(doc.threatLevel, 10) : doc.threatLevel
      }
      
      // If STILL no level, check if it might be nested in the doc differently
      if (!levelRaw) {
        // Check for any field containing 'level' or 'threat'
        const levelField = Object.keys(doc).find(key => 
          key.toLowerCase().includes('level') || 
          key.toLowerCase().includes('threat')
        )
        if (levelField && doc[levelField]) {
          const value = doc[levelField]
          levelRaw = typeof value === 'string' ? parseInt(value, 10) : value
          console.log(`Found level in field '${levelField}':`, levelRaw)
        }
      }
      
      // Default to 1 if still no level found
      if (!levelRaw) {
        console.warn(`No level found for ${countryName}, defaulting to 1`)
        levelRaw = 1
      }
      
      // Ensure level is properly typed as AdvisoryLevel
      const level = toAdvisoryLevel(levelRaw)
      
      return {
        country: countryName,
        countryCode: countryData?.code || '',
        countryFlag: getFlagUrl(countryData),
        level,
        advisoryText: doc.description || doc.advisoryText || doc.advisory_text || '',
        dateAdded: doc.dateAdded || doc.date_added || doc.pubDate || doc.createdAt || '',
        isNew: isNewAdvisory(doc.dateAdded || doc.date_added || doc.pubDate || doc.createdAt),
        levelText: `Level ${level}`,
        levelDescription: 
          level === 1 ? 'Exercise Normal Precautions' :
          level === 2 ? 'Exercise Increased Caution' :
          level === 3 ? 'Reconsider Travel' :
          'Do Not Travel',
      }
    })
    .sort((a, b) => {
      if (a.level !== b.level) return b.level - a.level
      return a.country.localeCompare(b.country)
    })

  // Transform visa data
  const visaByCountry = new Map<string, CountryVisaData>()
  const passportCountries = new Set<string>()

  ;(visaResult.docs as VisaDoc[]).forEach((doc) => {
    const passportName = doc.passportCountry?.name || ''
    const destinationName = doc.destinationCountry?.name || ''
    
    if (passportName) {
      passportCountries.add(passportName)
    }
    
    if (!visaByCountry.has(destinationName)) {
      const countryData = countryLookup.get(destinationName.toLowerCase()) || 
                         (doc.destinationCountry as LooseCountry | undefined)
      visaByCountry.set(destinationName, {
        countryId: `visa-${destinationName}`,
        countryName: destinationName,
        countryCode: countryData?.code || '',
        countryFlag: getFlagUrl(countryData || { name: destinationName }),
        totalDestinations: 0,
        visaFreeCount: 0,
        visaOnArrivalCount: 0,
        eVisaCount: 0,
        visaRequiredCount: 0,
        visaRequirements: [],
      })
    }
    
    const country = visaByCountry.get(destinationName)!
    country.totalDestinations++
    
    switch (doc.requirement) {
      case 'visa_free':
        country.visaFreeCount! += 1
        break
      case 'visa_on_arrival':
        country.visaOnArrivalCount! += 1
        break
      case 'e_visa':
      case 'eta':
        country.eVisaCount! += 1
        break
      default:
        country.visaRequiredCount! += 1
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
    .sort((a, b) => (a.countryName || 'Unknown').localeCompare(b.countryName || 'Unknown'))

  // Transform airports
  const transformedAirports: AirportData[] = (airportsResult.docs as unknown as AirportDoc[])
    .map((doc) => {
      const countryName = doc.location?.country || ''
      const countryData = countryLookup.get(countryName.toLowerCase())
      return {
        code: doc.code,
        name: doc.name,
        type: doc.type,
        location: {
          lat: doc.location?.lat || 0,
          lng: doc.location?.lng || 0,
          city: doc.location?.city || '',
          country: countryName,
          countryFlag: getFlagUrl(countryData || { name: countryName }),
        },
        displayName: `${doc.code} - ${doc.name}`,
        displayLocation: `${doc.location?.city || ''}, ${countryName}`,
      }
    })
    .sort((a, b) => (a.code || '').localeCompare(b.code || ''))

  // Transform restaurants
  const transformedRestaurants: MichelinRestaurantData[] = (restaurantsResult.docs as unknown as RestaurantDoc[])
    .map((doc) => {
      const countryName = doc.location?.country || ''
      const countryData = countryLookup.get(countryName.toLowerCase())
      const rating = doc.rating || 1
      return {
        id: doc.id,
        name: doc.name,
        rating,
        cuisine: doc.cuisine || '',
        location: {
          lat: doc.location?.lat || 0,
          lng: doc.location?.lng || 0,
          city: doc.location?.city || '',
          country: countryName,
          countryFlag: getFlagUrl(countryData || { name: countryName }),
        },
        greenStar: !!doc.greenStar,
        description: doc.description,
        displayRating: '⭐'.repeat(rating),
        displayLocation: `${doc.location?.city || ''}, ${countryName}`,
      }
    })
    .sort((a, b) => {
      if (a.rating !== b.rating) return b.rating - a.rating
      return a.name.localeCompare(b.name)
    })

  // Initialize empty polygons and borders (will be populated client-side)
  const polygons = {
    advisory: [] as PolyAdv[],
    visa: [] as VisaPolygon[],
  }
  const borders: CountryBorder = {
    type: 'Feature',
    geometry: {
      type: 'MultiPolygon',
      coordinates: [],
    },
    properties: {
      iso_a2: '',
      name: '',
    },
  }

  // Calculate statistics
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

  // Prepare data for client component
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
      'airports',
    ],
  }

  // Dynamic import to reduce bundle size
  const { TravelDataGlobeWrapper } = await import('./Component.wrapper')
  
  return <TravelDataGlobeWrapper data={preparedData} />
}
