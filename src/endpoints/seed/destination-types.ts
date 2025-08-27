import type { Payload } from 'payload'
import { destinationTypesData } from './location-data/destination-types'

export const seedDestinationTypes = async (payload: Payload): Promise<void> => {
  const { totalDocs: existing } = await payload.count({
    collection: 'destination-types',
  })

  if (existing > 0) {
    payload.logger.info(`— Skipping destination types seed, ${existing} already exist`)
    return
  }

  payload.logger.info('— Seeding destination types...')

  for (const type of destinationTypesData) {
    try {
      await payload.create({
        collection: 'destination-types',
        data: type,
      })
    } catch (error) {
      payload.logger.error(`Error creating destination type ${type.name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  payload.logger.info(`✓ Seeded ${destinationTypesData.length} destination types`)
}
