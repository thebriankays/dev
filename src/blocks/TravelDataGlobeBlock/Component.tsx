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
  VisaData,
} from './types'

// Types for Payload docs
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
  threatLevel?: string | number
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

// Updated to match actual Payload Airport collection structure
type AirportDoc = {
  id: number | string
  name: string
  iata?: string  // IATA code (3-letter)
  icao?: string  // ICAO code (4-letter)
  city: string
  country?: { name?: string; code?: string } | string
  latitude: number
  longitude: number
  type?: string
  elevation?: number
}

// Updated to match actual Payload MichelinRestaurant collection structure
type RestaurantDoc = {
  id: number | string  // Payload returns number IDs
  name: string
  rating?: number
  cuisine?: string
  location?: {
    latitude?: number
    longitude?: number
    city?: string
    address?: string
  }
  country?: { name?: string } | string
  greenStar?: boolean
  description?: string
}

const isNewAdvisory = (dateAdded: string | undefined): boolean => {
  if (!dateAdded) return false
  const date = new Date(dateAdded)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 30
}

const getFlagUrl = (country: LooseCountry): string => {
  if (country?.flag) return `/flags/${country.flag}`
  if (country?.countryFlag) return `/flags/${country.countryFlag}`
  if (country?.iso2) return `/flags/${country.iso2.toLowerCase()}.svg`
  if (country?.iso_a2) return `/flags/${country.iso_a2.toLowerCase()}.svg`
  if (country?.code) return `/flags/${country.code.toLowerCase()}.svg`
  const name = (country?.name || '').toLowerCase().trim()
  const countryMap: Record<string, string> = {
    'united states': 'us',
    'united states of america': 'us',
    usa: 'us',
    'united kingdom': 'gb',
    uk: 'gb',
    'great britain': 'gb',
    'south korea': 'kr',
    'republic of korea': 'kr',
    'north korea': 'kp',
    china: 'cn',
    'peoples republic of china': 'cn',
    japan: 'jp',
    germany: 'de',
    france: 'fr',
    italy: 'it',
    spain: 'es',
    russia: 'ru',
    'russian federation': 'ru',
    brazil: 'br',
    india: 'in',
    mexico: 'mx',
    canada: 'ca',
    australia: 'au',
    netherlands: 'nl',
    belgium: 'be',
    switzerland: 'ch',
    sweden: 'se',
    norway: 'no',
    denmark: 'dk',
    finland: 'fi',
    poland: 'pl',
    austria: 'at',
    portugal: 'pt',
    greece: 'gr',
    turkey: 'tr',
    egypt: 'eg',
    'south africa': 'za',
    nigeria: 'ng',
    kenya: 'ke',
    morocco: 'ma',
    argentina: 'ar',
    chile: 'cl',
    colombia: 'co',
    peru: 'pe',
    venezuela: 've',
    thailand: 'th',
    vietnam: 'vn',
    singapore: 'sg',
    malaysia: 'my',
    indonesia: 'id',
    philippines: 'ph',
    'new zealand': 'nz',
    ireland: 'ie',
    israel: 'il',
    'saudi arabia': 'sa',
    'united arab emirates': 'ae',
    uae: 'ae',
    qatar: 'qa',
    kuwait: 'kw',
    pakistan: 'pk',
    bangladesh: 'bd',
    'sri lanka': 'lk',
    ukraine: 'ua',
    'czech republic': 'cz',
    czechia: 'cz',
    romania: 'ro',
    hungary: 'hu',
    croatia: 'hr',
    serbia: 'rs',
    bulgaria: 'bg',
    slovakia: 'sk',
    slovenia: 'si',
    lithuania: 'lt',
    latvia: 'lv',
    estonia: 'ee',
    iceland: 'is',
    luxembourg: 'lu',
    malta: 'mt',
    cyprus: 'cy',
  }
  return countryMap[name] ? `/flags/${countryMap[name]}.svg` : '/flags/un.svg'
}

const toAdvisoryLevel = (n: number | undefined): AdvisoryLevel => {
  const v = typeof n === 'number' ? Math.min(4, Math.max(1, n)) : 1
  return v as AdvisoryLevel
}

export async function TravelDataGlobeBlock(props: TravelDataGlobeBlockProps) {
  const payload = await getPayload({ config })

  const [advisoriesResult, visaResult, airportsResult, restaurantsResult, countriesResult] =
    await Promise.all([
      payload.find({ collection: 'travel-advisories', limit: 1000, sort: '-level', depth: 2 }),
      payload.find({ collection: 'visa-requirements', limit: 2000, depth: 2 }),
      payload.find({ collection: 'airports', limit: 1000, depth: 1 }),
      payload.find({ collection: 'michelin-restaurants', limit: 1000, depth: 1 }),
      payload
        .find({ collection: 'countries', limit: 500, depth: 1 })
        .catch(() => ({ docs: [], totalDocs: 0 })),
    ])

  const countryLookup = new Map<string, LooseCountry>()
  ;(countriesResult.docs as LooseCountry[]).forEach((country) => {
    if (country.name) countryLookup.set(country.name.toLowerCase(), country)
    if (country.code) countryLookup.set(country.code.toLowerCase(), country)
  })

  const transformedAdvisories: AdvisoryCountry[] = (advisoriesResult.docs as AdvisoryDoc[])
    .map((doc): AdvisoryCountry => {

      const countryName = doc.country?.name || doc.name || 'Unknown'
      const countryData =
        countryLookup.get(countryName.toLowerCase()) ||
        (doc.country as LooseCountry | undefined) || { name: countryName }

      let levelRaw =
        doc.level ??
        doc.advisoryLevel ??
        doc.advisory_level ??
        doc.travelAdvisoryLevel ??
        doc.travel_advisory_level

      // also check threatLevel (string or number)
      if (!levelRaw && doc.threatLevel != null) {
        levelRaw =
          typeof doc.threatLevel === 'string'
            ? parseInt(doc.threatLevel, 10)
            : (doc.threatLevel as number)
      }

      // 🔧 TS7053-safe dynamic probe for any "*level*" field
      if (!levelRaw) {
        const levelField = Object.keys(doc).find((key) => {
          const k = key.toLowerCase()
          return k.includes('level') || k.includes('threat')
        })
        if (levelField) {
          const bag = doc as Record<string, unknown>
          const valueUnknown = bag[levelField]
          let parsed: number | undefined
          if (typeof valueUnknown === 'string') {
            const n = parseInt(valueUnknown, 10)
            if (Number.isFinite(n)) parsed = n
          } else if (typeof valueUnknown === 'number') {
            parsed = valueUnknown
          }
          if (typeof parsed === 'number') {
            levelRaw = parsed
            // Level found in field
          }
        }
      }

      if (!levelRaw) {
        // No level found, defaulting to 1
        levelRaw = 1
      }

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
          level === 1
            ? 'Exercise Normal Precautions'
            : level === 2
            ? 'Exercise Increased Caution'
            : level === 3
            ? 'Reconsider Travel'
            : 'Do Not Travel',
      }
    })
    .sort((a, b) => (a.level !== b.level ? b.level - a.level : a.country.localeCompare(b.country)))

  const visaByCountry = new Map<string, CountryVisaData>()
  const passportCountries = new Set<string>()

  ;(visaResult.docs as VisaDoc[]).forEach((doc) => {
    const passportName = doc.passportCountry?.name || ''
    const destinationName = doc.destinationCountry?.name || ''

    if (passportName) passportCountries.add(passportName)

    // FIX: Group by PASSPORT country, not destination!
    if (!visaByCountry.has(passportName)) {
      const countryData =
        countryLookup.get(passportName.toLowerCase()) ||
        (doc.passportCountry as LooseCountry | undefined)
      visaByCountry.set(passportName, {
        countryId: `visa-${passportName}`,
        countryName: passportName,
        countryCode: countryData?.code || '',
        countryFlag: getFlagUrl(countryData || { name: passportName }),
        totalDestinations: 0,
        visaFreeCount: 0,
        visaOnArrivalCount: 0,
        eVisaCount: 0,
        visaRequiredCount: 0,
        visaRequirements: [],
      })
    }

    const country = visaByCountry.get(passportName)!
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

    // Get destination country data for flag
    const destinationData =
      countryLookup.get(destinationName.toLowerCase()) ||
      (doc.destinationCountry as LooseCountry | undefined)

    country.visaRequirements.push({
      passportCountry: passportName,
      destinationCountry: destinationName,  // This should be the destination!
      destinationCountryCode: destinationData?.code || '',
      destinationCountryFlag: getFlagUrl(destinationData || { name: destinationName }),
      requirement: doc.requirement,
      allowedStay: doc.days ? `${doc.days} days` : undefined,
      notes: doc.notes,
    })
  })

  const visaCountries = Array.from(visaByCountry.values()).sort((a, b) =>
    (a.countryName || 'Unknown').localeCompare(b.countryName || 'Unknown')
  )

  const transformedAirports: AirportData[] = (airportsResult.docs as AirportDoc[]).map((doc) => {
    // Handle country which could be a relationship object or string
    const countryName = typeof doc.country === 'object' 
      ? doc.country?.name || ''
      : doc.country || ''
    const countryData = countryLookup.get(countryName.toLowerCase())
    const code = doc.iata || doc.icao || 'XXX'  // Use IATA preferably, fallback to ICAO
    
    return {
      code,
      name: doc.name,
      type: doc.type,
      location: {
        lat: doc.latitude || 0,
        lng: doc.longitude || 0,
        city: doc.city || '',
        country: countryName,
        countryFlag: getFlagUrl(countryData || { name: countryName }),
      },
      displayName: `${code} - ${doc.name}`,
      displayLocation: `${doc.city || ''}, ${countryName}`,
    }
  }).sort((a, b) => (a.code || '').localeCompare(b.code || ''))

  const transformedRestaurants: MichelinRestaurantData[] = (restaurantsResult.docs as RestaurantDoc[])
    .map((doc) => {
      // Handle country which could be a relationship object or string
      const countryName = typeof doc.country === 'object' 
        ? doc.country?.name || ''
        : doc.country || ''
      const countryData = countryLookup.get(countryName.toLowerCase())
      const rating = doc.rating || 1
      const cityName = doc.location?.city || ''
      
      return {
        id: String(doc.id),  // Convert to string for consistency
        name: doc.name,
        rating,
        cuisine: doc.cuisine || '',
        location: {
          lat: doc.location?.latitude || 0,
          lng: doc.location?.longitude || 0,
          city: cityName,
          country: countryName,
          countryFlag: getFlagUrl(countryData || { name: countryName }),
        },
        greenStar: !!doc.greenStar,
        description: doc.description,
        displayRating: '⭐'.repeat(rating),
        displayLocation: `${cityName}, ${countryName}`,
      }
    })
    .sort((a, b) => (a.rating !== b.rating ? b.rating - a.rating : a.name.localeCompare(b.name)))

  // empty shapes; client populates from /datamaps.world.json
  const polygons = { advisory: [] as PolyAdv[], visa: [] as VisaPolygon[] }
  const borders: CountryBorder = {
    type: 'Feature',
    geometry: { type: 'MultiPolygon', coordinates: [] },
    properties: { iso_a2: '', name: '' },
  }

  const statistics = {
    totalAdvisories: transformedAdvisories.length,
    level4Count: transformedAdvisories.filter((a) => a.level === 4).length,
    level3Count: transformedAdvisories.filter((a) => a.level === 3).length,
    level2Count: transformedAdvisories.filter((a) => a.level === 2).length,
    level1Count: transformedAdvisories.filter((a) => a.level === 1).length,
    newAdvisoriesCount: transformedAdvisories.filter((a) => a.isNew).length,
    totalVisaCountries: visaCountries.length,
    passportCountriesCount: passportCountries.size,
    totalAirports: transformedAirports.length,
    totalRestaurants: transformedRestaurants.length,
    michelinStarredCount: transformedRestaurants.filter((r) => r.rating >= 1).length,
    greenStarCount: transformedRestaurants.filter((r) => r.greenStar).length,
  }

  // Determine enabled views based on config
  const enabledViews = []
  if (props.blockConfig?.showTravelAdvisories !== false) enabledViews.push('travelAdvisory')
  if (props.blockConfig?.showVisaRequirements !== false) enabledViews.push('visaRequirements')
  if (props.blockConfig?.showMichelinRestaurants !== false) enabledViews.push('michelinRestaurants')
  if (props.blockConfig?.showAirports !== false) enabledViews.push('airports')
  
  // Default to all views if none are enabled
  if (enabledViews.length === 0) {
    enabledViews.push('travelAdvisory', 'visaRequirements', 'michelinRestaurants', 'airports')
  }

  const preparedData: PreparedData = {
    advisories: transformedAdvisories,
    visaCountries,
    airports: transformedAirports,
    restaurants: transformedRestaurants,
    polygons,
    borders,
    statistics,
    blockConfig: props.blockConfig || {},
    enabledViews,
  }

  const { TravelDataGlobeWrapper } = await import('./Component.wrapper')
  return <TravelDataGlobeWrapper data={preparedData} />
}
