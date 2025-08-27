import type { Payload } from 'payload'
import type { Country } from '@/payload-types'
import Parser from 'rss-parser'
import { TRAVEL_ADVISORY_COUNTRY_MAPPINGS } from './fixes/country-mappings'

const parser = new Parser()

export const seedTravelAdvisoriesFromRSS = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('— Seeding travel advisories from US State Department RSS feed...')

  try {
    // US State Department RSS feed - the correct URL from their website
    const rssUrls = [
      'https://travel.state.gov/_res/rss/TAsTWs.xml',
      'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.xml',
      'https://travel.state.gov/content/travel/en/traveladvisories/_jcr_content.feed',
      'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.rss'
    ]
    
    let feed: any = null
    let feedError: any = null
    
    for (const url of rssUrls) {
      try {
        log.info(`Trying RSS feed URL: ${url}`)
        feed = await parser.parseURL(url)
        if (feed && feed.items && feed.items.length > 0) {
          log.info(`Successfully loaded feed from ${url}`)
          break
        }
      } catch (error) {
        feedError = error
        log.warn(`Failed to fetch from ${url}: ${(error as any).message}`)
      }
    }
    
    if (!feed || !feed.items || feed.items.length === 0) {
      throw feedError || new Error('No valid RSS feed found')
    }
    
    log.info(`RSS feed loaded. Found ${feed.items.length} items`)
    
    // Debug: Log first few items to see what we're getting
    if (feed.items.length > 0) {
      log.info('First few RSS items:')
      feed.items.slice(0, 5).forEach((item: any, i: number) => {
        log.info(`  ${i + 1}. Title: "${item.title || 'NO TITLE'}" | Link: ${item.link || 'NO LINK'}`)
      })
    }
    
    // Get all countries for mapping
    const countryRes = await payload.find({
      collection: 'countries',
      limit: 0,
    }) as unknown as { docs: Country[] }

    const countryByName = new Map<string, Country>()
    
    // Create multiple mappings for better matching
    countryRes.docs.forEach(country => {
      if (country.name) {
        // Exact name (lowercase)
        countryByName.set(country.name.toLowerCase(), country)
        
        // Without "The" prefix
        if (country.name.toLowerCase().startsWith('the ')) {
          countryByName.set(country.name.substring(4).toLowerCase(), country)
        }
        
        // Add any variations from our mapping table
        for (const [variant, standard] of Object.entries(TRAVEL_ADVISORY_COUNTRY_MAPPINGS)) {
          if (standard.toLowerCase() === country.name.toLowerCase()) {
            countryByName.set(variant.toLowerCase(), country)
          }
        }
      }
    })

    let created = 0
    let skipped = 0

    // Clear existing advisories first
    try {
      const existingAdvisories = await payload.find({
        collection: 'travel-advisories',
        limit: 0,
      })
      
      log.info(`Clearing ${existingAdvisories.totalDocs} existing advisories...`)
      for (const advisory of existingAdvisories.docs) {
        await payload.delete({
          collection: 'travel-advisories',
          id: advisory.id,
        })
      }
    } catch (e) {
      log.warn('Could not clear existing advisories:', (e as Error).message)
    }

    for (const item of feed.items) {
      try {
        const title = item.title || ''
        
        // Skip if this is clearly an HTML element or system item
        if (title.includes('iparsys') || title.includes('image') || 
            title.includes('menu') || title.includes('NAME') ||
            title.length < 5) {
          log.warn(`Skipping non-advisory item: ${title}`)
          skipped++
          continue
        }
        
        // Extract country name - be more flexible with the format
        let countryTag = ''
        
        // Try standard pattern first
        const advisoryMatch = title.match(/^(.+?)\s*Travel Advisory/i)
        if (advisoryMatch) {
          countryTag = advisoryMatch[1].trim()
        } else {
          // If no "Travel Advisory" suffix, use the whole title as country name
          countryTag = title.trim()
        }
        
        if (!countryTag || countryTag.length < 2) {
          log.warn(`Could not extract valid country from title: ${title}`)
          skipped++
          continue
        }

        // Extract threat level from content AND title
        let threatLevel: '1' | '2' | '3' | '4' = '1'
        const content = item.contentSnippet || item.content || ''
        const fullText = (title + ' ' + content).toLowerCase()
        
        // More robust threat level detection
        if (fullText.includes('do not travel') || fullText.includes('level 4')) {
          threatLevel = '4'
        } else if (fullText.includes('reconsider travel') || fullText.includes('level 3')) {
          threatLevel = '3'
        } else if (fullText.includes('exercise increased caution') || fullText.includes('level 2')) {
          threatLevel = '2'
        } else if (fullText.includes('exercise normal precautions') || fullText.includes('level 1')) {
          threatLevel = '1'
        }

        // Try to find matching country in our database
        let country: Country | undefined
        const normalizedCountryTag = countryTag.toLowerCase().trim()
        
        // Try direct match first
        country = countryByName.get(normalizedCountryTag)
        
        // If no match, try removing common suffixes/prefixes
        if (!country) {
          // Remove " - Level X: ..." from the country tag
          const cleanedTag = normalizedCountryTag.replace(/\s*-\s*level\s*\d+.*$/i, '').trim()
          country = countryByName.get(cleanedTag)
          
          if (country) {
            countryTag = country.name // Use the official name
          }
        }
        
        // Try mapping table
        if (!country && TRAVEL_ADVISORY_COUNTRY_MAPPINGS[normalizedCountryTag]) {
          const mappedName = TRAVEL_ADVISORY_COUNTRY_MAPPINGS[normalizedCountryTag].toLowerCase()
          country = countryByName.get(mappedName)
          
          if (country) {
            countryTag = country.name // Use the official name
          }
        }
        
        if (!country) {
          log.warn(`Could not find country for: ${countryTag} - SKIPPING`)
          skipped++
          continue // Skip this advisory entirely
        }

        // Extract description - clean it up
        let description = item.contentSnippet || item.content || ''
        // Remove HTML tags if any
        description = description.replace(/<[^>]*>/g, '')
        // Limit length to avoid overly long descriptions
        if (description.length > 500) {
          description = description.substring(0, 497) + '...'
        }

        // Create the advisory with the matched country
        await payload.create({
          collection: 'travel-advisories',
          data: {
            title: `${country.name} Travel Advisory`,
            pubDate: item.pubDate || new Date().toISOString(),
            link: item.link,
            threatLevel: threatLevel,
            countryTag: country.name,
            country: country.id,
            category: 'advisory',
            description: description,
            isActive: true,
          },
        })

        created++
        log.info(`Created travel advisory for ${country.name} - Level ${threatLevel}`)
        
      } catch (error) {
        log.error(`Failed to process advisory: ${error instanceof Error ? error.message : String(error)}`)
        skipped++
      }
    }

    log.info(`✓ Seeded ${created} travel advisories from RSS feed (${skipped} skipped)`)
    
    // If no advisories were created, use sample data
    if (created === 0) {
      log.warn('No advisories created from RSS feed, falling back to sample data...')
      await seedSampleTravelAdvisories(payload)
    }

  } catch (error) {
    log.error(`Failed to fetch RSS feed: ${(error as any).message}`)
    
    // Fall back to sample data if RSS feed fails
    log.info('Falling back to sample travel advisories...')
    await seedSampleTravelAdvisories(payload)
  }
}

// Fallback function with sample data
async function seedSampleTravelAdvisories(payload: Payload): Promise<void> {
  const log = payload.logger ?? console
  
  // Map threat levels to the select field values
  const THREAT_LEVELS = {
    normal: '1',
    increased: '2',
    reconsider: '3',
    'do-not-travel': '4',
  } as const

  // Sample travel advisories for common destinations
  const advisoriesData = [
    {
      countryCode: 'US',
      level: 'normal' as const,
      title: 'United States Travel Advisory',
      summary: 'Exercise normal precautions when traveling to the United States.',
      details: 'The United States is generally safe for travelers. Be aware of your surroundings and take standard safety precautions.',
      lastUpdated: new Date().toISOString(),
    },
    {
      countryCode: 'GB',
      level: 'normal' as const,
      title: 'United Kingdom Travel Advisory',
      summary: 'Exercise normal precautions when traveling to the United Kingdom.',
      details: 'The UK is generally safe for travelers. Standard safety precautions apply.',
      lastUpdated: new Date().toISOString(),
    },
    {
      countryCode: 'FR',
      level: 'increased' as const,
      title: 'France Travel Advisory',
      summary: 'Exercise increased caution in France due to terrorism and civil unrest.',
      details: 'Terrorist groups continue plotting possible attacks in France. Be aware of your surroundings in tourist locations.',
      lastUpdated: new Date().toISOString(),
    },
    {
      countryCode: 'JP',
      level: 'normal' as const,
      title: 'Japan Travel Advisory',
      summary: 'Exercise normal precautions when traveling to Japan.',
      details: 'Japan is one of the safest countries for travelers. Follow local customs and laws.',
      lastUpdated: new Date().toISOString(),
    },
    {
      countryCode: 'TH',
      level: 'increased' as const,
      title: 'Thailand Travel Advisory',
      summary: 'Exercise increased caution in Thailand due to civil unrest.',
      details: 'Some areas may experience demonstrations. Avoid large gatherings and monitor local media.',
      lastUpdated: new Date().toISOString(),
    },
    {
      countryCode: 'MX',
      level: 'increased' as const,
      title: 'Mexico Travel Advisory',
      summary: 'Exercise increased caution in Mexico due to crime and kidnapping.',
      details: 'Crime, including violent crime, can occur throughout Mexico. Use toll roads when possible and avoid traveling alone at night.',
      lastUpdated: new Date().toISOString(),
    },
    {
      countryCode: 'IN',
      level: 'increased' as const,
      title: 'India Travel Advisory',
      summary: 'Exercise increased caution in India due to crime and terrorism.',
      details: 'Crime and terrorism may occur throughout India. Avoid areas of civil unrest and exercise caution in crowded places.',
      lastUpdated: new Date().toISOString(),
    },
    {
      countryCode: 'BR',
      level: 'increased' as const,
      title: 'Brazil Travel Advisory',
      summary: 'Exercise increased caution in Brazil due to crime.',
      details: 'Crime, including violent crime, can occur in urban areas. Be especially careful in Rio de Janeiro and São Paulo.',
      lastUpdated: new Date().toISOString(),
    },
    {
      countryCode: 'EG',
      level: 'reconsider' as const,
      title: 'Egypt Travel Advisory',
      summary: 'Reconsider travel to Egypt due to terrorism.',
      details: 'Terrorist attacks may occur with little or no warning, targeting tourist locations and transportation hubs.',
      lastUpdated: new Date().toISOString(),
    },
    {
      countryCode: 'AF',
      level: 'do-not-travel' as const,
      title: 'Afghanistan Travel Advisory',
      summary: 'Do not travel to Afghanistan due to armed conflict, civil unrest, crime, terrorism, and kidnapping.',
      details: 'Travel to all areas of Afghanistan is unsafe. The security situation is extremely unstable.',
      lastUpdated: new Date().toISOString(),
    },
    // Add the missing countries from logs
    {
      countryCode: 'JO',
      level: 'increased' as const,
      title: 'Jordan Travel Advisory',
      summary: 'Exercise increased caution in Jordan due to terrorism.',
      details: 'Some areas have increased risk. Monitor local media and avoid the border with Syria.',
      lastUpdated: new Date().toISOString(),
    },
    {
      countryCode: 'SD',
      level: 'do-not-travel' as const,
      title: 'Sudan Travel Advisory',
      summary: 'Do not travel to Sudan due to armed conflict and civil unrest.',
      details: 'The security situation throughout Sudan is unpredictable and dangerous.',
      lastUpdated: new Date().toISOString(),
    },
    {
      countryCode: 'CU',
      level: 'increased' as const,
      title: 'Cuba Travel Advisory',
      summary: 'Exercise increased caution in Cuba.',
      details: 'Follow local laws carefully. Infrastructure is aging and services may be limited.',
      lastUpdated: new Date().toISOString(),
    },
  ]

  // Get all countries
  const countryRes = await payload.find({
    collection: 'countries',
    limit: 0,
  }) as unknown as { docs: Country[] }

  const countryByCode = new Map<string, Country>(
    countryRes.docs.map((c): [string, Country] => [c.code, c])
  )

  let created = 0
  let skipped = 0

  for (const advisory of advisoriesData) {
    try {
      const country = countryByCode.get(advisory.countryCode)
      if (!country) {
        log.warn(`Country not found for code: ${advisory.countryCode}`)
        skipped++
        continue
      }

      await payload.create({
        collection: 'travel-advisories',
        data: {
          country: country.id,
          countryTag: country.name,
          threatLevel: THREAT_LEVELS[advisory.level],
          title: advisory.title,
          description: advisory.details,
          pubDate: advisory.lastUpdated,
          isActive: true,
          category: 'advisory',
        },
      })
      created++
    } catch (error) {
      log.error(`Failed to create advisory for ${advisory.countryCode}: ${error instanceof Error ? error.message : String(error)}`)
      skipped++
    }
  }

  log.info(`✓ Seeded ${created} sample travel advisories (${skipped} skipped)`)
}
