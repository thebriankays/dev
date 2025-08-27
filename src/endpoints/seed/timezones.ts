import type { Payload } from 'payload'
import { promises as fs } from 'fs'
import path from 'path'

/* ------------------------------------------------------------------ *
 * Helpers                                                            *
 * ------------------------------------------------------------------ */

/** slugify a zone name – `America/Los_Angeles` ➜ `america-los-angeles` */
const toSlug = (name: string): string => name.toLowerCase().replace(/[\/\s_]+/g, '-')

/** +-HH:MM string from an offset in minutes (e.g. –480 ➜ “-08:00”) */
const offsetStr = (mins: number): string => {
  const sign = mins >= 0 ? '+' : '-'
  const abs = Math.abs(mins)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${sign}${hh}:${mm}`
}

/* ------------------------------------------------------------------ *
 * Seeder                                                             *
 * ------------------------------------------------------------------ */

export const seedTimezones = async (payload: Payload): Promise<void> => {
  const { totalDocs } = await payload.count({ collection: 'timezones' })
  if (totalDocs > 0) {
    payload.logger.info(`— Skipping time-zones seed, ${totalDocs} already exist`)
    return
  }

  payload.logger.info('— Seeding time-zones …')

  /* read the full IANA list you downloaded */
  const jsonPath = path.join(process.cwd(), 'public', 'timezone-data', 'raw-time-zones.json')
  let raw: string
  let zones: {
    name: string
    alternativeName?: string
    rawOffsetInMinutes: number
    abbreviation?: string
    continentCode?: string
    countryCode?: string
  }[] = []
  
  try {
    raw = await fs.readFile(jsonPath, 'utf-8')
    zones = JSON.parse(raw)
  } catch (error) {
    payload.logger.error(`Failed to read timezone data: ${(error as Error).message}`)
    
    // Use the timezones-list package as fallback
    payload.logger.info('Using timezones-list package as fallback...')
    try {
      // Import the timezones list
      const timezonesModule = await import('timezones-list')
      
      // The default export is an array of TimeZone objects
      let timezones: any[] = []
      if (Array.isArray(timezonesModule.default)) {
        timezones = timezonesModule.default
      } else if (Array.isArray(timezonesModule)) {
        timezones = timezonesModule as any
      } else {
        throw new Error('Could not extract timezones array from module')
      }
      
      zones = timezones.map((tz: any) => ({
        name: tz.tzCode,
        alternativeName: tz.label,
        rawOffsetInMinutes: tz.utcOffset,
        abbreviation: tz.abbreviation
      }))
    } catch (importError) {
      payload.logger.error('timezones-list package not installed. Please run: npm install timezones-list')
      return
    }
  }

  let created = 0
  for (const z of zones) {
    try {
      await payload.create({
        collection: 'timezones',
        data: {
          /* your collection’s fields: */
          name: z.name,
          slug: toSlug(z.name),
          label: z.alternativeName ?? z.name,
          offset: offsetStr(z.rawOffsetInMinutes),
          offsetMinutes: z.rawOffsetInMinutes,
          isDST: false, // We don't have DST info in this data
        },
      })
      created++
    } catch (err) {
      payload.logger.error(`[seed-timezones] ${z.name}: ${(err as Error).message}`)
    }
  }

  payload.logger.info(`✓ Seeded ${created} time-zones`)
}
