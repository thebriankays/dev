import type { Payload } from 'payload'
import type { Country } from '@/payload-types'
import axios from 'axios'
import { CIA_CODE_TO_ISO } from './cia-code-mapping'

// CIA World Factbook data seeder
// The factbook data is available at: https://github.com/factbook/factbook.json

interface FactbookCountry {
  Introduction?: {
    Background?: { text: string }
  }
  Geography?: {
    Location?: { text: string }
    'Geographic coordinates'?: { text: string }
    'Map references'?: { text: string }
    Area?: {
      total?: { text: string }
      land?: { text: string }
      water?: { text: string }
      'country comparison to the world'?: { text: string }
    }
    'Land boundaries'?: {
      total?: { text: string }
      'border countries'?: { text: string }
    }
    Coastline?: { text: string }
    Climate?: { text: string }
    Terrain?: { text: string }
    Elevation?: {
      'mean elevation'?: { text: string }
      'lowest point'?: { text: string }
      'highest point'?: { text: string }
    }
    'Natural resources'?: { text: string }
    'Natural hazards'?: { text: string }
    'Environment - current issues'?: { text: string }
    'Land use'?: {
      'agricultural land'?: { text: string }
      'forest'?: { text: string }
      'other'?: { text: string }
    }
  }
  'People and Society'?: {
    Population?: { 
      text: string
      'country comparison to the world'?: { text: string }
    }
    'Ethnic groups'?: { text: string }
    Languages?: { text: string }
    Religions?: { text: string }
    'Age structure'?: {
      '0-14 years'?: { text: string }
      '15-64 years'?: { text: string }
      '65 years and over'?: { text: string }
    }
    'Median age'?: {
      total?: { text: string }
      male?: { text: string }
      female?: { text: string }
    }
    'Population growth rate'?: { text: string }
    'Birth rate'?: { text: string }
    'Death rate'?: { text: string }
    'Net migration rate'?: { text: string }
    'Life expectancy at birth'?: {
      'total population'?: { text: string }
      male?: { text: string }
      female?: { text: string }
    }
    'Total fertility rate'?: { text: string }
    'Infant mortality rate'?: {
      total?: { text: string }
      male?: { text: string }
      female?: { text: string }
    }
    Literacy?: {
      'total population'?: { text: string }
      male?: { text: string }
      female?: { text: string }
    }
    'School life expectancy (primary to tertiary education)'?: {
      total?: { text: string }
      male?: { text: string }
      female?: { text: string }
    }
    'Education expenditures'?: { text: string }
    Urbanization?: {
      'urban population'?: { text: string }
      'rate of urbanization'?: { text: string }
    }
    'Major urban areas - population'?: { text: string }
    'Sex ratio'?: {
      'at birth'?: { text: string }
      'total population'?: { text: string }
    }
    'Physicians density'?: { text: string }
    'Hospital bed density'?: { text: string }
    'Health expenditures'?: { text: string }
    'Obesity - adult prevalence rate'?: { text: string }
    'Alcohol consumption per capita'?: { text: string }
    'Tobacco use'?: { text: string }
  }
  Government?: {
    'Country name'?: {
      'conventional long form'?: { text: string }
      'conventional short form'?: { text: string }
    }
    'Government type'?: { text: string }
    Capital?: {
      name?: { text: string }
      'geographic coordinates'?: { text: string }
      'time difference'?: { text: string }
    }
    Independence?: { text: string }
    Constitution?: {
      history?: { text: string }
      amendments?: { text: string }
    }
    'Legal system'?: { text: string }
    Suffrage?: { text: string }
    'Executive branch'?: {
      'chief of state'?: { text: string }
      'head of government'?: { text: string }
      cabinet?: { text: string }
    }
    'Legislative branch'?: { description?: { text: string } }
    'Judicial branch'?: { 'highest court(s)'?: { text: string } }
    'Political parties and leaders'?: { text: string }
    'International organization participation'?: { text: string }
  }
  Economy?: {
    'Economic overview'?: { text: string }
    'Real GDP (purchasing power parity)'?: { text: string }
    'Real GDP per capita'?: { text: string }
    'GDP (official exchange rate)'?: { text: string }
    'Real GDP growth rate'?: { text: string }
    'GDP - composition, by sector of origin'?: {
      agriculture?: { text: string }
      industry?: { text: string }
      services?: { text: string }
    }
    'Labor force'?: { text: string }
    'Labor force - by occupation'?: {
      agriculture?: { text: string }
      industry?: { text: string }
      services?: { text: string }
    }
    'Unemployment rate'?: { text: string }
    'Youth unemployment rate (ages 15-24)'?: { text: string }
    'Population below poverty line'?: { text: string }
    'Gini Index coefficient - distribution of family income'?: { text: string }
    Budget?: {
      revenues?: { text: string }
      expenditures?: { text: string }
    }
    'Public debt'?: { text: string }
    'Inflation rate (consumer prices)'?: { text: string }
    'Current account balance'?: { text: string }
    Exports?: {
      note?: { text: string }
      partners?: { text: string }
      commodities?: { text: string }
    }
    Imports?: {
      note?: { text: string }
      partners?: { text: string }
      commodities?: { text: string }
    }
    'Reserves of foreign exchange and gold'?: { text: string }
    'Exchange rates'?: { text: string }
  }
  Energy?: {
    'Electricity - production'?: { text: string }
    'Electricity - consumption'?: { text: string }
    'Electricity - installed generating capacity'?: { text: string }
    'Electricity - from fossil fuels'?: { text: string }
    'Electricity - from nuclear fuels'?: { text: string }
    'Electricity - from hydroelectric plants'?: { text: string }
    'Electricity - from other renewable sources'?: { text: string }
    'Carbon dioxide emissions from consumption of energy'?: { text: string }
  }
  Communications?: {
    'Telephones - fixed lines'?: {
      'total subscriptions'?: { text: string }
      'subscriptions per 100 inhabitants'?: { text: string }
    }
    'Telephones - mobile cellular'?: {
      'total subscriptions'?: { text: string }
      'subscriptions per 100 inhabitants'?: { text: string }
    }
    'Internet users'?: {
      total?: { text: string }
      percent?: { text: string }
    }
    'Broadband - fixed subscriptions'?: {
      total?: { text: string }
      'subscriptions per 100 inhabitants'?: { text: string }
    }
  }
  Transportation?: {
    Airports?: {
      total?: { text: string }
      'paved runways'?: { total?: { text: string } }
      'unpaved runways'?: { total?: { text: string } }
    }
    Railways?: { total?: { text: string } }
    Roadways?: {
      total?: { text: string }
      paved?: { text: string }
      unpaved?: { text: string }
    }
    Waterways?: { text: string }
    Pipelines?: { text: string }
    'Merchant marine'?: {
      total?: { text: string }
      'by type'?: { text: string }
    }
    'Ports and terminals'?: { text: string }
  }
  'Military and Security'?: {
    'Military and security forces'?: { text: string }
    'Military service age and obligation'?: { text: string }
    'Military expenditures'?: { text: string }
    'Military - note'?: { text: string }
  }
  'Transnational Issues'?: {
    'Disputes - international'?: { text: string }
    'Refugees and internally displaced persons'?: {
      refugees?: { text: string }
      IDPs?: { text: string }
      'stateless persons'?: { text: string }
    }
    'Trafficking in persons'?: {
      'current situation'?: { text: string }
      'tier rating'?: { text: string }
    }
    'Illicit drugs'?: { text: string }
  }
  metadata?: {
    date?: string
  }
}

// Helper function to parse numeric values from text
function parseNumber(text: string | undefined): number | null {
  if (!text) return null
  
  try {
    // Handle various numeric formats
    const match = text.match(/([\d,]+\.?\d*)/)
    if (match && match[1]) {
      const num = parseFloat(match[1].replace(/,/g, ''))
      // Check for valid number
      if (!isNaN(num) && isFinite(num)) {
        return num
      }
    }
  } catch (e) {
    // Return null on any parsing error
  }
  
  return null
}

// Helper function to parse percentages
function parsePercentage(text: string | undefined): number | null {
  if (!text) return null
  
  try {
    const match = text.match(/([\d.]+)%/)
    if (match && match[1]) {
      const num = parseFloat(match[1])
      if (!isNaN(num) && isFinite(num)) {
        return num
      }
    }
    return parseNumber(text)
  } catch (e) {
    // Return null on any parsing error
  }
  
  return null
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
      
      // Validate parsed values before creating date
      if (isNaN(day) || isNaN(year)) return null
      
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
        try {
          const date = new Date(Date.UTC(year, month, day))
          
          // Check if the date is valid
          if (!isNaN(date.getTime()) && isFinite(date.getTime())) {
            return date
          }
        } catch (dateError) {
          // Date constructor failed
          return null
        }
      }
    }
    
    // Try another pattern like "1960" (just year)
    const yearMatch = text.match(/\b(\d{4})\b/)
    if (yearMatch && yearMatch[1]) {
      const year = parseInt(yearMatch[1])
      if (!isNaN(year) && year > 1000 && year < 3000) { // Sanity check
        try {
          const date = new Date(Date.UTC(year, 0, 1)) // January 1st of that year
          if (!isNaN(date.getTime()) && isFinite(date.getTime())) {
            return date
          }
        } catch (dateError) {
          // Date constructor failed
          return null
        }
      }
    }
  } catch (e) {
    // Return null if parsing fails silently
  }
  
  return null
}

// Helper function to parse array from "X% group1, Y% group2" format
function parsePercentageGroups(text: string | undefined): Array<{name: string, percentage: number}> {
  if (!text) return []
  const groups: Array<{name: string, percentage: number}> = []
  
  // Match patterns like "98% Somali, 2% other"
  const matches = text.matchAll(/([\d.]+)%\s+([^,;]+)/g)
  for (const match of matches) {
    if (match[1] && match[2]) {
      groups.push({
        name: match[2].trim(),
        percentage: parseFloat(match[1])
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

export const seedFactbookData = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('— Seeding CIA World Factbook data...')

  try {
    // Base URL for individual country files
    const factbookBaseUrl = 'https://raw.githubusercontent.com/factbook/factbook.json/master'

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

    let created = 0
    let updated = 0
    let skipped = 0

    // Process each country using CIA to ISO mapping
    for (const [ciaCode, isoCode] of Object.entries(CIA_CODE_TO_ISO)) {
      try {
        const country = countryByCode.get(isoCode)
        if (!country) {
          continue
        }

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
        let data: FactbookCountry | null = null
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
          skipped++
          continue
        }


        // Check if details already exist
        const existing = await payload.find({
          collection: 'country-details' as any,
          where: {
            country: { equals: country.id },
          },
          limit: 1,
        })

        // Declare variables at the top of the try block
        let independenceDate = null
        let independenceFrom = null
        
        // Parse independence data with error handling
        try {
          const independenceText = data.Government?.Independence?.text
          if (independenceText) {
            independenceDate = parseIndependenceDate(independenceText)
            // Extract the "from" part if it exists
            const fromMatch = independenceText.match(/from\s+(.+?)(?:\s*\(|$)/i)
            if (fromMatch && fromMatch[1]) {
              independenceFrom = fromMatch[1].trim()
            }
          }
        } catch (e) {
          // Continue without independence data
        }
        
        const detailsEntry: any = {
          country: country.id,
          
          // Geographic Details
          landlocked: data.Geography?.Coastline?.text?.includes('0 km') || false,
          area: {
            total: parseNumber(data.Geography?.Area?.total?.text) || 0,
            land: parseNumber(data.Geography?.Area?.land?.text) || 0,
            water: parseNumber(data.Geography?.Area?.water?.text) || 0,
          },
          surfaceArea: parseNumber(data.Geography?.Area?.total?.text) || 0,
          elevation: {
            meanElevation: parseNumber(data.Geography?.Elevation?.['mean elevation']?.text),
            highestPoint: data.Geography?.Elevation?.['highest point']?.text,
            lowestPoint: data.Geography?.Elevation?.['lowest point']?.text,
          },
          
          // Demographics
          population: parseNumber(data['People and Society']?.Population?.text),
          populationDensity: null as any, // Will calculate below
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
          majorUrbanAreas: [], // Would need complex parsing
          
          // Health & Education
          healthExpenditure: parsePercentage(data['People and Society']?.['Health expenditures']?.text),
          physicianDensity: parseNumber(data['People and Society']?.['Physicians density']?.text),
          hospitalBedDensity: parseNumber(data['People and Society']?.['Hospital bed density']?.text),
          obesityRate: parsePercentage(data['People and Society']?.['Obesity - adult prevalence rate']?.text),
          alcoholConsumption: parseNumber(data['People and Society']?.['Alcohol consumption per capita']?.text),
          tobaccoUse: parsePercentage(data['People and Society']?.['Tobacco use']?.text),
          marriedWomenRate: null, // Not in factbook
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
          politicalParties: [], // Would need complex parsing
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
        try {
          if (independenceDate && !isNaN(independenceDate.getTime())) {
            detailsEntry.independence = {
              date: independenceDate.toISOString(), // Convert to ISO string to ensure valid date
              from: independenceFrom || undefined,
            }
          } else if (independenceFrom) {
            // If we only have the "from" text but no valid date, skip the independence field entirely
            // to avoid "Invalid time value" errors
            log.warn(`Skipping independence date for ${country.name} - independence text could not be parsed to a valid date`)
          }
        } catch (dateError) {
          // Handle any date conversion errors
          log.warn(`Invalid independence date for ${country.name}: ${(dateError as Error).message}`)
        }

        // Calculate population density if we have area and population
        if (detailsEntry.population && detailsEntry.surfaceArea) {
          detailsEntry.populationDensity = detailsEntry.population / detailsEntry.surfaceArea
        }

        if (existing.docs.length > 0) {
          // Update existing record
          await payload.update({
            collection: 'country-details' as any,
            id: existing.docs[0].id,
            data: detailsEntry,
          })
          updated++
        } else {
          // Create new record
          await payload.create({
            collection: 'country-details' as any,
            data: detailsEntry,
          })
          created++
        }

      } catch (error) {
        const errorMessage = (error as any).message || 'Unknown error'
        
        // Check if it's a date-related error
        if (errorMessage.includes('Invalid time value') || errorMessage.includes('date') || errorMessage.includes('independenceDate')) {
          log.error(`Failed to process factbook data for ${ciaCode}: Date parsing error - ${errorMessage}`)
        } else {
          log.error(`Failed to process factbook data for ${ciaCode}: ${errorMessage}`)
        }
        
        skipped++
      }
    }

    log.info(`✓ Seeded CIA World Factbook data: ${created} created, ${updated} updated, ${skipped} skipped`)

  } catch (error) {
    log.error(`Failed to seed factbook data: ${(error as any).message}`)
  }
}
