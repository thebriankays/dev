'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import type { Destination } from '@/payload-types'
import type { UnsplashImage } from '@/lib/unsplash'
import { fetchUnsplashImagesByQuery } from '@/lib/unsplash'
import { fetchPexelsImagesByQuery } from '@/lib/pexels'
import { fetchPexelsVideosByQuery } from '@/lib/pexelsVideos'
import { createMediaFromUrl, createVideoFromUrl } from '@/lib/mediaHelper'
import { buildOptimizedMediaQuery, buildVideoSearchQuery, selectBestVideoFile } from '@/lib/mediaQueryOptimizer'

type DestinationInput = Partial<Destination> & {
  _featuredImageId?: string
  _featuredVideoId?: string
}

async function getFeaturedImageID(query: string): Promise<string | null> {
  // Try Unsplash first
  const maybeUnsplash = await fetchUnsplashImagesByQuery(query, 1)
  const unsplashURL =
    Array.isArray(maybeUnsplash) && maybeUnsplash.length
      ? (maybeUnsplash[0] as UnsplashImage).url
      : null

  // Fallback to Pexels
  const url =
    unsplashURL ??
    (await (async () => {
      const pexels = await fetchPexelsImagesByQuery(query, 1)
      return pexels.length ? pexels[0]?.url : null
    })())

  return url ? await createMediaFromUrl(url, `Image of ${query}`) : null
}

async function getFeaturedVideoID(query: string): Promise<string | null> {
  const vids = await fetchPexelsVideosByQuery(query, 1)
  
  if (!vids?.[0]?.video_files?.length) {
    return null
  }
  
  // Use the optimized video file selector
  const file = selectBestVideoFile(vids[0].video_files)
  
  if (!file) {
    return null
  }
  
  console.log(`Selected video quality: ${file.quality} (${file.width}x${file.height}) for ${query}`)

  return file.link ? await createVideoFromUrl(file.link, `Video of ${query}`) : null
}

export async function createDestinations(docs: DestinationInput[]) {
  console.log('createDestinations called with docs:', docs.length)
  const payload = await getPayload({ config })

  const summary = {
    created: 0,
    errors: [] as { title: string; error: string }[],
  }

  for (const raw of docs) {
    const title = raw.title ?? '(untitled)'
    console.log('Processing destination:', title)

    try {
      // Extract city from locationData if not already set
      if (!raw.city && raw.locationData?.city) {
        raw.city = raw.locationData.city
        console.log(`Setting city to ${raw.city} from locationData`)
      }

      // Media enrichment
      console.log('Starting media enrichment for:', title)
      
      // Build optimized search query with all available location data
      const mediaQueryData = {
        title: raw.title,
        city: raw.city || raw.locationData?.city,
        country: raw.countryData?.label || raw.locationData?.country,
        countryData: raw.countryData,
        continent: raw.continent,
        locationData: raw.locationData
      }
      
      const searchQuery = buildOptimizedMediaQuery(mediaQueryData)
      const videoQuery = buildVideoSearchQuery(mediaQueryData)
      
      console.log('Optimized image search query:', searchQuery)
      console.log('Optimized video search query:', videoQuery)

      if (!raw.featuredImage) {
        console.log('Fetching featured image for:', searchQuery)
        try {
          const imgID = await getFeaturedImageID(searchQuery)
          if (imgID) {
            console.log('Found image ID:', imgID)
            raw._featuredImageId = imgID
          } else {
            console.log('No image found for:', searchQuery)
          }
        } catch (imgError) {
          console.error('Error fetching image:', imgError)
        }
      }

      if (!raw.featuredVideo) {
        console.log('Fetching featured video for:', videoQuery)
        try {
          const vidID = await getFeaturedVideoID(videoQuery)
          if (vidID) {
            console.log('Found video ID:', vidID)
            raw._featuredVideoId = vidID
          } else {
            console.log('No video found for:', videoQuery)
          }
        } catch (vidError) {
          console.error('Error fetching video:', vidError)
        }
      }

      // Find the country in the database to set relationships
      let countryRelationId: number | undefined
      let currencyRelationId: number | undefined
      let languageRelationIds: number[] = []
      let regionRelationId: number | undefined

      // Debug: Log the raw destination data
      console.log(`Processing destination: ${title}`)
      console.log(`  countryData:`, raw.countryData)
      console.log(`  locationData:`, raw.locationData)
      
      // First try to find country by code if available
      if (raw.countryData?.code) {
        console.log(`Looking for country with code: ${raw.countryData.code}`)
        try {
          const countries = await payload.find({
            collection: 'countries',
            where: {
              code: {
                equals: raw.countryData.code,
              },
            },
            limit: 1,
          })

          if (countries.docs.length > 0) {
            const firstCountry = countries.docs[0]
            if (firstCountry) {
              countryRelationId = Number(firstCountry.id)
              console.log(`Found country ID: ${countryRelationId} for code: ${raw.countryData.code}`)
            }
          } else {
            console.log(`No country found with code: ${raw.countryData.code}`)
          }
        } catch (error) {
          console.error(`Error finding country by code: ${error}`)
        }
      }

      // If not found by code, try by name
      if (!countryRelationId && raw.countryData?.label) {
        console.log(`Looking for country with name: ${raw.countryData.label}`)
        try {
          const countries = await payload.find({
            collection: 'countries',
            where: {
              name: {
                equals: raw.countryData.label,
              },
            },
            limit: 1,
          })

          if (countries.docs.length > 0) {
            const firstCountry = countries.docs[0]
            if (firstCountry) {
              countryRelationId = Number(firstCountry.id)
              console.log(`Found country ID: ${countryRelationId} for name: ${raw.countryData.label}`)
            }
          }
        } catch (error) {
          console.error(`Error finding country by name: ${error}`)
        }
      }

      // Get currency and language relationships from the country
      if (countryRelationId) {
        try {
          const country = await payload.findByID({
            collection: 'countries',
            id: countryRelationId,
            depth: 1, // This will populate currency and languages
          })

          if (country) {
            // Get currency ID
            if (country.currencies && Array.isArray(country.currencies) && country.currencies.length > 0) {
              const firstCurrency = country.currencies[0]
              currencyRelationId = typeof firstCurrency === 'object' ? Number(firstCurrency.id) : Number(firstCurrency)
              console.log(`Found currency ID: ${currencyRelationId} for country ${country.name}`)
            }

            // Get language IDs
            if (country.languages && Array.isArray(country.languages) && country.languages.length > 0) {
              languageRelationIds = country.languages
                .map((lang) => (typeof lang === 'object' ? Number(lang.id) : Number(lang)))
                .filter((id) => !isNaN(id))
              console.log(`Found ${languageRelationIds.length} language IDs for country ${country.name}: ${languageRelationIds.join(', ')}`)
            } else {
              console.log(`No languages found for country ${country.name}`)
              console.log(`  country.languages:`, country.languages)
            }
          }
        } catch (error) {
          console.error(`Error getting country relationships: ${error}`)
        }
      }

      // Find the region/state if we have location data with state
      if (countryRelationId && (raw.locationData as any)?.state) {
        console.log(`Looking for region with name: ${(raw.locationData as any).state} in country ${countryRelationId}`)
        try {
          const regions = await payload.find({
            collection: 'regions',
            where: {
              and: [
                {
                  country: {
                    equals: countryRelationId,
                  },
                },
                {
                  name: {
                    equals: (raw.locationData as any).state,
                  },
                },
              ],
            },
            limit: 1,
          })

          if (regions.docs.length > 0) {
            const firstRegion = regions.docs[0]
            if (firstRegion) {
              regionRelationId = Number(firstRegion.id)
              console.log(`Found region ID: ${regionRelationId} for state: ${(raw.locationData as any).state}`)
            }
          } else {
            console.log(`No region found for state: ${(raw.locationData as any).state} in country ${countryRelationId}`)
          }
        } catch (error) {
          console.error(`Error finding region by state: ${error}`)
        }
      }

      // Create the destination with all fields and relationships
      await payload.create({
        collection: 'destinations',
        data: {
          title: raw.title || 'Untitled Destination',
          continent: raw.continent || 'North America',
          content: raw.content || {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'No description available.',
                      version: 1,
                    }
                  ],
                  version: 1,
                }
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
            }
          },
          city: raw.city,
          state: (raw.locationData as any)?.state || raw.state,
          locationData: raw.locationData,
          countryData: raw.countryData,
          // Set the country relationship
          ...(countryRelationId ? { countryRelation: countryRelationId } : {}),
          // Set currency relationship
          ...(currencyRelationId ? { currencyRelation: currencyRelationId } : {}),
          // Set languages relationship
          ...(languageRelationIds.length > 0 ? { languagesRelation: languageRelationIds } : {}),
          // Set region relationship
          ...(regionRelationId ? { regionRelation: regionRelationId } : {}),
          // Coordinates
          lat: raw.locationData?.coordinates?.lat,
          lng: raw.locationData?.coordinates?.lng,
          // Google Maps URI
          googleMapsUri: (raw.locationData as any)?.googleMapsUri,
          // Set featured media if IDs are available
          ...(raw._featuredImageId ? { featuredImage: Number(raw._featuredImageId) } : {}),
          ...(raw._featuredVideoId ? { featuredVideo: Number(raw._featuredVideoId) } : {}),
        },
        overrideAccess: true,
      })

      console.log('Successfully created destination:', title)
      summary.created++
    } catch (e) {
      console.error('Error creating destination:', title, e)
      summary.errors.push({
        title,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  console.log('createDestinations summary:', summary)
  return summary
}