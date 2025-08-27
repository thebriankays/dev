import type { Payload } from 'payload'
import { destinationCategoriesData } from './location-data/destination-categories'

export const seedDestinationCategories = async (payload: Payload): Promise<void> => {
  const { totalDocs: existing } = await payload.count({
    collection: 'destination-categories',
  })

  if (existing > 0) {
    payload.logger.info(`— Skipping destination categories seed, ${existing} already exist`)
    return
  }

  payload.logger.info('— Seeding destination categories...')

  for (const category of destinationCategoriesData) {
    try {
      await payload.create({
        collection: 'destination-categories',
        data: category,
      })
    } catch (error) {
      payload.logger.error(`Error creating destination category ${category.name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  payload.logger.info(`✓ Seeded ${destinationCategoriesData.length} destination categories`)
}
