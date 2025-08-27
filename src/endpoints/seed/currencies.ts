import type { Payload } from 'payload'
import { currenciesData } from './location-data/currencies'

export const seedCurrencies = async (payload: Payload): Promise<void> => {
  const { totalDocs: existing } = await payload.count({
    collection: 'currencies',
  })

  if (existing > 0) {
    payload.logger.info(`— Skipping currencies seed, ${existing} already exist`)
    return
  }

  payload.logger.info('— Seeding currencies...')

  for (const currency of currenciesData) {
    try {
      await payload.create({
        collection: 'currencies',
        data: currency,
      })
    } catch (error) {
      payload.logger.error(`Error creating currency ${currency.name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  payload.logger.info(`✓ Seeded ${currenciesData.length} currencies`)
}
