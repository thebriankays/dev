import type { Payload } from 'payload'
import type { Country } from '@/payload-types'
import { allCrimeTrends } from './crime-trends-data'

export const seedCrimeTrends = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('— Seeding crime trends data...')

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

  for (const trendData of allCrimeTrends) {
    try {
      const country = countryByCode.get(trendData.countryCode)
      if (!country) {
        log.warn(`Country not found for code: ${trendData.countryCode} (${trendData.countryName})`)
        skipped++
        continue
      }

      // Check if trend already exists
      const existing = await payload.find({
        collection: 'crime-trends' as any,
        where: {
          and: [
            { country: { equals: country.id } },
            { indicator: { equals: trendData.indicator } },
            { year: { equals: 2023 } }, // The data is for 2023
          ],
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        log.info(`Crime trend already exists for ${trendData.countryName} - ${trendData.indicator}`)
        continue
      }

      // Determine trend direction
      let trend: 'increasing' | 'decreasing' | 'stable'
      if (trendData.change > 0.05) {
        trend = 'increasing'
      } else if (trendData.change < -0.05) {
        trend = 'decreasing'
      } else {
        trend = 'stable'
      }

      // Calculate approximate scores if not provided
      // For overall criminality, we can estimate based on typical ranges
      let currentScore = trendData.currentScore || 5.0
      let previousScore = trendData.previousScore || (currentScore - trendData.change)
      
      // Ensure scores are within valid range
      currentScore = Math.max(0, Math.min(10, currentScore))
      previousScore = Math.max(0, Math.min(10, previousScore))

      // Calculate percentage change
      const changePercent = previousScore !== 0 
        ? ((currentScore - previousScore) / previousScore) * 100 
        : 0

      await payload.create({
        collection: 'crime-trends' as any,
        data: {
          country: country.id,
          indicator: trendData.indicator,
          category: trendData.category === 'overall' ? 'markets' : trendData.category, // Map 'overall' to 'markets' or another valid option
          previousScore,
          currentScore,
          changePercent,
          trend,
          year: 2023,
        },
      })
      created++
    } catch (error) {
      log.error(`Failed to create crime trend for ${trendData.countryName} - ${trendData.indicator}: ${(error as any).message}`)
      skipped++
    }
  }

  log.info(`✓ Seeded ${created} crime trends (${skipped} skipped)`)
}
