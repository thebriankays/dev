import type { Payload } from 'payload'
import type { Country } from '@/payload-types'
import axios from 'axios'
import { CIA_CODE_TO_ISO } from './cia-code-mapping'

// Helper function to parse numeric values from text
function parseNumber(text: string | undefined): number | null {
  if (!text) return null
  const match = text.match(/([\d,]+\.?\d*)/)
  if (match && match[1]) {
    return parseFloat(match[1].replace(/,/g, ''))
  }
  return null
}

// Helper function to parse percentages
function parsePercentage(text: string | undefined): number | null {
  if (!text) return null
  const match = text.match(/([\d.]+)%/)
  if (match && match[1]) {
    return parseFloat(match[1])
  }
  return parseNumber(text)
}

// Helper function to convert plain text to Lexical rich text format
function stringToRichText(text: string | undefined): any {
  if (!text) return null
  
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: text,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
    },
  }
}

// Helper function to parse dates
function parseIndependenceDate(text: string | undefined): Date | null {
  if (!text) return null
  
  try {
    // Try to extract date patterns like "4 July 1776"
    const match = text.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
    if (match && match[1] && match[2] && match[3]) {
      const day = parseInt(match[1])
      const monthStr = match[2]
      const year = parseInt(match[3])
      
      // Map month names to numbers
      const monthMap: Record<string, number> = {
        'january': 0, 'jan': 0,
        'february': 1, 'feb': 1,
        'march': 2, 'mar': 2,
        'april': 3, 'apr': 3,
        'may': 4,
        'june': 5, 'jun': 5,
        'july': 6, 'jul': 6,
        'august': 7, 'aug': 7,
        'september': 8, 'sep': 8, 'sept': 8,
        'october': 9, 'oct': 9,
        'november': 10, 'nov': 10,
        'december': 11, 'dec': 11
      }
      
      const month = monthMap[monthStr.toLowerCase()]
      if (month !== undefined && year > 1000 && year < 3000 && day >= 1 && day <= 31) {
        const date = new Date(Date.UTC(year, month, day))
        
        // Check if the date is valid
        if (!isNaN(date.getTime())) {
          return date
        }
      }
    }
    
    // Try another pattern like "1960" (just year)
    const yearMatch = text.match(/\b(\d{4})\b/)
    if (yearMatch && yearMatch[1]) {
      const year = parseInt(yearMatch[1])
      if (year > 1000 && year < 3000) {
        const date = new Date(Date.UTC(year, 0, 1))
        if (!isNaN(date.getTime())) {
          return date
        }
      }
    }
    
    // Try pattern with no day like "August 1960"
    const monthYearMatch = text.match(/(\w+)\s+(\d{4})/)
    if (monthYearMatch && monthYearMatch[1] && monthYearMatch[2]) {
      const monthStr = monthYearMatch[1]
      const year = parseInt(monthYearMatch[2])
      
      const monthMap: Record<string, number> = {
        'january': 0, 'jan': 0,
        'february': 1, 'feb': 1,
        'march': 2, 'mar': 2,
        'april': 3, 'apr': 3,
        'may': 4,
        'june': 5, 'jun': 5,
        'july': 6, 'jul': 6,
        'august': 7, 'aug': 7,
        'september': 8, 'sep': 8, 'sept': 8,
        'october': 9, 'oct': 9,
        'november': 10, 'nov': 10,
        'december': 11, 'dec': 11
      }
      
      const month = monthMap[monthStr.toLowerCase()]
      if (month !== undefined && year > 1000 && year < 3000) {
        const date = new Date(Date.UTC(year, month, 1))
        if (!isNaN(date.getTime())) {
          return date
        }
      }
    }
  } catch (e) {
    // Return null if parsing fails
  }
  
  return null
}

// Helper function to parse percentage groups from text
function parsePercentageGroups(text: string | undefined): Array<{name: string, percentage: number}> {
  if (!text) return []
  const groups: Array<{name: string, percentage: number}> = []
  
  // First, handle special cases where percentages aren't explicitly given
  // e.g., "Muslim (official; virtually all are citizens, an estimated 10-15% are Shia)"
  if (text.toLowerCase().includes('virtually all') || text.toLowerCase().includes('nearly all')) {
    const match = text.match(/^([^(,]+)/)
    if (match) {
      groups.push({
        name: match[1].trim(),
        percentage: 99
      })
    }
    return groups
  }
  
  // Match patterns like "98% Somali, 2% other" or "Muslim 98%"
  const patterns = [
    /([\d.]+)%\s+([^,;]+)/g, // "98% Somali"
    /([^,;]+?)\s+([\d.]+)%/g, // "Somali 98%"
  ]
  
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)]
    for (const match of matches) {
      let percentage: number
      let name: string
      
      if (pattern === patterns[0]) {
        percentage = parseFloat(match[1])
        name = match[2].trim()
      } else {
        name = match[1].trim()
        percentage = parseFloat(match[2])
      }
      
      // Clean the name
      name = name.replace(/\s*\([^)]*\)/g, '').trim() // Remove parenthetical notes
      
      if (name && percentage > 0) {
        groups.push({ name, percentage })
      }
    }
    
    if (groups.length > 0) break // Use first pattern that matches
  }
  
  // If no percentages found but text exists, treat as single group
  if (groups.length === 0 && text.trim()) {
    const cleanText = text.split(',')[0].replace(/\s*\([^)]*\)/g, '').trim()
    if (cleanText && !cleanText.toLowerCase().includes('note:')) {
      groups.push({
        name: cleanText,
        percentage: 0 // Unknown percentage
      })
    }
  }
  
  return groups
}

// Helper function to parse coordinates
function parseCoordinates(text: string | undefined): { latitude: number; longitude: number } | null {
  if (!text) return null
  const match = text.match(/(\d+)\s*(\d+)\s*([NS])\s*,?\s*(\d+)\s*(\d+)\s*([EW])/)
  if (match && match[1] && match[2] && match[3] && match[4] && match[5] && match[6]) {
    const lat = parseInt(match[1]) + parseInt(match[2]) / 60
    const lon = parseInt(match[4]) + parseInt(match[5]) / 60
    return {
      latitude: match[3] === 'S' ? -lat : lat,
      longitude: match[6] === 'W' ? -lon : lon,
    }
  }
  return null
}

// Complete CIA World Factbook seeder with all data and media
export const seedCompleteFactbookData = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('=== Starting COMPLETE CIA World Factbook data seed ===')

  try {
    // Base URLs
    const factbookBaseUrl = 'https://raw.githubusercontent.com/factbook/factbook.json/master'
    const factbookMediaUrl = 'https://raw.githubusercontent.com/factbook/media/master'

    // Get all countries from database
    const countryRes = await payload.find({
      collection: 'countries',
      limit: 0,
    }) as unknown as { docs: Country[] }

    const countryByCode = new Map<string, Country>()
    const countryByName = new Map<string, Country>()
    
    countryRes.docs.forEach(country => {
      countryByCode.set(country.code, country)
      if (country.name) {
        countryByName.set(country.name.toLowerCase(), country)
      }
    })

    let detailsCreated = 0
    let detailsUpdated = 0
    let detailsSkipped = 0
    let mediaCreated = 0
    let religionsUpdated = 0

    // Process each country using CIA to ISO mapping
    for (const [ciaCode, isoCode] of Object.entries(CIA_CODE_TO_ISO)) {
      try {
        const country = countryByCode.get(isoCode)
        if (!country) {
          continue
        }

        log.info(`Processing ${country.name} (CIA: ${ciaCode}, ISO: ${isoCode})...`)

        // Determine the folder structure (by continent)
        const continentFolders: Record<string, string[]> = {
          'africa': ['africa'],
          'antarctica': ['antarctica'],
          'australia-oceania': ['australia-oceania'],
          'central-america-n-caribbean': ['central-america-n-caribbean'],
          'central-asia': ['central-asia'],
          'east-n-southeast-asia': ['east-n-southeast-asia'],
          'europe': ['europe'],
          'middle-east': ['middle-east'],
          'north-america': ['north-america'],
          'south-america': ['south-america'],
          'south-asia': ['south-asia'],
        }

        // Try to fetch the country data from various folders
        let data: any = null
        let factbookUrl = ''
        
        for (const folder of Object.keys(continentFolders)) {
          try {
            factbookUrl = `${factbookBaseUrl}/${folder}/${ciaCode}.json`
            const response = await axios.get(factbookUrl, { timeout: 5000 })
            data = response.data
            break
          } catch (err) {
            // Try next folder
          }
        }

        if (!data) {
          detailsSkipped++
          continue
        }

        // Parse all the data
        let independenceDate = null
        let independenceFrom = null
        
        try {
          const independenceText = data.Government?.Independence?.text
          if (independenceText) {
            independenceDate = parseIndependenceDate(independenceText)
            const fromMatch = independenceText.match(/from\s+(.+?)(?:\s*\(|$)/i)
            if (fromMatch && fromMatch[1]) {
              independenceFrom = fromMatch[1].trim()
            }
          }
        } catch (e) {
          // Continue without independence data
        }

        // Create comprehensive country details entry
        const detailsEntry: any = {
          country: country.id,
          
          // Geographic Details
          landlocked: data.Geography?.Coastline?.text?.includes('0 km') || false,
          area: {
            total: parseNumber(data.Geography?.Area?.total?.text),
            land: parseNumber(data.Geography?.Area?.land?.text),
            water: parseNumber(data.Geography?.Area?.water?.text),
          },
          surfaceArea: parseNumber(data.Geography?.Area?.total?.text),
          elevation: {
            meanElevation: parseNumber(data.Geography?.Elevation?.['mean elevation']?.text),
            highestPoint: data.Geography?.Elevation?.['highest point']?.text,
            lowestPoint: data.Geography?.Elevation?.['lowest point']?.text,
          },
          
          // Demographics
          population: parseNumber(data['People and Society']?.Population?.text),
          populationDensity: null, // Will calculate below
          populationGrowthRate: parsePercentage(data['People and Society']?.['Population growth rate']?.text),
          birthRate: parseNumber(data['People and Society']?.['Birth rate']?.text),
          deathRate: parseNumber(data['People and Society']?.['Death rate']?.text),
          migrationRate: parseNumber(data['People and Society']?.['Net migration rate']?.text),
          lifeExpectancy: {
            total: parseNumber(data['People and Society']?.['Life expectancy at birth']?.['total population']?.text),
            male: parseNumber(data['People and Society']?.['Life expectancy at birth']?.male?.text),
            female: parseNumber(data['People and Society']?.['Life expectancy at birth']?.female?.text),
          },
          
          // Climate & Environment
          climate: data.Geography?.Climate?.text,
          terrain: data.Geography?.Terrain?.text,
          naturalHazards: data.Geography?.['Natural hazards']?.text,
          naturalResources: data.Geography?.['Natural resources']?.text,
          
          // Infrastructure & Society
          drivingSide: null, // Not in factbook
          governmentType: data.Government?.['Government type']?.text,
          chiefOfState: data.Government?.['Executive branch']?.['chief of state']?.text,
          headOfGovernment: data.Government?.['Executive branch']?.['head of government']?.text,
          
          // Economy
          gdp: {
            nominal: parseNumber(data.Economy?.['GDP (official exchange rate)']?.text),
            perCapita: parseNumber(data.Economy?.['Real GDP per capita']?.text),
            growthRate: parsePercentage(data.Economy?.['Real GDP growth rate']?.text),
          },
          
          // Culture
          nationalDish: null, // Not in factbook
          religions: parsePercentageGroups(data['People and Society']?.Religions?.text),
          ethnicGroups: parsePercentageGroups(data['People and Society']?.['Ethnic groups']?.text),
          
          // Demographics Details
          ageStructure: {
            age0to14: parsePercentage(data['People and Society']?.['Age structure']?.['0-14 years']?.text),
            age15to64: parsePercentage(data['People and Society']?.['Age structure']?.['15-64 years']?.text),
            age65plus: parsePercentage(data['People and Society']?.['Age structure']?.['65 years and over']?.text),
          },
          sexRatio: {
            atBirth: parseNumber(data['People and Society']?.['Sex ratio']?.['at birth']?.text),
            total: parseNumber(data['People and Society']?.['Sex ratio']?.['total population']?.text),
          },
          urbanization: {
            urbanPopulation: parsePercentage(data['People and Society']?.Urbanization?.['urban population']?.text),
            rateOfUrbanization: parsePercentage(data['People and Society']?.Urbanization?.['rate of urbanization']?.text),
          },
          majorUrbanAreas: [],
          
          // Health & Education
          healthExpenditure: parsePercentage(data['People and Society']?.['Health expenditures']?.text),
          physicianDensity: parseNumber(data['People and Society']?.['Physicians density']?.text),
          hospitalBedDensity: parseNumber(data['People and Society']?.['Hospital bed density']?.text),
          obesityRate: parsePercentage(data['People and Society']?.['Obesity - adult prevalence rate']?.text),
          alcoholConsumption: parseNumber(data['People and Society']?.['Alcohol consumption per capita']?.text),
          tobaccoUse: parsePercentage(data['People and Society']?.['Tobacco use']?.text),
          marriedWomenRate: null,
          literacy: {
            total: parsePercentage(data['People and Society']?.Literacy?.['total population']?.text),
            male: parsePercentage(data['People and Society']?.Literacy?.male?.text),
            female: parsePercentage(data['People and Society']?.Literacy?.female?.text),
          },
          educationExpenditure: parsePercentage(data['People and Society']?.['Education expenditures']?.text),
          
          // Environment
          environmentalIssues: data.Geography?.['Environment - current issues']?.text,
          forestArea: parsePercentage(data.Geography?.['Land use']?.forest?.text),
          co2Emissions: parseNumber(data.Energy?.['Carbon dioxide emissions from consumption of energy']?.text),
          
          // Communication
          internetUsers: parsePercentage(data.Communications?.['Internet users']?.percent?.text),
          mobileSubscriptions: parseNumber(data.Communications?.['Telephones - mobile cellular']?.['subscriptions per 100 inhabitants']?.text),
          
          // Additional CIA Factbook fields
          background: stringToRichText(data.Introduction?.Background?.text),
          constitution: data.Government?.Constitution?.history?.text,
          legalSystem: data.Government?.['Legal system']?.text,
          suffrage: data.Government?.Suffrage?.text,
          politicalParties: [],
          internationalOrganizations: data.Government?.['International organization participation']?.text,
          disputes: data['Transnational Issues']?.['Disputes - international']?.text,
          refugeesAndIdps: {
            refugees: parseNumber(data['Transnational Issues']?.['Refugees and internally displaced persons']?.refugees?.text),
            idps: parseNumber(data['Transnational Issues']?.['Refugees and internally displaced persons']?.IDPs?.text),
            statelessPersons: parseNumber(data['Transnational Issues']?.['Refugees and internally displaced persons']?.['stateless persons']?.text),
          },
          trafficking: data['Transnational Issues']?.['Trafficking in persons']?.['current situation']?.text,
          illicitDrugs: data['Transnational Issues']?.['Illicit drugs']?.text,
        }
        
        // Only add independence field if we have valid data
        if (independenceDate && !isNaN(independenceDate.getTime())) {
          detailsEntry.independence = {
            date: independenceDate.toISOString(),
            from: independenceFrom || undefined,
          }
        }
        
        // Validate that all date fields are valid before saving
        // This prevents "Invalid time value" errors
        const validateEntry = (obj: any) => {
          for (const key in obj) {
            if (obj[key] instanceof Date && isNaN(obj[key].getTime())) {
              delete obj[key]
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              validateEntry(obj[key])
            }
          }
        }
        validateEntry(detailsEntry)

        // Calculate population density if we have area and population
        if (detailsEntry.population && detailsEntry.surfaceArea) {
          detailsEntry.populationDensity = detailsEntry.population / detailsEntry.surfaceArea
        }

        // Check if details already exist
        const existing = await payload.find({
          collection: 'country-details' as any,
          where: {
            country: { equals: country.id },
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          // Update existing record
          await payload.update({
            collection: 'country-details' as any,
            id: existing.docs[0].id,
            data: detailsEntry,
          })
          detailsUpdated++
        } else {
          // Create new record
          await payload.create({
            collection: 'country-details' as any,
            data: detailsEntry,
          })
          detailsCreated++
        }

        // Update country religions if found
        if (detailsEntry.religions && detailsEntry.religions.length > 0) {
          const religionData = []
          
          for (const religion of detailsEntry.religions) {
            if (!religion.name) continue
            
            // Clean up the religion name
            let cleanName = religion.name.trim()
              .replace(/\s*\([^)]*\)/g, '') // Remove parenthetical notes
              .replace(/\s+/g, ' ') // Normalize spaces
              .replace(/[<>"]/g, '') // Remove invalid characters
              .trim()
            
            // Skip if name is empty after cleanup
            if (!cleanName || cleanName.length === 0) continue
            
            // Map to standardized names
            const religionMappings: Record<string, string> = {
              'Christian': 'Christianity',
              'Christians': 'Christianity',
              'Roman Catholic': 'Catholic',
              'Roman Catholics': 'Catholic',
              'Greek Orthodox': 'Orthodox',
              'Eastern Orthodox': 'Orthodox',
              'Muslim': 'Islam',
              'Muslims': 'Islam',
              'Sunni Muslim': 'Sunni Islam',
              'Sunni Muslims': 'Sunni Islam',
              'Sunni': 'Sunni Islam',
              'Shia Muslim': 'Shia Islam',
              'Shia Muslims': 'Shia Islam',
              'Shiite': 'Shia Islam',
              'Shia': 'Shia Islam',
              'Jewish': 'Judaism',
              'Jews': 'Judaism',
              'Hindu': 'Hinduism',
              'Hindus': 'Hinduism',
              'Buddhist': 'Buddhism',
              'Buddhists': 'Buddhism',
              'Protestant': 'Protestant Christianity',
              'Protestants': 'Protestant Christianity',
              'Catholic': 'Catholic Christianity',
              'Catholics': 'Catholic Christianity',
              'Orthodox': 'Orthodox Christianity',
              'other': 'Other',
              'none': 'None',
              'unspecified': 'Unspecified',
              'folk religion': 'Folk Religion',
              'traditional': 'Traditional Beliefs',
              'indigenous beliefs': 'Indigenous Beliefs',
              'animist': 'Animism',
              'atheist': 'Atheism',
            }
            
            if (religionMappings[cleanName]) {
              cleanName = religionMappings[cleanName]
            }
            
            // Find or create the religion
            let religionId = null
            
            try {
              const existingReligion = await payload.find({
                collection: 'religions',
                where: {
                  name: {
                    equals: cleanName,
                  },
                },
                limit: 1,
              })
              
              if (existingReligion.docs.length > 0) {
                religionId = existingReligion.docs[0].id
              } else {
                // Create new religion
                try {
                  // Ensure name is not too long and is valid
                  const religionName = cleanName.slice(0, 100) // Limit length
                  if (religionName && religionName.length > 0) {
                    const created = await payload.create({
                      collection: 'religions',
                      data: {
                        name: religionName,
                        description: `Religion found in CIA Factbook data`,
                      },
                    })
                    religionId = created.id
                  }
                } catch (createError) {
                  log.error(`Failed to create religion '${cleanName}': ${(createError as any).message}`)
                  continue
                }
              }
              
              if (religionId) {
                religionData.push({
                  religion: religionId,
                  percentage: religion.percentage || 0,
                })
              }
            } catch (error) {
              log.error(`Failed to process religion ${cleanName}: ${(error as any).message}`)
            }
          }
          
          // Update the country with religions
          if (religionData.length > 0) {
            await payload.update({
              collection: 'countries',
              id: country.id,
              data: {
                religions: religionData,
              },
            })
            religionsUpdated++
          }
        }

        // Create country media references
        const mediaTypes = [
          // Maps from factbook media repository
          { folder: 'maps', type: 'map-political', title: 'Political Map', filename: `${ciaCode}-map.gif` },
          { folder: 'maps', type: 'map-physical', title: 'Physical Map', filename: `${ciaCode}-physical-map.gif` },
          { folder: 'maps', type: 'map-administrative', title: 'Administrative Map', filename: `${ciaCode}-administrative-divisions.gif` },
          { folder: 'locators', type: 'map-location', title: 'Location Map', filename: `${ciaCode}-locator-map.gif` },
          
          // Photos
          { folder: 'photos', type: 'photo-1', title: 'Photo 1', filename: `${ciaCode}-photo-1.jpg` },
          { folder: 'photos', type: 'photo-2', title: 'Photo 2', filename: `${ciaCode}-photo-2.jpg` },
          { folder: 'photos', type: 'photo-3', title: 'Photo 3', filename: `${ciaCode}-photo-3.jpg` },
          
          // Graphics
          { folder: 'graphics', type: 'graphic-population', title: 'Population Pyramid', filename: `${ciaCode}-population-pyramid.gif` },
          { folder: 'graphics', type: 'graphic-economy', title: 'Economy Chart', filename: `${ciaCode}-economy.gif` },
        ]

        for (const media of mediaTypes) {
          try {
            // Check if media already exists
            const existingMedia = await payload.find({
              collection: 'country-media' as any,
              where: {
                and: [
                  { country: { equals: country.id } },
                  { mediaType: { equals: media.type } },
                ],
              },
              limit: 1,
            })

            if (existingMedia.docs.length === 0) {
              const mediaUrl = `${factbookMediaUrl}/${media.folder}/${media.filename}`
              
              await payload.create({
                collection: 'country-media' as any,
                data: {
                  country: country.id,
                  title: `${country.name} - ${media.title}`,
                  mediaType: media.type,
                  description: `${media.title} of ${country.name} from CIA World Factbook`,
                  externalUrl: mediaUrl,
                  source: 'cia-factbook',
                  sourceUrl: mediaUrl,
                  year: new Date().getFullYear(),
                  featured: media.type === 'map-political',
                  sortOrder: mediaTypes.findIndex(m => m.type === media.type),
                },
              })
              mediaCreated++
            }
          } catch (error) {
            // Skip on error
          }
        }

      } catch (error) {
        const errorMessage = (error as any).message || 'Unknown error'
        log.error(`Failed to process factbook data for ${ciaCode}: ${errorMessage}`)
        detailsSkipped++
      }
    }

    log.info('=== CIA World Factbook Complete Seed Results ===')
    log.info(`✓ Country Details: ${detailsCreated} created, ${detailsUpdated} updated, ${detailsSkipped} skipped`)
    log.info(`✓ Country Media: ${mediaCreated} created`)
    log.info(`✓ Country Religions: ${religionsUpdated} countries updated`)

  } catch (error) {
    log.error(`Failed to seed complete factbook data: ${(error as any).message}`)
  }
}
