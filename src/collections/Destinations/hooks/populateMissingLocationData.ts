import type { CollectionBeforeChangeHook } from 'payload'
import type { Destination } from '@/payload-types'

// Cache for country lookups to avoid repeated queries
const countryCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Simplified hook to match Google Places data with existing database records
 * No longer creates countries, currencies, or languages - they should all exist already
 */
export const populateMissingLocationData: CollectionBeforeChangeHook<Destination> = async ({
  data,
  req,
  operation,
}) => {
  if (operation !== 'create' && operation !== 'update') return data

  const logger = req.payload.logger
  const next = { ...data }

  logger.info(`[populateMissingLocationData] Starting for operation: ${operation}`)
  logger.info(
    `[populateMissingLocationData] Data has tempCountryData: ${!!next.locationData?.tempCountryData}`,
  )
  logger.info(`[populateMissingLocationData] Data has countryRelation: ${!!next.countryRelation}`)

  // If we have temporary country data from Google Places, find the matching records
  if (next.locationData?.tempCountryData?.countryCode) {
    try {
      const countryCode = next.locationData.tempCountryData.countryCode
      let country = null

      // Check cache first
      const cached = countryCache.get(countryCode)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        country = cached.data
        logger.info(`[populateMissingLocationData] Using cached country data for: ${countryCode}`)
      } else {
        // Find country by code with optimized query
        const countries = await req.payload.find({
          collection: 'countries',
          where: { code: { equals: countryCode } },
          limit: 1,
          depth: 0, // Don't populate nested relationships
          select: {
            id: true,
            name: true,
            code: true,
            currencies: true,
            languages: true,
          },
        })

        if (countries.docs.length > 0) {
          country = countries.docs[0]
          // Cache the result
          countryCache.set(countryCode, {
            data: country,
            timestamp: Date.now(),
          })
        }
      }

      if (country) {
        // Set country relationship
        next.countryRelation = country?.id

        // Use country's existing currency relationship if not already set
        if (
          !next.currencyRelation &&
          country &&
          country.currencies &&
          country.currencies.length > 0
        ) {
          // Use the first currency as the primary one
          const primaryCurrency = country.currencies[0]
          next.currencyRelation =
            typeof primaryCurrency === 'object' ? primaryCurrency.id : primaryCurrency
        }

        // Use country's existing language relationships if not already set
        if (
          !next.languagesRelation &&
          country &&
          country.languages &&
          country.languages.length > 0
        ) {
          next.languagesRelation = country.languages.map((lang: any) =>
            typeof lang === 'object' ? lang.id : lang,
          )
        }

        logger.info(
          `[populateMissingLocationData] Matched country: ${country && country.name} (${country && country.code})`,
        )
        
        // Try to match region/state if we have state data
        if (next.state && country?.id && !next.regionRelation) {
          try {
            const regions = await req.payload.find({
              collection: 'regions',
              where: {
                and: [
                  { name: { equals: next.state } },
                  { country: { equals: country.id } },
                ],
              },
              limit: 1,
              depth: 0,
            })
            
            if (regions.docs.length > 0) {
              next.regionRelation = regions.docs[0].id
              logger.info(
                `[populateMissingLocationData] Matched region: ${regions.docs[0].name} for country ${country.name}`,
              )
            } else {
              logger.info(
                `[populateMissingLocationData] Region "${next.state}" not found for country ${country.name}`,
              )
            }
          } catch (error) {
            logger.error('[populateMissingLocationData] Error matching region:', error)
          }
        }
      } else {
        logger.warn(`[populateMissingLocationData] Country not found in database: ${countryCode}`)
      }

      // Clean up temporary data - we don't need to store it
      delete next.locationData.tempCountryData
    } catch (error) {
      logger.error('[populateMissingLocationData] Error matching location data:', error)
    }
  }

  return next
}