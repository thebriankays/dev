/* ──────────────────────────────────────────  src/endpoints/seed/regions.ts */
import type { Payload } from 'payload'
import { promises as fs } from 'fs'
import path from 'path'

/* -------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------- */
interface RawRegion {
  name: string
  shortCode?: string
}

interface RawCountry {
  countryShortCode: string // ISO-3166-1 α-2
  countryName: string
  regions: RawRegion[]
}

/** quick guess → region “type” used by our collection */
const inferType = (
  countryCode: string,
  shortCode?: string,
): 'state' | 'province' | 'territory' | 'region' | 'district' => {
  if (countryCode === 'US') return 'state'
  if (countryCode === 'CA') return 'province'
  if (countryCode === 'AU') return shortCode === 'ACT' || shortCode === 'NT' ? 'territory' : 'state'
  if (countryCode === 'IN') return 'state'
  if (countryCode === 'CN') return 'province'
  return 'region'
}

/* -------------------------------------------------------------
 * Seed function
 * ----------------------------------------------------------- */
export const seedRegions = async (payload: Payload): Promise<void> => {
  const { totalDocs } = await payload.count({ collection: 'regions' })
  if (totalDocs > 0) {
    payload.logger.info(`— Skipping regions seed, ${totalDocs} already exist`)
    return
  }

  payload.logger.info('— Seeding regions…')

  /* ----------------------------------------
   * 1️⃣  Load JSON (local → remote fallback)
   * -------------------------------------- */
  const jsonStr = await fs
    .readFile(path.join(process.cwd(), 'public', 'region-data', 'data.json'), 'utf-8')
    .catch(async () => {
      const res = await fetch(
        'https://raw.githubusercontent.com/country-regions/country-region-data/master/data.json',
      )
      if (!res.ok) throw new Error(`remote fetch failed (${res.status})`)
      return res.text()
    })

  const raw: RawCountry[] = JSON.parse(jsonStr)

  /* ----------------------------------------
   * 2️⃣  Build country-code → id map
   * -------------------------------------- */
  const countries = await payload.find({
    collection: 'countries',
    limit: 0, // No limit - get all countries
  })
  const countryMap = new Map(countries.docs.map((c) => [c.code, c.id]))

  /* ----------------------------------------
   * 3️⃣  Iterate & seed
   * -------------------------------------- */
  let seeded = 0

  for (const c of raw) {
    const countryId = countryMap.get(c.countryShortCode)
    if (!countryId) {
      payload.logger.debug(
        `[seed-regions] country not found: ${c.countryShortCode} (${c.countryName})`,
      )
      continue
    }

    for (const r of c.regions) {
      try {
        await payload.create({
          collection: 'regions',
          data: {
            name: r.name,
            code: r.shortCode ?? undefined,
            type: inferType(c.countryShortCode, r.shortCode),
            country: countryId,
          },
        })
        seeded++
      } catch (err) {
        payload.logger.error(
          `[seed-regions] ${r.name} (${c.countryShortCode}): ${(err as Error).message}`,
        )
      }
    }
  }

  payload.logger.info(`✓ Seeded ${seeded} regions`)
}

export default seedRegions
