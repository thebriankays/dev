import type { Payload } from 'payload'
import { seedCurrencies } from './currencies'
import { seedLanguages } from './languages'
import { seedTimezones } from './timezones'
import { seedReligions } from './religions'
import { seedCountries } from './countries'
import { seedRegions } from './regions'
import { seedAirports } from './airports-improved'
import { seedDestinationCategories } from './destination-categories'
import { seedDestinationTypes } from './destination-types'
import seedVisaRequirements from './visa-requirements'
import { seedCompleteFactbookData } from './factbook-complete'
import { seedCompleteCrimeData } from './crime-complete'
import { seedCompleteTravelAdvisories } from './travel-advisories-complete'

// Master location data seeder that uses all the COMPLETE seeders
export const seedLocationDataComplete = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('=== Starting COMPLETE Location Data Seed ===')
  log.info('This will seed ALL location data with comprehensive information')

  try {
    // Step 1: Base data (currencies, languages, timezones, religions)
    log.info('\n--- Step 1: Seeding base data ---')
    await seedCurrencies(payload)
    await seedLanguages(payload)
    await seedTimezones(payload)
    await seedReligions(payload)

    // Step 2: Countries (depends on currencies, languages, and timezones)
    log.info('\n--- Step 2: Seeding countries ---')
    await seedCountries(payload)

    // Step 3: Regions (depends on countries)
    log.info('\n--- Step 3: Seeding regions ---')
    await seedRegions(payload)

    // Step 4: Airports (depends on countries, regions, and timezones)
    log.info('\n--- Step 4: Seeding airports ---')
    await seedAirports(payload)

    // Step 5: Destination metadata
    log.info('\n--- Step 5: Seeding destination metadata ---')
    await seedDestinationCategories(payload)
    await seedDestinationTypes(payload)

    // Step 6: Visa requirements (depends on countries)
    log.info('\n--- Step 6: Seeding visa requirements ---')
    await seedVisaRequirements(payload)

    // Step 7: CIA World Factbook data (country details, media, and updates religions)
    log.info('\n--- Step 7: Seeding CIA World Factbook data ---')
    log.info('This includes country details, media references, and religion updates')
    await seedCompleteFactbookData(payload)

    // Step 8: Crime data from JSON file
    log.info('\n--- Step 8: Seeding crime index data ---')
    await seedCompleteCrimeData(payload)

    // Step 9: Travel advisories (RSS with comprehensive fallback)
    log.info('\n--- Step 9: Seeding travel advisories ---')
    await seedCompleteTravelAdvisories(payload)

    log.info('\n=== COMPLETE Location Data Seed Finished Successfully! ===')
    log.info('All location data has been seeded with comprehensive information.')
    
  } catch (error) {
    log.error('=== Location Data Seed Failed ===')
    log.error(`Error: ${(error as any).message}`)
    throw error
  }
}

// Export for use in main seed file
export const seedLocationData = seedLocationDataComplete
