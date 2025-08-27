import type { Payload } from 'payload'
import axios from 'axios'
import * as fs from 'fs/promises'
import * as path from 'path'

interface FactbookCountry {
  name: string
  code: string
  [key: string]: any
}

export async function downloadFactbookData(payload: Payload): Promise<void> {
  const log = payload.logger ?? console
  log.info('=== Downloading CIA World Factbook data from GitHub ===')

  try {
    // GitHub raw content base URL
    const baseUrl = 'https://raw.githubusercontent.com/factbook/factbook.json/master'

    // Download the main JSON file
    log.info('Downloading factbook.json...')
    const response = await axios.get(`${baseUrl}/factbook.json`)
    const factbookData = response.data

    // Get all countries from our database
    const countries = await payload.find({
      collection: 'countries',
      limit: 0,
    })

    const countryMap = new Map(countries.docs.map((c) => [c.code.toLowerCase(), c]))

    // Process each country in the factbook
    for (const [countryCode, countryData] of Object.entries(factbookData.countries || {})) {
      const typedCountryCode = countryCode as string
      const country = countryMap.get(typedCountryCode.toLowerCase())
      if (!country) {
        log.warn(`Country not found for code: ${countryCode}`)
        continue
      }

      try {
        // Extract all the data sections
        const data = countryData as any

        const countryDetails = {
          country: country.id,
          lastUpdated: new Date(),

          // Geography
          geography: {
            landlocked: data.Geography?.['Land boundaries']?.text?.includes('landlocked') || false,
            coordinates: {
              latitude: (() => {
                const coordText = data.Geography?.['Geographic coordinates']?.text
                return coordText ? parseCoordinate(coordText, 'lat') : null
              })(),
              longitude: (() => {
                const coordText = data.Geography?.['Geographic coordinates']?.text
                return coordText ? parseCoordinate(coordText, 'lon') : null
              })(),
            },
            area: {
              total: parseNumber(data.Geography?.Area?.total?.text),
              land: parseNumber(data.Geography?.Area?.land?.text),
              water: parseNumber(data.Geography?.Area?.water?.text),
              comparative: data.Geography?.Area?.['Area - comparative']?.text,
            },
            boundaries: {
              total: parseNumber(data.Geography?.['Land boundaries']?.total?.text),
              coastline: parseNumber(data.Geography?.Coastline?.text),
            },
            elevation: {
              mean: parseNumber(data.Geography?.Elevation?.['mean elevation']?.text),
              lowest: data.Geography?.Elevation?.['lowest point']?.text,
              highest: data.Geography?.Elevation?.['highest point']?.text,
            },
            climate: data.Geography?.Climate?.text,
            terrain: data.Geography?.Terrain?.text,
            naturalResources: data.Geography?.['Natural resources']?.text,
            naturalHazards: parseHazards(data.Geography?.['Natural hazards']),
            landUse: {
              agricultural: parsePercentage(
                data.Geography?.['Land use']?.['agricultural land']?.text,
              ),
              arable: parsePercentage(data.Geography?.['Land use']?.['arable land']?.text),
              permanentCrops: parsePercentage(
                data.Geography?.['Land use']?.['permanent crops']?.text,
              ),
              permanentPasture: parsePercentage(
                data.Geography?.['Land use']?.['permanent pasture']?.text,
              ),
              forest: parsePercentage(data.Geography?.['Land use']?.forest?.text),
              other: parsePercentage(data.Geography?.['Land use']?.other?.text),
            },
          },

          // Demographics
          demographics: {
            population: {
              total: parseNumber(data['People and Society']?.Population?.text),
              year: new Date().getFullYear(),
              worldRank: parseRank(data['People and Society']?.Population?.['global rank']),
              density: parseNumber(data['People and Society']?.['Population distribution']?.text),
              distribution: data['People and Society']?.['Population distribution']?.text,
            },
            populationGrowth: {
              rate: parsePercentage(data['People and Society']?.['Population growth rate']?.text),
              birthRate: parseNumber(data['People and Society']?.['Birth rate']?.text),
              deathRate: parseNumber(data['People and Society']?.['Death rate']?.text),
              migrationRate: parseNumber(data['People and Society']?.['Net migration rate']?.text),
            },
            ageStructure: parseAgeStructure(data['People and Society']?.['Age structure']),
            dependencyRatios: parseDependencyRatios(
              data['People and Society']?.['Dependency ratios'],
            ),
            sexRatio: parseSexRatio(data['People and Society']?.['Sex ratio']),
            ethnicGroups: parseEthnicGroups(data['People and Society']?.['Ethnic groups']),
            religions: parseReligions(data['People and Society']?.Religions),
            urbanization: {
              urbanPopulation: parsePercentage(
                data['People and Society']?.Urbanization?.['urban population']?.text,
              ),
              urbanizationRate: parsePercentage(
                data['People and Society']?.Urbanization?.['rate of urbanization']?.text,
              ),
              majorUrbanAreas: parseMajorUrbanAreas(
                data['People and Society']?.Urbanization?.['Major urban areas - population'],
              ),
            },
          },

          // Health
          health: {
            lifeExpectancy: parseLifeExpectancy(
              data['People and Society']?.['Life expectancy at birth'],
            ),
            mortality: {
              infant: parseInfantMortality(data['People and Society']?.['Infant mortality rate']),
              maternal: parseNumber(data['People and Society']?.['Maternal mortality ratio']?.text),
              under5: parseNumber(data['People and Society']?.['Under-five mortality rate']?.text),
            },
            fertilityRate: parseNumber(data['People and Society']?.['Total fertility rate']?.text),
            contraceptivePrevalence: parsePercentage(
              data['People and Society']?.['Contraceptive prevalence rate']?.text,
            ),
            healthExpenditure: parsePercentage(
              data['People and Society']?.['Health expenditures']?.text,
            ),
            physicianDensity: parseNumber(data['People and Society']?.['Physicians density']?.text),
            hospitalBedDensity: parseNumber(
              data['People and Society']?.['Hospital bed density']?.text,
            ),
            obesityRate: parsePercentage(
              data['People and Society']?.['Obesity - adult prevalence rate']?.text,
            ),
            underweightChildren: parsePercentage(
              data['People and Society']?.['Children under the age of 5 years underweight']?.text,
            ),
            tobaccoUse: parseTobaccoUse(data['People and Society']?.['Tobacco use']),
            alcoholConsumption: parseNumber(
              data['People and Society']?.['Alcohol consumption per capita']?.text,
            ),
            sanitationAccess: parseSanitationAccess(
              data['People and Society']?.['Sanitation facility access'],
            ),
            drinkingWaterAccess: parseDrinkingWaterAccess(
              data['People and Society']?.['Drinking water source'],
            ),
            hivAidsPrevalence: parsePercentage(
              data['People and Society']?.['HIV/AIDS - adult prevalence rate']?.text,
            ),
            majorDiseases: parseMajorDiseases(
              data['People and Society']?.['Major infectious diseases'],
            ),
          },

          // Education
          education: {
            literacy: parseLiteracy(data['People and Society']?.Literacy),
            educationExpenditure: parsePercentage(
              data['People and Society']?.['Education expenditures']?.text,
            ),
            schoolLifeExpectancy: parseSchoolLifeExpectancy(
              data['People and Society']?.[
                'School life expectancy (primary to tertiary education)'
              ],
            ),
            youthUnemployment: parseYouthUnemployment(
              data['People and Society']?.['Youth unemployment'],
            ),
          },

          // Government
          government: {
            type: data.Government?.['Government type']?.text,
            independence: parseIndependence(data.Government?.Independence),
            nationalHoliday: parseNationalHoliday(data.Government?.['National holiday']),
            constitution: {
              history: data.Government?.Constitution?.history?.text,
              lastAmended: parseDate(data.Government?.Constitution?.amendments?.text),
            },
            legalSystem: data.Government?.['Legal system']?.text,
            suffrage: data.Government?.Suffrage?.text,
            internationalOrganizations:
              data.Government?.['International organization participation']?.text,
          },

          // Economy
          economy: {
            overview: data.Economy?.['Economic overview']?.text,
            gdp: parseGDP(data.Economy),
            gdpComposition: parseGDPComposition(
              data.Economy?.['GDP - composition, by sector of origin'],
            ),
            laborForce: parseLaborForce(data.Economy),
            unemploymentRate: parsePercentage(data.Economy?.['Unemployment rate']?.text),
            poverty: {
              populationBelowPovertyLine: parsePercentage(
                data.Economy?.['Population below poverty line']?.text,
              ),
              giniIndex: parseNumber(
                data.Economy?.['Gini Index coefficient - distribution of family income']?.text,
              ),
            },
            householdIncome: parseHouseholdIncome(
              data.Economy?.['Household income or consumption by percentage share'],
            ),
            budget: parseBudget(data.Economy),
            publicDebt: parsePercentage(data.Economy?.['Public debt']?.text),
            inflation: parsePercentage(data.Economy?.['Inflation rate (consumer prices)']?.text),
            creditRating: parseCreditRating(data.Economy?.['Credit ratings']),
            exports: parseExports(data.Economy),
            imports: parseImports(data.Economy),
            reserves: parseNumber(data.Economy?.['Reserves of foreign exchange and gold']?.text),
            externalDebt: parseNumber(data.Economy?.['Debt - external']?.text),
          },

          // Infrastructure
          infrastructure: {
            electricity: parseElectricity(data.Energy),
            communications: parseCommunications(data.Communications),
            transportation: parseTransportation(data.Transportation),
          },

          // Environment
          environment: {
            currentIssues: data.Environment?.['Environment - current issues']?.text,
            internationalAgreements: parseInternationalAgreements(
              data.Environment?.['Environment - international agreements'],
            ),
            airPollutants: parseAirPollutants(data.Environment?.['Air pollutants']),
            climate: data.Geography?.Climate?.text,
            waterResources: parseWaterResources(data.Environment),
            forestCoverage: parsePercentage(data.Environment?.['Forest area']?.text),
            urbanization: parseUrbanization(data.Environment),
            foodInsecurity: parseFoodInsecurity(data['People and Society']?.['Food insecurity']),
            wasteManagement: parseWasteManagement(data.Environment),
          },

          // Society & Culture
          societyCulture: {
            nationalDish: data['People and Society']?.['National dish']?.text,
            drivingSide: parseDrivingSide(data.Transportation?.Roadways),
            nationalSymbols: parseNationalSymbols(data.Government?.['National symbols']),
            nationalAnthem: parseNationalAnthem(data.Government?.['National anthem']),
          },

          // Military
          military: {
            branches: data['Military and Security']?.['Military and security forces']?.text,
            personnel: parseMilitaryPersonnel(data['Military and Security']),
            expenditures: parseMilitaryExpenditures(
              data['Military and Security']?.['Military expenditures'],
            ),
            serviceAge:
              data['Military and Security']?.['Military service age and obligation']?.text,
            conscription:
              data['Military and Security']?.[
                'Military service age and obligation'
              ]?.text?.includes('conscript'),
          },

          // Transnational Issues
          transnationalIssues: {
            disputes: data['Transnational Issues']?.['Disputes - international']?.text,
            refugees: parseRefugees(data['Transnational Issues']),
            trafficking: parseTrafficking(data['Transnational Issues']?.['Trafficking in persons']),
            illicitDrugs: data['Transnational Issues']?.['Illicit drugs']?.text,
          },
        }

        // For now, skip creating CountryDetails until the collection exists
        log.info(
          `Would create details for ${country.name} (skipping - collection not yet available)`,
        )
      } catch (error) {
        log.error(`Failed to process ${country.name}: ${(error as any).message}`)
      }
    }

    // Download media files
    await downloadFactbookMedia(payload)

    log.info('✓ CIA World Factbook data import complete')
  } catch (error) {
    log.error(`Failed to download Factbook data: ${(error as any).message}`)
  }
}

// Helper parsing functions
function parseNumber(text?: string): number | null {
  if (!text) return null
  const match = text.match(/[\d,]+\.?\d*/)
  if (!match) return null
  return parseFloat(match[0].replace(/,/g, ''))
}

function parsePercentage(text: string | undefined | null): number | null {
  if (!text) return null
  const match = text.match(/([\d.]+)%/)
  if (!match || !match[1]) return null
  return parseFloat(match[1])
}

function parseCoordinate(text: string, type: 'lat' | 'lon'): number | null {
  if (!text) return null
  const patterns = {
    lat: /(\d+)\s*°?\s*(\d+)?\s*'?\s*([NS])/,
    lon: /(\d+)\s*°?\s*(\d+)?\s*'?\s*([EW])/,
  }
  const match = text.match(patterns[type])
  if (!match || !match[1]) return null

  let decimal = parseFloat(match[1])
  if (match[2]) decimal += parseFloat(match[2]) / 60

  if ((type === 'lat' && match[3] === 'S') || (type === 'lon' && match[3] === 'W')) {
    decimal = -decimal
  }

  return decimal
}

function parseRank(text?: string): number | null {
  if (!text) return null
  const match = text.match(/\d+/)
  return match ? parseInt(match[0]) : null
}

function parseDate(text?: string): Date | null {
  if (!text) return null
  // Try to extract a year
  const yearMatch = text.match(/\b(19|20)\d{2}\b/)
  if (yearMatch) {
    return new Date(`${yearMatch[0]}-01-01`)
  }
  return null
}

// Additional parsing functions for complex data structures
function parseAgeStructure(data: any): any {
  if (!data) return {}
  return {
    age0to14: {
      percentage: parsePercentage(data['0-14 years']?.text),
      male: parseNumber(data['0-14 years']?.male),
      female: parseNumber(data['0-14 years']?.female),
    },
    age15to64: {
      percentage: parsePercentage(data['15-64 years']?.text),
      male: parseNumber(data['15-64 years']?.male),
      female: parseNumber(data['15-64 years']?.female),
    },
    age65plus: {
      percentage: parsePercentage(data['65 years and over']?.text),
      male: parseNumber(data['65 years and over']?.male),
      female: parseNumber(data['65 years and over']?.female),
    },
    medianAge: {
      total: parseNumber(data['Median age']?.total?.text),
      male: parseNumber(data['Median age']?.male?.text),
      female: parseNumber(data['Median age']?.female?.text),
    },
  }
}

function parseDependencyRatios(data: any): any {
  if (!data) return {}
  return {
    total: parseNumber(data['total dependency ratio']?.text),
    youth: parseNumber(data['youth dependency ratio']?.text),
    elderly: parseNumber(data['elderly dependency ratio']?.text),
    potentialSupport: parseNumber(data['potential support ratio']?.text),
  }
}

function parseSexRatio(data: any): any {
  if (!data) return {}
  return {
    atBirth: parseNumber(data['at birth']?.text),
    under15: parseNumber(data['0-14 years']?.text),
    age15to64: parseNumber(data['15-64 years']?.text),
    age65plus: parseNumber(data['65 years and over']?.text),
    total: parseNumber(data['total population']?.text),
  }
}

function parseEthnicGroups(data: any): any[] {
  if (!data?.text) return []
  // Parse text like "Kyrgyz 73.8%, Uzbek 14.8%, Russian 5.1%, Dungan 1.1%, other 5.2% (2021 est.)"
  const groups: any[] = []
  const matches = data.text.matchAll(/([^,]+?)\s+([\d.]+)%/g)
  for (const match of matches) {
    groups.push({
      name: match[1].trim(),
      percentage: parseFloat(match[2]),
    })
  }
  return groups
}

function parseReligions(data: any): any[] {
  if (!data?.text) return []
  const religions: any[] = []
  const matches = data.text.matchAll(/([^,]+?)\s+([\d.]+)%/g)
  for (const match of matches) {
    religions.push({
      name: match[1].trim(),
      percentage: parseFloat(match[2]),
    })
  }
  return religions
}

function parseMajorUrbanAreas(data: any): any[] {
  if (!data?.text) return []
  const areas: any[] = []
  // Parse text like "TOKYO (capital) 37.393 million; Osaka 19.165 million"
  const matches = data.text.matchAll(/([A-Z][A-Za-z\s]+?)(?:\s*\(capital\))?\s+([\d.]+)\s*million/g)
  for (const match of matches) {
    areas.push({
      name: match[1].trim(),
      population: parseFloat(match[2]) * 1000000,
      isCapital: data.text.includes(`${match[1]} (capital)`),
    })
  }
  return areas
}

function parseLifeExpectancy(data: any): any {
  if (!data) return {}
  return {
    total: parseNumber(data['total population']?.text),
    male: parseNumber(data.male?.text),
    female: parseNumber(data.female?.text),
    worldRank: parseRank(data['total population']?.['global rank']),
  }
}

function parseInfantMortality(data: any): any {
  if (!data) return {}
  return {
    total: parseNumber(data['total']?.text),
    male: parseNumber(data.male?.text),
    female: parseNumber(data.female?.text),
  }
}

function parseTobaccoUse(data: any): any {
  if (!data) return {}
  return {
    total: parsePercentage(data['total']?.text),
    male: parsePercentage(data.male?.text),
    female: parsePercentage(data.female?.text),
  }
}

function parseSanitationAccess(data: any): any {
  if (!data) return {}
  return {
    total: parsePercentage(data['improved']?.total?.text),
    urban: parsePercentage(data['improved']?.urban?.text),
    rural: parsePercentage(data['improved']?.rural?.text),
  }
}

function parseDrinkingWaterAccess(data: any): any {
  if (!data) return {}
  return {
    total: parsePercentage(data['improved']?.total?.text),
    urban: parsePercentage(data['improved']?.urban?.text),
    rural: parsePercentage(data['improved']?.rural?.text),
  }
}

function parseMajorDiseases(data: any): any {
  if (!data) return {}
  return {
    degreeOfRisk: data['degree of risk']?.text?.toLowerCase(),
    foodWaterborne: data['food or waterborne diseases']?.text,
    vectorborne: data['vectorborne diseases']?.text,
    waterContact: data['water contact diseases']?.text,
    animalContact: data['animal contact diseases']?.text,
    respiratoryDiseases: data['respiratory diseases']?.text,
  }
}

function parseLiteracy(data: any): any {
  if (!data) return {}
  return {
    total: parsePercentage(data['total population']?.text),
    male: parsePercentage(data.male?.text),
    female: parsePercentage(data.female?.text),
  }
}

function parseSchoolLifeExpectancy(data: any): any {
  if (!data) return {}
  return {
    total: parseNumber(data['total']?.text),
    male: parseNumber(data.male?.text),
    female: parseNumber(data.female?.text),
  }
}

function parseYouthUnemployment(data: any): any {
  if (!data) return {}
  return {
    total: parsePercentage(data['total']?.text),
    male: parsePercentage(data.male?.text),
    female: parsePercentage(data.female?.text),
  }
}

function parseIndependence(data: any): any {
  if (!data) return {}
  return {
    date: parseDate(data.text),
    from: data.text?.match(/from (.+?)(?:\s+on|\s+in|\s*$)/)?.[1],
    note: data.note?.text,
  }
}

function parseNationalHoliday(data: any): any {
  if (!data?.text) return {}
  const match = data.text.match(/(.+?),\s*(.+)/)
  return {
    name: match?.[1],
    date: match?.[2],
  }
}

function parseGDP(data: any): any {
  if (!data) return {}
  return {
    purchasingPowerParity: parseNumber(data['Real GDP (purchasing power parity)']?.text),
    officialExchangeRate: parseNumber(data['Real GDP (official exchange rate)']?.text),
    perCapita: parseNumber(data['Real GDP per capita']?.text),
    growthRate: parsePercentage(data['Real GDP growth rate']?.text),
    worldRank: parseRank(data['Real GDP (purchasing power parity)']?.['global rank']),
  }
}

function parseGDPComposition(data: any): any {
  if (!data) return {}
  return {
    agriculture: parsePercentage(data.agriculture?.text),
    industry: parsePercentage(data.industry?.text),
    services: parsePercentage(data.services?.text),
  }
}

function parseLaborForce(data: any): any {
  if (!data) return {}
  return {
    total: parseNumber(data['Labor force']?.text),
    byOccupation: {
      agriculture: parsePercentage(data['Labor force - by occupation']?.agriculture?.text),
      industry: parsePercentage(data['Labor force - by occupation']?.industry?.text),
      services: parsePercentage(data['Labor force - by occupation']?.services?.text),
    },
  }
}

function parseHouseholdIncome(data: any): any {
  if (!data) return {}
  return {
    lowest10Percent: parsePercentage(data['lowest 10%']?.text),
    highest10Percent: parsePercentage(data['highest 10%']?.text),
  }
}

function parseBudget(data: any): any {
  if (!data) return {}
  return {
    revenues: parseNumber(data.Budget?.revenues?.text),
    expenditures: parseNumber(data.Budget?.expenditures?.text),
    surplus: parsePercentage(data['Budget surplus (+) or deficit (-)']?.text),
  }
}

function parseCreditRating(data: any): any {
  if (!data) return {}
  return {
    standardAndPoors: data['Standard & Poors']?.rating,
    moodys: data["Moody's"]?.rating,
    fitch: data['Fitch']?.rating,
  }
}

function parseExports(data: any): any {
  if (!data) return {}
  return {
    value: parseNumber(data.Exports?.text),
    commodities: data['Exports - commodities']?.text,
    partners: parseTradePartners(data['Exports - partners']),
  }
}

function parseImports(data: any): any {
  if (!data) return {}
  return {
    value: parseNumber(data.Imports?.text),
    commodities: data['Imports - commodities']?.text,
    partners: parseTradePartners(data['Imports - partners']),
  }
}

function parseTradePartners(data: any): any[] {
  if (!data?.text) return []
  const partners: any[] = []
  const matches = data.text.matchAll(/([^,]+?)\s+([\d.]+)%/g)
  for (const match of matches) {
    partners.push({
      country: match[1].trim(),
      percentage: parseFloat(match[2]),
    })
  }
  return partners
}

function parseElectricity(data: any): any {
  if (!data) return {}
  return {
    access: {
      total: parsePercentage(
        data['Electricity access']?.['electrification - total population']?.text,
      ),
      urban: parsePercentage(data['Electricity access']?.['electrification - urban areas']?.text),
      rural: parsePercentage(data['Electricity access']?.['electrification - rural areas']?.text),
    },
    production: parseNumber(data['Electricity - production']?.text),
    consumption: parseNumber(data['Electricity - consumption']?.text),
    installedCapacity: parseNumber(data['Electricity - installed generating capacity']?.text),
    bySource: {
      fossilFuels: parsePercentage(data['Electricity - from fossil fuels']?.text),
      nuclear: parsePercentage(data['Electricity - from nuclear fuels']?.text),
      hydroelectric: parsePercentage(data['Electricity - from hydroelectric plants']?.text),
      otherRenewable: parsePercentage(data['Electricity - from other renewable sources']?.text),
    },
  }
}

function parseCommunications(data: any): any {
  if (!data) return {}
  return {
    telephoneLines: {
      total: parseNumber(data['Telephones - fixed lines']?.['total subscriptions']?.text),
      per100: parseNumber(
        data['Telephones - fixed lines']?.['subscriptions per 100 inhabitants']?.text,
      ),
    },
    mobileCellular: {
      total: parseNumber(data['Telephones - mobile cellular']?.['total subscriptions']?.text),
      per100: parseNumber(
        data['Telephones - mobile cellular']?.['subscriptions per 100 inhabitants']?.text,
      ),
    },
    internetUsers: {
      total: parseNumber(data['Internet users']?.total?.text),
      percentage: parsePercentage(data['Internet users']?.['percent of population']?.text),
    },
    broadband: {
      fixed: parseNumber(
        data['Broadband - fixed subscriptions']?.['subscriptions per 100 inhabitants']?.text,
      ),
      mobile: parseNumber(data['Mobile broadband']?.['subscriptions per 100 inhabitants']?.text),
    },
  }
}

function parseTransportation(data: any): any {
  if (!data) return {}
  return {
    roadways: {
      total: parseNumber(data.Roadways?.total?.text),
      paved: parseNumber(data.Roadways?.paved?.text),
      unpaved: parseNumber(data.Roadways?.unpaved?.text),
    },
    railways: {
      total: parseNumber(data.Railways?.total?.text),
      electrified: parseNumber(data.Railways?.electrified?.text),
    },
    waterways: parseNumber(data.Waterways?.text),
    pipelines: parsePipelines(data.Pipelines),
    merchantMarine: {
      total: parseNumber(data['Merchant marine']?.total?.text),
      byType: data['Merchant marine']?.['by type']?.text,
    },
  }
}

function parsePipelines(data: any): any[] {
  if (!data?.text) return []
  const pipelines: any[] = []
  // Parse text like "gas 3,361 km; oil 829 km"
  const matches = data.text.matchAll(/([^;,]+?)\s+([\d,]+)\s*km/g)
  for (const match of matches) {
    pipelines.push({
      type: match[1].trim(),
      length: parseFloat(match[2].replace(/,/g, '')),
    })
  }
  return pipelines
}

function parseInternationalAgreements(data: any): any {
  if (!data) return {}
  return {
    partyTo: data['party to']?.text,
    signedButNotRatified: data['signed, but not ratified']?.text,
  }
}

function parseAirPollutants(data: any): any {
  if (!data) return {}
  return {
    particulateMatter: parseNumber(data['particulate matter emissions']?.text),
    carbonDioxide: parseNumber(data['carbon dioxide emissions']?.text),
    methane: parseNumber(data['methane emissions']?.text),
  }
}

function parseWaterResources(data: any): any {
  if (!data) return {}
  return {
    renewable: parseNumber(data['Total water withdrawal']?.text),
    withdrawals: {
      total: parseNumber(data['Total water withdrawal']?.text),
      agricultural: parsePercentage(data['Total water withdrawal']?.agricultural?.text),
      industrial: parsePercentage(data['Total water withdrawal']?.industrial?.text),
      domestic: parsePercentage(data['Total water withdrawal']?.domestic?.text),
    },
  }
}

function parseUrbanization(data: any): any {
  if (!data) return {}
  return {
    rateOfChange: parsePercentage(data['Revenue from forest resources']?.text),
    revenueFromForest: parsePercentage(data['Revenue from forest resources']?.text),
    revenueFromCoal: parsePercentage(data['Revenue from coal']?.text),
  }
}

function parseFoodInsecurity(data: any): any {
  if (!data) return {}
  return {
    prevalence: parsePercentage(data['prevalence of undernourishment']?.text),
    severeLevel: parsePercentage(data['severe food insecurity']?.text),
  }
}

function parseWasteManagement(data: any): any {
  if (!data) return {}
  return {
    municipalGeneration: parseNumber(data['Municipal solid waste generated annually']?.text),
    recyclingRate: parsePercentage(data['Municipal solid waste recycled annually']?.text),
  }
}

function parseDrivingSide(data: any): 'left' | 'right' | null {
  if (!data?.text) return null
  if (data.text.toLowerCase().includes('left')) return 'left'
  if (data.text.toLowerCase().includes('right')) return 'right'
  return null
}

function parseNationalSymbols(data: any): any {
  if (!data?.text) return {}
  const text = data.text || ''
  const animalMatch = text.match(/animal[s]?\s*-?\s*([^;,]+)/i)
  const birdMatch = text.match(/bird[s]?\s*-?\s*([^;,]+)/i)
  const flowerMatch = text.match(/flower[s]?\s*-?\s*([^;,]+)/i)
  const treeMatch = text.match(/tree[s]?\s*-?\s*([^;,]+)/i)

  return {
    animal: animalMatch && animalMatch[1] ? animalMatch[1].trim() : undefined,
    bird: birdMatch && birdMatch[1] ? birdMatch[1].trim() : undefined,
    flower: flowerMatch && flowerMatch[1] ? flowerMatch[1].trim() : undefined,
    tree: treeMatch && treeMatch[1] ? treeMatch[1].trim() : undefined,
    other: text,
  }
}

function parseNationalAnthem(data: any): any {
  if (!data) return {}
  const lyricsMusic = data['lyrics/music']?.text
  const parts = lyricsMusic ? lyricsMusic.split('/') : []
  return {
    name: data.name?.text,
    author: parts[0]?.trim(),
    composer: parts[1]?.trim(),
    adopted: data.note?.text,
  }
}

function parseMilitaryPersonnel(data: any): any {
  if (!data) return {}
  const text = data['Military and security service personnel strengths']?.text || ''
  return {
    active: parseNumber(text),
    reserve: parseNumber(text.match(/reserve[s]?\s+([\d,]+)/i)?.[1]),
    paramilitary: parseNumber(text.match(/paramilitary[^\d]+([\d,]+)/i)?.[1]),
  }
}

function parseMilitaryExpenditures(data: any): any {
  if (!data) return {}
  const billionMatch = data.text?.match(/\$\s*([\d.]+)\s*billion/)
  const amountUsd = billionMatch ? parseFloat(billionMatch[1]) * 1000000000 : null
  return {
    percentOfGdp: parsePercentage(data.text),
    amountUsd: amountUsd,
    worldRank: parseRank(data['global rank']),
  }
}

function parseRefugees(data: any): any {
  if (!data) return {}
  return {
    from: parseNumber(
      data['Refugees and internally displaced persons']?.['refugees (country of origin)']?.text,
    ),
    hosting: parseNumber(
      data['Refugees and internally displaced persons']?.['refugees (country of asylum)']?.text,
    ),
    idps: parseNumber(data['Refugees and internally displaced persons']?.['IDPs']?.text),
    stateless: parseNumber(
      data['Refugees and internally displaced persons']?.['stateless persons']?.text,
    ),
  }
}

function parseTrafficking(data: any): any {
  if (!data) return {}
  return {
    currentSituation: data['current situation']?.text,
    tierRating: data['tier rating']?.text,
  }
}

function parseHazards(data: any): any[] {
  if (!data?.text) return []
  return data.text.split(';').map((hazard: string) => ({
    hazard: hazard.trim(),
    description: hazard.trim(),
    volcanism: hazard.toLowerCase().includes('volcan'),
  }))
}

async function downloadFactbookMedia(payload: Payload): Promise<void> {
  const log = payload.logger ?? console
  log.info('Downloading Factbook media files...')

  try {
    // Base URL for factbook media
    const mediaBaseUrl = 'https://raw.githubusercontent.com/factbook/media/master'

    // Get all countries
    const countries = await payload.find({
      collection: 'countries',
      limit: 0,
    })

    for (const country of countries.docs) {
      try {
        const countryCode = country.code.toLowerCase()

        // Define media files to download
        const mediaFiles = [
          {
            filename: `${countryCode}-map.gif`,
            type: 'political',
            title: `${country.name} Political Map`,
          },
          {
            filename: `${countryCode}-locator-map.gif`,
            type: 'locator',
            title: `${country.name} Location Map`,
          },
        ]

        for (const media of mediaFiles) {
          try {
            // For now, use the existing media collection
            const existing = await payload.find({
              collection: 'media',
              where: {
                title: { equals: media.title },
              },
              limit: 1,
            })

            if (existing.docs.length > 0) {
              continue
            }

            // Try to download the media file
            const mediaUrl = `${mediaBaseUrl}/maps/${media.filename}`
            const response = await axios
              .get(mediaUrl, {
                responseType: 'arraybuffer',
                validateStatus: (status) => status === 200,
              })
              .catch(() => null)

            if (!response) {
              continue
            }

            // Convert to buffer
            const buffer = Buffer.from(response.data)

            // Create media record with file upload
            const formData = {
              alt: `${country.name} ${media.type} map`,
              caption: {
                root: {
                  type: 'root' as const,
                  children: [
                    {
                      type: 'paragraph',
                      version: 1,
                      children: [
                        {
                          type: 'text',
                          version: 1,
                          text: `Official CIA World Factbook ${media.type} map of ${country.name}`,
                          format: 0,
                          style: '',
                          mode: 'normal',
                          detail: 0,
                        },
                      ],
                    },
                  ],
                  direction: null,
                  format: '' as const,
                  indent: 0,
                  version: 1,
                },
              },
            }

            // Upload the file through Payload's upload system
            await payload.create({
              collection: 'media',
              data: formData,
              file: {
                data: buffer,
                mimetype: 'image/gif',
                name: media.filename,
                size: buffer.length,
              },
            })

            log.info(`Downloaded ${media.type} map for ${country.name}`)
          } catch (error) {
            // Silent fail for individual media files
          }
        }
      } catch (error) {
        log.error(`Failed to download media for ${country.name}: ${(error as any).message}`)
      }
    }
  } catch (error) {
    log.error(`Failed to download factbook media: ${(error as any).message}`)
  }
}

// Export the main function
export { downloadFactbookData as seedFactbookDownload }
