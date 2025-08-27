import type { Payload } from 'payload'
import type { Country } from '@/payload-types'
import { crimeIndexData, criminalMarketsData, criminalActorsData, resilienceData } from './crime-index-data-extracted'
import { seedCrimeIndexFromWeb } from './crime-index-scraper'
import { seedCrimeTrends } from './crime-trends'
import { seedCrimeDataFromFile } from './crime-data-loader'

export const seedCrimeIndexData = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('— Seeding crime index data...')
  
  // First try to load from the JSON file
  try {
    await seedCrimeDataFromFile(payload)
    return
  } catch (error) {
    log.error('Failed to load crime data from file, falling back to extracted data:', error)
  }
  
  // Option 2: Use web scraper to get latest data
  const useWebScraper = false // Set to true to scrape from web instead of using extracted data
  
  if (useWebScraper) {
    try {
      await seedCrimeIndexFromWeb(payload)
      return
    } catch (error) {
      log.error('Web scraping failed, falling back to extracted data:', error)
    }
  }

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

  // Seed crime index scores
  for (const data of crimeIndexData) {
    try {
      const country = countryByCode.get(data.countryCode)
      if (!country) {
        log.warn(`Country not found for code: ${data.countryCode}`)
        skipped++
        continue
      }

      // Check if data already exists for this country and year
      const existing = await payload.find({
        collection: 'crime-index-scores' as any,
        where: {
          and: [
            { country: { equals: country.id } },
            { year: { equals: data.year } },
          ],
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        log.info(`Crime data already exists for ${data.countryName} (${data.year})`)
        continue
      }

      await payload.create({
        collection: 'crime-index-scores' as any,
        data: {
          country: country.id,
          year: data.year,
          criminalityScore: data.criminalityScore,
          resilienceScore: (data as any).resilienceScore || 5.0, // Default to middle score if not provided
          rank: typeof data.rank === 'string' ? parseInt(data.rank) : (data.rank || null),
          region: data.region,
          criminalMarkets: (data as any).criminalMarkets || {
            humanTrafficking: 0,
            humanSmuggling: 0,
            extortionProtection: 0,
            armsTrafficking: 0,
            counterfeiting: 0,
            illicitDrugs: 0,
            environmentalCrimes: 0,
            heistRobbery: 0,
            financialCrimes: 0,
            cyberCrimes: 0,
            privateCorruption: 0,
            publicCorruption: 0,
            heroinTrade: 0,
            syntheticDrugTrade: 0,
          },
          criminalActors: (data as any).criminalActors || {
            mafiaStyle: 0,
            criminalNetworks: 0,
            stateActors: 0,
            foreignActors: 0,
            privateActors: 0,
          },
          resilience: (data as any).resilience || {
            politicalLeadership: 0,
            governmentTransparency: 0,
            internationalCooperation: 0,
            nationalPolicies: 0,
            judicialSystem: 0,
            lawEnforcement: 0,
            territorialIntegrity: 0,
            antiMoneyLaundering: 0,
            economicRegulation: 0,
            victimSupport: 0,
            prevention: 0,
            nonStateActors: 0,
          },
        },
      })
      created++
    } catch (error) {
      log.error(`Failed to create crime index for ${data.countryName}: ${(error as any).message}`)
      skipped++
    }
  }

  log.info(`✓ Seeded ${created} crime index scores (${skipped} skipped)`)

  // Seed crime trends data
  await seedCrimeTrends(payload)
  
  log.info('✓ Crime index seeding complete')
}

// Export the raw data for use in other scripts if needed
export { crimeIndexData }
