import type { Payload } from 'payload'
import type { Country } from '@/payload-types'
import axios from 'axios'
import { CIA_CODE_TO_ISO } from './cia-code-mapping'

// GitHub URLs for CIA Factbook data
const FACTBOOK_BASE_URL = 'https://raw.githubusercontent.com/factbook/factbook.json/master'

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
    'Population distribution'?: { text: string }
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
    'Married women (ages 15-49)'?: { text: string }
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
    Citizenship?: {
      'citizenship by birth'?: { text: string }
      'citizenship by descent only'?: { text: string }
      'dual citizenship recognized'?: { text: string }
      'residency requirement for naturalization'?: { text: string }
    }
    'Executive branch'?: {
      'chief of state'?: { text: string }
      'head of government'?: { text: string }
      cabinet?: { text: string }
      'elections/appointments'?: { text: string }
    }
    'Legislative branch'?: { 
      description?: { text: string }
      elections?: { text: string }
    }
    'Judicial branch'?: { 
      'highest court(s)'?: { text: string }
      'judge selection and term of office'?: { text: string }
    }
    'Political parties and leaders'?: { text: string }
    'International organization participation'?: { text: string }
    'Diplomatic representation in the US'?: {
      'chief of mission'?: { text: string }
      chancery?: { text: string }
      telephone?: { text: string }
      FAX?: { text: string }
      'email address and website'?: { text: string }
    }
    'Diplomatic representation from the US'?: {
      'chief of mission'?: { text: string }
      embassy?: { text: string }
      'mailing address'?: { text: string }
      telephone?: { text: string }
      FAX?: { text: string }
      'email address and website'?: { text: string }
    }
    'World Heritage Sites'?: { text: string }
  }
  Economy?: {
    'Economic overview'?: { text: string }
    'Real GDP (purchasing power parity)'?: { text: string }
    'Real GDP per capita'?: { text: string }
    'GDP (official exchange rate)'?: { text: string }
    'Real GDP growth rate'?: { text: string }
    'Credit ratings'?: {
      'Fitch rating'?: { text: string }
      'Moody\'s rating'?: { text: string }
      'Standard & Poors rating'?: { text: string }
    }
    'GDP - composition, by sector of origin'?: {
      agriculture?: { text: string }
      industry?: { text: string }
      services?: { text: string }
    }
    'GDP - composition, by end use'?: {
      'household consumption'?: { text: string }
      'government consumption'?: { text: string }
      'investment in fixed capital'?: { text: string }
      'investment in inventories'?: { text: string }
      'exports of goods and services'?: { text: string }
      'imports of goods and services'?: { text: string }
    }
    'Agricultural products'?: { text: string }
    Industries?: { text: string }
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
    'Budget surplus (+) or deficit (-)'?: { text: string }
    'Public debt'?: { text: string }
    'Taxes and other revenues'?: { text: string }
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
    'Electricity - exports'?: { text: string }
    'Electricity - imports'?: { text: string }
    'Electricity - installed generating capacity'?: { text: string }
    'Electricity - from fossil fuels'?: { text: string }
    'Electricity - from nuclear fuels'?: { text: string }
    'Electricity - from hydroelectric plants'?: { text: string }
    'Electricity - from other renewable sources'?: { text: string }
    'Carbon dioxide emissions from consumption of energy'?: { text: string }
    'Energy production'?: { text: string }
    'Energy consumption'?: { text: string }
    'Energy exports'?: { text: string }
    'Energy imports'?: { text: string }
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
    'Military equipment inventories and acquisitions'?: { text: string }
    'Military deployments'?: { text: string }
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
  Terrorism?: {
    'Terrorist groups'?: { text: string }
  }
  metadata?: {
    date?: string
  }
}

// Helper function to parse numeric values from text
function parseNumber(text: string | undefined): number | null {
  if (!text) return null
  
  // Remove common text patterns
  text = text.replace(/approximately/gi, '')
    .replace(/about/gi, '')
    .replace(/around/gi, '')
    .replace(/nearly/gi, '')
    .replace(/over/gi, '')
    .replace(/more than/gi, '')
    .replace(/less than/gi, '')
    .replace(/up to/gi, '')
    .replace(/at least/gi, '')
  
  // Handle millions, billions, trillions
  const millionMatch = text.match(/([\d,]+\.?\d*)\s*million/i)
  if (millionMatch && millionMatch[1]) {
    return parseFloat(millionMatch[1].replace(/,/g, '')) * 1000000
  }
  
  const billionMatch = text.match(/([\d,]+\.?\d*)\s*billion/i)
  if (billionMatch && billionMatch[1]) {
    return parseFloat(billionMatch[1].replace(/,/g, '')) * 1000000000
  }
  
  const trillionMatch = text.match(/([\d,]+\.?\d*)\s*trillion/i)
  if (trillionMatch && trillionMatch[1]) {
    return parseFloat(trillionMatch[1].replace(/,/g, '')) * 1000000000000
  }
  
  // Handle regular numbers
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

// Helper function to parse dates
function parseIndependenceDate(text: string | undefined): Date | null {
  if (!text) return null
  
  try {
    // Try to extract date patterns like "4 July 1776"
    const match = text.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
    if (match && match[1] && match[2] && match[3]) {
      const dateStr = `${match[2]} ${match[1]}, ${match[3]}`
      const date = new Date(dateStr)
      
      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        return date
      }
    }
    
    // Try another pattern like "1960" (just year)
    const yearMatch = text.match(/\b(\d{4})\b/)
    if (yearMatch && yearMatch[1]) {
      const date = new Date(`January 1, ${yearMatch[1]}`)
      if (!isNaN(date.getTime())) {
        return date
      }
    }
  } catch (e) {
    // Return null if parsing fails
  }
  
  return null
}

// Helper function to parse array from "X% group1, Y% group2" format
function parsePercentageGroups(text: string | undefined): Array<{name: string, percentage: number}> {
  if (!text) return []
  const groups: Array<{name: string, percentage: number}> = []
  
  // First try to split by semicolons (common in factbook data)
  const parts = text.split(/[;,]/)
  
  for (const part of parts) {
    // Match patterns like "98% Somali" or "Somali 98%"
    const match1 = part.match(/([\d.]+)%\s+(.+)/)
    const match2 = part.match(/(.+?)\s+([\d.]+)%/)
    
    if (match1 && match1[1] && match1[2]) {
      groups.push({
        name: match1[2].trim(),
        percentage: parseFloat(match1[1])
      })
    } else if (match2 && match2[1] && match2[2]) {
      groups.push({
        name: match2[1].trim(),
        percentage: parseFloat(match2[2])
      })
    } else {
      // If no percentage, just add the name with 0
      const cleanName = part.trim()
      if (cleanName && !cleanName.match(/^(note|other|includes|excludes)/i)) {
        groups.push({
          name: cleanName,
          percentage: 0
        })
      }
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

// Helper to convert string to richText format for the background field
function stringToRichText(text: string | undefined): any {
  if (!text) return null
  
  // Basic conversion - you may need to enhance this based on your richText field config
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: text,
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1
        }
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1
    }
  }
}

export const seedFactbookDataEnhanced = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('— Seeding enhanced CIA World Factbook data...')

  try {
    // Base URL for individual country files
    const factbookBaseUrl = 'https://raw.githubusercontent.com/factbook/factbook.json/master'

    // Get all countries from database
    const countryRes = await payload.find({
      collection: 'countries',
      limit: 0,
    }) as unknown as { docs: Country[] }

    const countryByCode = new Map<string, Country>()
    
    countryRes.docs.forEach(country => {
      countryByCode.set(country.code, country)
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
        const continentFolders: string[] = [
          'africa',
          'antarctica',
          'australia-oceania',
          'central-america-n-caribbean',
          'central-asia',
          'east-n-southeast-asia',
          'europe',
          'middle-east',
          'north-america',
          'south-america',
          'south-asia',
        ]

        // Try to fetch the country data from various folders
        let data: FactbookCountry | null = null
        let factbookUrl = ''
        
        for (const folder of continentFolders) {
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
          log.warn(`No factbook data found for ${country.name} (${ciaCode})`)
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

        // Parse all the enhanced data
        const detailsEntry: any = {
          country: country.id,
          
          // Geographic Details
          landlocked: data.Geography?.Coastline?.text?.includes('0 km') || 
                      data.Geography?.Coastline?.text?.includes('landlocked') || false,
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
          
          // Demographics - with proper parsing
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
          yearlyAverageTemp: null, // Not directly in factbook
          climate: data.Geography?.Climate?.text,
          terrain: data.Geography?.Terrain?.text,
          naturalHazards: data.Geography?.['Natural hazards']?.text,
          naturalResources: data.Geography?.['Natural resources']?.text,
          
          // Infrastructure & Society
          drivingSide: null, // Not in factbook
          governmentType: data.Government?.['Government type']?.text,
          chiefOfState: data.Government?.['Executive branch']?.['chief of state']?.text,
          headOfGovernment: data.Government?.['Executive branch']?.['head of government']?.text,
          
          // Economy - Enhanced fields
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
          marriedWomenRate: parsePercentage(data['People and Society']?.['Married women (ages 15-49)']?.text),
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
          
          // Communication - Fixed internet users parsing
          internetUsers: parseNumber(data.Communications?.['Internet users']?.total?.text) || 
                        parsePercentage(data.Communications?.['Internet users']?.percent?.text),
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
        
        // Parse independence data
        const independenceDate = parseIndependenceDate(data.Government?.Independence?.text)
        const independenceFrom = data.Government?.Independence?.text?.split('from')?.pop()?.trim()
        
        if (independenceDate || independenceFrom) {
          detailsEntry.independence = {
            date: independenceDate || undefined,
            from: independenceFrom || undefined,
          }
        }

        // Calculate population density if we have area and population
        if (detailsEntry.population && detailsEntry.surfaceArea && detailsEntry.surfaceArea > 0) {
          detailsEntry.populationDensity = Math.round((detailsEntry.population / detailsEntry.surfaceArea) * 100) / 100
        }

        // Additional fields from enhanced requirements
        // Military and Security
        const militaryExpenditure = data['Military and Security']?.['Military expenditures']?.text
        if (militaryExpenditure) {
          // Store as additional data - you may need to add this field to CountryDetails collection
          detailsEntry.militaryExpenditure = parsePercentage(militaryExpenditure)
        }

        // Terrorism
        const terroristGroups = data.Terrorism?.['Terrorist groups']?.text
        if (terroristGroups) {
          // Store as additional data - you may need to add this field to CountryDetails collection
          detailsEntry.terrorismNotes = terroristGroups
        }

        // Communications - enhanced
        const telephones = data.Communications?.['Telephones - fixed lines']
        if (telephones) {
          detailsEntry.telephoneLines = parseNumber(telephones['total subscriptions']?.text)
        }

        // Energy
        const energyData = data.Energy
        if (energyData) {
          // Store as additional data - you may need to add these fields to CountryDetails collection
          detailsEntry.energyProduction = parseNumber(energyData['Electricity - production']?.text)
          detailsEntry.energyConsumption = parseNumber(energyData['Electricity - consumption']?.text)
        }

        // Economy - enhanced fields
        const economyData = data.Economy
        if (economyData) {
          // Labor force
          detailsEntry.laborForce = parseNumber(economyData['Labor force']?.text)
          detailsEntry.unemploymentRate = parsePercentage(economyData['Unemployment rate']?.text)
          
          // Agriculture and Industries
          detailsEntry.agricultureProducts = economyData['Agricultural products']?.text
          detailsEntry.industries = economyData.Industries?.text
          
          // Public finances
          detailsEntry.publicDebt = parsePercentage(economyData['Public debt']?.text)
          detailsEntry.taxesAndRevenues = parsePercentage(economyData['Taxes and other revenues']?.text)
          
          // Trade
          detailsEntry.exports = economyData.Exports?.note?.text
          detailsEntry.imports = economyData.Imports?.note?.text
          
          // Inflation
          detailsEntry.inflationRate = parsePercentage(economyData['Inflation rate (consumer prices)']?.text)
        }

        // Diplomatic representation
        const dipFromUS = data.Government?.['Diplomatic representation from the US']
        if (dipFromUS) {
          detailsEntry.diplomaticRepresentationFromUS = {
            chiefOfMission: dipFromUS['chief of mission']?.text,
            embassy: dipFromUS.embassy?.text,
            telephone: dipFromUS.telephone?.text,
          }
        }

        // World Heritage Sites
        detailsEntry.worldHeritageSites = data.Government?.['World Heritage Sites']?.text

        if (existing.docs.length > 0) {
          // Update existing record
          await payload.update({
            collection: 'country-details' as any,
            id: existing.docs[0].id,
            data: detailsEntry,
          })
          updated++
          log.info(`Updated ${country.name} details`)
        } else {
          // Create new record
          await payload.create({
            collection: 'country-details' as any,
            data: detailsEntry,
          })
          created++
          log.info(`Created ${country.name} details`)
        }

      } catch (error) {
        log.error(`Failed to process factbook data for ${ciaCode}: ${(error as any).message}`)
        skipped++
      }
    }

    log.info(`✓ Seeded enhanced CIA World Factbook data: ${created} created, ${updated} updated, ${skipped} skipped`)

  } catch (error) {
    log.error(`Failed to seed enhanced factbook data: ${(error as any).message}`)
  }
}
