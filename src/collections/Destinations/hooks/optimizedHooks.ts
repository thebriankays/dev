import type { CollectionConfig } from 'payload'

// Cache for country data to avoid repeated lookups
const countryCache = new Map<string, any>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CachedCountry {
  data: any
  timestamp: number
}

export const optimizedDestinationHooks: CollectionConfig['hooks'] = {
  afterRead: [
    async ({ doc, req }) => {
      if (!doc) return doc
      
      // Skip if countryRelation is already populated
      if (doc.countryRelation && typeof doc.countryRelation === 'object') {
        return doc
      }
      
      // Check cache first
      if (doc.countryRelation && typeof doc.countryRelation === 'string') {
        const cacheKey = doc.countryRelation
        const cached = countryCache.get(cacheKey) as CachedCountry | undefined
        
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          return {
            ...doc,
            countryRelation: cached.data,
            country: cached.data.name,
            flagSvg: cached.data.flag
          }
        }
        
        try {
          // Fetch country with minimal depth to avoid nested queries
          const country = await req.payload.findByID({
            collection: 'countries',
            id: doc.countryRelation,
            depth: 0,
            // Only select fields we need
            select: {
              id: true,
              name: true,
              code: true,
              flag: true,
              capital: true,
              continent: true,
            }
          })
          
          if (country) {
            // Cache the result
            countryCache.set(cacheKey, {
              data: country,
              timestamp: Date.now()
            })
            
            return {
              ...doc,
              countryRelation: country,
              country: country.name,
              flagSvg: country.flag
            }
          }
        } catch (error) {
          req.payload.logger.error(`Error populating country for destination ${doc.id}:`, error)
        }
      }
      
      return doc
    }
  ],
  
  beforeChange: [
    async ({ data, req, operation }) => {
      // Only run on create/update, not on bulk operations
      if (operation === 'create' || operation === 'update') {
        // Batch related data fetching if needed
        const promises = []
        
        if (data.countryRelation && typeof data.countryRelation === 'string') {
          promises.push(
            req.payload.findByID({
              collection: 'countries',
              id: data.countryRelation,
              depth: 0,
              select: {
                name: true,
                flag: true,
                continent: true,
              }
            }).then(country => {
              if (country) {
                data.country = country.name
                data.flagSvg = country.flag
                data.continent = country.continent
              }
            }).catch(err => {
              req.payload.logger.error('Error fetching country:', err)
            })
          )
        }
        
        // Execute all promises in parallel
        if (promises.length > 0) {
          await Promise.all(promises)
        }
      }
      
      return data
    }
  ]
}