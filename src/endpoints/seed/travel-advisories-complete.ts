import type { Payload } from 'payload'
import type { Country } from '@/payload-types'
import Parser from 'rss-parser'

const parser = new Parser()

// Complete travel advisories seeder with RSS and comprehensive fallback data
export const seedCompleteTravelAdvisories = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('=== Starting COMPLETE Travel Advisories seed ===')

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

  let rssCreated = 0
  let fallbackCreated = 0

  try {
    // US State Department RSS feed - the correct URL from their website
    const rssUrl = 'https://travel.state.gov/_res/rss/TAsTWs.xml'
    
    log.info(`Fetching RSS feed from: ${rssUrl}`)
    const feed = await parser.parseURL(rssUrl)
    
    if (feed && feed.items && feed.items.length > 0) {
      log.info(`RSS feed loaded. Found ${feed.items.length} items`)
      
      // Get all countries for mapping
      const countryRes = await payload.find({
        collection: 'countries',
        limit: 0,
      }) as unknown as { docs: Country[] }

      const countryByName = new Map<string, Country>()
      
      // Create multiple mappings for better matching
      countryRes.docs.forEach(country => {
        if (country.name) {
          // Exact name
          countryByName.set(country.name.toLowerCase(), country)
          
          // Common variations
          if (country.name.includes('United States')) {
            countryByName.set('united states', country)
            countryByName.set('usa', country)
            countryByName.set('u.s.', country)
          } else if (country.name.includes('United Kingdom')) {
            countryByName.set('united kingdom', country)
            countryByName.set('uk', country)
            countryByName.set('britain', country)
          } else if (country.name.includes('Korea, South')) {
            countryByName.set('south korea', country)
            countryByName.set('korea', country)
          } else if (country.name.includes('Korea, North')) {
            countryByName.set('north korea', country)
            countryByName.set('dprk', country)
          }
        }
      })

      for (const item of feed.items) {
        try {
          const title = item.title || ''
          
          // Skip if this is clearly an HTML element or system item
          if (title.includes('iparsys') || title.includes('image') || 
              title.includes('menu') || title.includes('NAME') ||
              title.length < 5) {
            continue
          }
          
          // Extract country name
          let countryTag = ''
          
          const advisoryMatch = title.match(/^(.+?)\s*Travel Advisory/i)
          if (advisoryMatch) {
            countryTag = advisoryMatch[1].trim()
          } else {
            countryTag = title.trim()
          }
          
          if (!countryTag || countryTag.length < 2) {
            continue
          }

          // Extract threat level from content
          let threatLevel: '1' | '2' | '3' | '4' = '1'
          const content = item.contentSnippet || item.content || ''
          
          if (content.toLowerCase().includes('do not travel') || 
              content.includes('Level 4:') ||
              title.toLowerCase().includes('do not travel')) {
            threatLevel = '4'
          } else if (content.toLowerCase().includes('reconsider travel') || 
                     content.includes('Level 3:') ||
                     title.toLowerCase().includes('reconsider travel')) {
            threatLevel = '3'
          } else if (content.toLowerCase().includes('exercise increased caution') || 
                     content.includes('Level 2:') ||
                     title.toLowerCase().includes('increased caution')) {
            threatLevel = '2'
          } else if (content.toLowerCase().includes('exercise normal precautions') || 
                     content.includes('Level 1:')) {
            threatLevel = '1'
          }

          // Try to find matching country
          let countryId: number | undefined
          const normalizedCountryTag = countryTag.toLowerCase()
          
          let country = countryByName.get(normalizedCountryTag) || undefined
          
          if (!country) {
            const withoutThe = normalizedCountryTag.replace(/^the\s+/i, '')
            country = countryByName.get(withoutThe)
          }
          
          if (country) {
            countryId = country.id
          }

          // Extract description
          let description = item.contentSnippet || item.content || ''
          description = description.replace(/<[^>]*>/g, '')
          if (description.length > 500) {
            description = description.substring(0, 497) + '...'
          }

          // Create the advisory
          await payload.create({
            collection: 'travel-advisories',
            data: {
              title: title,
              pubDate: item.pubDate || new Date().toISOString(),
              link: item.link,
              threatLevel: threatLevel,
              countryTag: countryTag,
              country: countryId,
              category: 'advisory',
              description: description,
              isActive: true,
            },
          })

          rssCreated++
          log.info(`Created travel advisory for ${countryTag} (Level ${threatLevel})`)
          
        } catch (error) {
          log.error(`Failed to process RSS advisory: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }
  } catch (error) {
    log.error(`Failed to fetch RSS feed: ${(error as any).message}`)
  }

  // If no advisories were created from RSS, use comprehensive fallback data
  if (rssCreated === 0) {
    log.info('No advisories created from RSS feed, using comprehensive fallback data...')
    
    // Get all countries
    const countryRes = await payload.find({
      collection: 'countries',
      limit: 0,
    }) as unknown as { docs: Country[] }

    const countryByCode = new Map<string, Country>(
      countryRes.docs.map((c): [string, Country] => [c.code, c])
    )

    // Comprehensive travel advisory data for major countries
    const advisoriesData = [
      // Level 1 - Exercise Normal Precautions
      { code: 'US', level: '1', title: 'United States Travel Advisory', 
        summary: 'Exercise normal precautions when traveling to the United States.',
        details: 'The United States is generally safe for travelers. Be aware of your surroundings and take standard safety precautions. Some areas may have higher crime rates than others.' },
      { code: 'CA', level: '1', title: 'Canada Travel Advisory',
        summary: 'Exercise normal precautions when traveling to Canada.',
        details: 'Canada is one of the safest countries for travelers. Standard safety precautions apply.' },
      { code: 'JP', level: '1', title: 'Japan Travel Advisory',
        summary: 'Exercise normal precautions when traveling to Japan.',
        details: 'Japan is one of the safest countries for travelers. Follow local customs and laws.' },
      { code: 'AU', level: '1', title: 'Australia Travel Advisory',
        summary: 'Exercise normal precautions when traveling to Australia.',
        details: 'Australia is generally safe for travelers. Be aware of wildlife and environmental hazards.' },
      { code: 'NZ', level: '1', title: 'New Zealand Travel Advisory',
        summary: 'Exercise normal precautions when traveling to New Zealand.',
        details: 'New Zealand is very safe for travelers. Standard precautions apply.' },
      { code: 'SG', level: '1', title: 'Singapore Travel Advisory',
        summary: 'Exercise normal precautions when traveling to Singapore.',
        details: 'Singapore has very low crime rates. Be aware of strict local laws.' },
      { code: 'CH', level: '1', title: 'Switzerland Travel Advisory',
        summary: 'Exercise normal precautions when traveling to Switzerland.',
        details: 'Switzerland is very safe for travelers. Mountain activities require proper preparation.' },
      { code: 'NO', level: '1', title: 'Norway Travel Advisory',
        summary: 'Exercise normal precautions when traveling to Norway.',
        details: 'Norway is one of the safest countries in the world. Weather can be challenging.' },
      
      // Level 2 - Exercise Increased Caution
      { code: 'GB', level: '2', title: 'United Kingdom Travel Advisory',
        summary: 'Exercise increased caution in the United Kingdom due to terrorism.',
        details: 'Terrorist groups continue plotting possible attacks in the UK. Be aware of your surroundings in tourist locations.' },
      { code: 'FR', level: '2', title: 'France Travel Advisory',
        summary: 'Exercise increased caution in France due to terrorism and civil unrest.',
        details: 'Terrorist groups continue plotting possible attacks in France. Be aware of your surroundings in tourist locations.' },
      { code: 'DE', level: '2', title: 'Germany Travel Advisory',
        summary: 'Exercise increased caution in Germany due to terrorism.',
        details: 'Terrorist groups continue plotting possible attacks. Exercise caution in crowded areas.' },
      { code: 'IT', level: '2', title: 'Italy Travel Advisory',
        summary: 'Exercise increased caution in Italy due to terrorism.',
        details: 'Be alert in tourist areas. Petty crime is common in major cities.' },
      { code: 'ES', level: '2', title: 'Spain Travel Advisory',
        summary: 'Exercise increased caution in Spain due to terrorism and civil unrest.',
        details: 'Be aware of pickpockets in tourist areas. Some regions experience political demonstrations.' },
      { code: 'TH', level: '2', title: 'Thailand Travel Advisory',
        summary: 'Exercise increased caution in Thailand due to civil unrest.',
        details: 'Some areas may experience demonstrations. Avoid large gatherings and monitor local media.' },
      { code: 'MX', level: '2', title: 'Mexico Travel Advisory',
        summary: 'Exercise increased caution in Mexico due to crime and kidnapping.',
        details: 'Crime, including violent crime, can occur throughout Mexico. Use toll roads when possible and avoid traveling alone at night.' },
      { code: 'IN', level: '2', title: 'India Travel Advisory',
        summary: 'Exercise increased caution in India due to crime and terrorism.',
        details: 'Crime and terrorism may occur throughout India. Avoid areas of civil unrest and exercise caution in crowded places.' },
      { code: 'BR', level: '2', title: 'Brazil Travel Advisory',
        summary: 'Exercise increased caution in Brazil due to crime.',
        details: 'Crime, including violent crime, can occur in urban areas. Be especially careful in Rio de Janeiro and São Paulo.' },
      { code: 'ZA', level: '2', title: 'South Africa Travel Advisory',
        summary: 'Exercise increased caution in South Africa due to crime and civil unrest.',
        details: 'Violent crime is common. Avoid walking alone and displaying valuables.' },
      { code: 'ID', level: '2', title: 'Indonesia Travel Advisory',
        summary: 'Exercise increased caution in Indonesia due to terrorism and natural disasters.',
        details: 'Some areas have higher risks. Monitor volcanic and seismic activity.' },
      { code: 'PH', level: '2', title: 'Philippines Travel Advisory',
        summary: 'Exercise increased caution in the Philippines due to crime, terrorism, and civil unrest.',
        details: 'Some areas have significantly higher risks. Avoid the Sulu Archipelago and Marawi City.' },
      
      // Level 3 - Reconsider Travel
      { code: 'EG', level: '3', title: 'Egypt Travel Advisory',
        summary: 'Reconsider travel to Egypt due to terrorism.',
        details: 'Terrorist attacks may occur with little or no warning, targeting tourist locations and transportation hubs.' },
      { code: 'TR', level: '3', title: 'Turkey Travel Advisory',
        summary: 'Reconsider travel to Turkey due to terrorism and arbitrary detentions.',
        details: 'Terrorist attacks have occurred throughout the country. Avoid areas near the Syria and Iraq borders.' },
      { code: 'PK', level: '3', title: 'Pakistan Travel Advisory',
        summary: 'Reconsider travel to Pakistan due to terrorism and sectarian violence.',
        details: 'Terrorist attacks continue to happen across Pakistan. Avoid the Afghanistan border region.' },
      { code: 'LB', level: '3', title: 'Lebanon Travel Advisory',
        summary: 'Reconsider travel to Lebanon due to crime, terrorism, civil unrest, and kidnapping.',
        details: 'The security situation is unpredictable. Avoid the Lebanon-Syria border and Palestinian refugee camps.' },
      { code: 'HN', level: '3', title: 'Honduras Travel Advisory',
        summary: 'Reconsider travel to Honduras due to crime and kidnapping.',
        details: 'Violent crime is common. Gang activity is widespread.' },
      { code: 'BD', level: '3', title: 'Bangladesh Travel Advisory',
        summary: 'Reconsider travel to Bangladesh due to crime, terrorism, and kidnapping.',
        details: 'Terrorist attacks can occur anywhere and at any time. Avoid large gatherings.' },
      { code: 'NG', level: '3', title: 'Nigeria Travel Advisory',
        summary: 'Reconsider travel to Nigeria due to crime, terrorism, civil unrest, and kidnapping.',
        details: 'Violent crime is widespread. Terrorist groups are active in multiple regions.' },
      
      // Level 4 - Do Not Travel
      { code: 'AF', level: '4', title: 'Afghanistan Travel Advisory',
        summary: 'Do not travel to Afghanistan due to armed conflict, civil unrest, crime, terrorism, and kidnapping.',
        details: 'Travel to all areas of Afghanistan is unsafe. The security situation is extremely unstable.' },
      { code: 'IQ', level: '4', title: 'Iraq Travel Advisory',
        summary: 'Do not travel to Iraq due to terrorism, kidnapping, armed conflict, and civil unrest.',
        details: 'The security situation throughout Iraq remains dangerous. ISIS remains active.' },
      { code: 'SY', level: '4', title: 'Syria Travel Advisory',
        summary: 'Do not travel to Syria due to terrorism, civil unrest, kidnapping, and armed conflict.',
        details: 'The security situation in Syria is dangerous and unpredictable. No part of Syria is safe.' },
      { code: 'YE', level: '4', title: 'Yemen Travel Advisory',
        summary: 'Do not travel to Yemen due to terrorism, civil unrest, health risks, kidnapping, and armed conflict.',
        details: 'A civil war continues in Yemen. Critical infrastructure has been destroyed.' },
      { code: 'LY', level: '4', title: 'Libya Travel Advisory',
        summary: 'Do not travel to Libya due to crime, terrorism, civil unrest, kidnapping, and armed conflict.',
        details: 'Crime levels remain high, including kidnapping for ransom. Militia groups are unpredictable.' },
      { code: 'SO', level: '4', title: 'Somalia Travel Advisory',
        summary: 'Do not travel to Somalia due to crime, terrorism, civil unrest, health issues, kidnapping, and piracy.',
        details: 'Violent crime is common throughout Somalia. Al-Shabaab continues attacks.' },
      { code: 'VE', level: '4', title: 'Venezuela Travel Advisory',
        summary: 'Do not travel to Venezuela due to crime, civil unrest, poor health infrastructure, kidnapping, and arbitrary arrest.',
        details: 'Violent crime is pervasive. Security forces have arbitrarily detained U.S. citizens.' },
      { code: 'KP', level: '4', title: 'North Korea Travel Advisory',
        summary: 'Do not travel to North Korea due to the serious risk of arrest and long-term detention.',
        details: 'U.S. citizens have been arbitrarily arrested and detained. The U.S. has no diplomatic relations with North Korea.' },
      { code: 'ML', level: '4', title: 'Mali Travel Advisory',
        summary: 'Do not travel to Mali due to crime, terrorism, and kidnapping.',
        details: 'Terrorist and armed groups continue attacks throughout Mali.' },
      { code: 'HT', level: '4', title: 'Haiti Travel Advisory',
        summary: 'Do not travel to Haiti due to kidnapping, crime, civil unrest, and poor health infrastructure.',
        details: 'Kidnapping is widespread. Violent crime and civil unrest are common.' },
    ]

    for (const advisory of advisoriesData) {
      try {
        const country = countryByCode.get(advisory.code)
        if (!country) {
          log.warn(`Country not found for code: ${advisory.code}`)
          continue
        }

        await payload.create({
          collection: 'travel-advisories',
          data: {
            country: country.id,
            countryTag: country.name,
            threatLevel: advisory.level as '1' | '2' | '3' | '4',
            title: advisory.title,
            description: advisory.details,
            pubDate: new Date().toISOString(),
            isActive: true,
            category: 'advisory',
          },
        })
        fallbackCreated++
        log.info(`Created fallback advisory for ${country.name} (Level ${advisory.level})`)
      } catch (error) {
        log.error(`Failed to create fallback advisory for ${advisory.code}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  log.info('=== Travel Advisories Complete Seed Results ===')
  log.info(`✓ RSS Advisories: ${rssCreated} created`)
  log.info(`✓ Fallback Advisories: ${fallbackCreated} created`)
  log.info(`✓ Total Advisories: ${rssCreated + fallbackCreated} created`)
}
