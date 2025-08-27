import type { Payload } from 'payload'
import fs from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'csv-parse/sync'
import type { Airport, Country, Region, Timezone } from '@/payload-types'

/* ---------- CSV + tz-mapping shapes -------------------------------- */
interface CsvRow {
  ident: string
  type: string
  name: string
  elevation_ft: string
  continent: string
  iso_country: string
  iso_region: string
  municipality: string
  icao_code: string
  iata_code: string
  coordinates: string // "lat, lon"
}
interface IataTz {
  code: string
  timezone: string
}

/* ---------- map airport-csv types to our enum ---------------------- */
const TYPE_MAP: Record<string, Airport['type']> = {
  large_airport: 'large',
  medium_airport: 'medium',
  small_airport: 'small',
  heliport: 'heliport',
  seaplane_base: 'seaplane',
  closed: 'closed',
}

/* ===================================================================
 * MAIN SEEDER
 * ================================================================= */
export async function seedAirports(payload: Payload): Promise<void> {
  const log = payload.logger ?? console
  log.info('— Seeding airports…')

  /* ----------- look-up tables from the DB ----------------------- */
  const countryRes = await payload.find({ 
    collection: 'countries', 
    limit: 0 // No limit - get all countries
  }) as unknown as {
    docs: Country[]
  }
  const countryByISO = new Map<string, Country>(
    countryRes.docs.map((c): [string, Country] => [c.code, c]),
  )

  const regionRes = await payload.find({ 
    collection: 'regions', 
    limit: 0 // No limit - get all regions
  }) as unknown as {
    docs: Region[]
  }
  const regionByISO = new Map<string, Region>(
    regionRes.docs.map((r): [string, Region] => [r.code as string, r]),
  )

  const tzRes = await payload.find({ 
    collection: 'timezones', 
    limit: 0 // No limit - get all timezones
  }) as unknown as {
    docs: Timezone[]
  }
  const tzIdBySlug = new Map<string, number>()
  const tzIdByName = new Map<string, number>()
  
  tzRes.docs.forEach((t) => {
    tzIdBySlug.set(t.slug, t.id)
    // Also map by the original name
    if (t.name) {
      tzIdByName.set(t.name, t.id)
    }
  })
  
  log.info(`Loaded ${tzIdBySlug.size} timezones for mapping`)
  if (tzIdBySlug.size === 0) {
    log.error('No timezones found! Please run timezone seeding first.')
    return
  }
  
  // Debug: log first few timezone entries to see format
  const sampleEntries = tzRes.docs.slice(0, 3).map(t => `${t.name} -> ${t.slug}`)
  log.info(`First few timezone mappings: ${sampleEntries.join(', ')}`)

  /* ----------- IATA-code → Olson TZ name ------------------------ */
  const tzJson = JSON.parse(
    await fs.readFile(path.join(process.cwd(), 'public', 'airport-data', 'airports.json'), 'utf8'),
  ) as IataTz[]
  const tzByIata = new Map<string, string>(
    tzJson.map((t): [string, string] => [t.code.toUpperCase(), t.timezone]),
  )

  /* ----------- CSV rows ----------------------------------------- */
  const csvRows = parse(
    await fs.readFile(
      path.join(process.cwd(), 'public', 'airport-data', 'airport-codes.csv'),
      'utf8',
    ),
    { columns: true, skip_empty_lines: true },
  ) as CsvRow[]

  /* ----------- upsert loop -------------------------------------- */
  let created = 0,
    skipped = 0
    
  // Track skip reasons for debugging
  const skipReasons = {
    noIATA: 0,
    noCountry: 0,
    invalidCoords: 0,
    noTimezone: 0,
    noCity: 0,
    errors: 0,
  }

  // Track airports that need timezone updates
  const airportsNeedingTimezone: Array<{ iata: string, country: string }> = []

  for (const row of csvRows) {
    try {
      /* Basic validation - only skip if we really can't use the airport */
      
      // Check for any identifier
      const hasIATA = row.iata_code && row.iata_code.trim().length === 3
      const hasICAO = row.icao_code && row.icao_code.trim().length === 4
      
      // Many airports use the ident field as their ICAO code
      // If ident is 4 characters and looks like an ICAO code, we'll use it
      let identAsICAO = false
      if (!hasICAO && row.ident && row.ident.trim().length === 4) {
        const identUpper = row.ident.trim().toUpperCase()
        // ICAO codes are typically 4 letters/numbers starting with a letter
        if (/^[A-Z][A-Z0-9]{3}$/.test(identUpper)) {
          identAsICAO = true
        }
      }
      
      // Accept airports with IATA, ICAO, or valid ident as ICAO
      if (!hasIATA && !hasICAO && !identAsICAO) {
        skipped++
        skipReasons.noIATA++
        continue
      }
      
      // Must have a country
      const country = countryByISO.get(row.iso_country)
      if (!country) {
        skipped++
        skipReasons.noCountry++
        continue
      }

      /* coordinates - required */
      const [latRaw, lonRaw] = row.coordinates.split(',')
      const latitude = Number(latRaw?.trim())
      const longitude = Number(lonRaw?.trim())
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        skipped++
        skipReasons.invalidCoords++
        continue
      }

      /* City - use municipality or extract from name if needed */
      let city = row.municipality?.trim()
      if (!city) {
        // Try to extract city from name (e.g., "Los Angeles International Airport")
        const nameMatch = row.name.match(/^(.+?)\s+(International|Regional|Municipal|Airport|Airfield|Heliport)/i)
        if (nameMatch && nameMatch[1]) {
          city = nameMatch[1].trim()
        } else {
          // Use the full name as last resort
          city = row.name
        }
      }

      /* timezone - try multiple fallbacks */
      let tzId: number | undefined
      
      // 1. Try IATA timezone mapping
      if (hasIATA) {
        const tzName = tzByIata.get(row.iata_code.toUpperCase())
        if (tzName) {
          // Try exact name match first
          tzId = tzIdByName.get(tzName)
          
          if (!tzId) {
            // Convert timezone name to slug format: America/New_York -> america-new-york
            const tzSlug = tzName.toLowerCase().replace(/[\/\s_]+/g, '-')
            tzId = tzIdBySlug.get(tzSlug)
          }
          
          if (!tzId) {
            // Try without underscores converted (some might use america-new_york)
            const tzSlugAlt = tzName.toLowerCase().replace(/\//g, '-')
            tzId = tzIdBySlug.get(tzSlugAlt)
          }
        }
      }
      
      // 2. Try country's timezones
      if (!tzId && country.timezones && country.timezones.length > 0) {
        // Use the first timezone of the country as a reasonable default
        const countryTimezone = country.timezones[0]
        if (typeof countryTimezone === 'object' && 'id' in countryTimezone) {
          tzId = countryTimezone.id
        } else if (typeof countryTimezone === 'number') {
          tzId = countryTimezone
        }
        
        // Log that we're using country timezone
        if (tzId && hasIATA) {
          airportsNeedingTimezone.push({ 
            iata: row.iata_code.toUpperCase(), 
            country: country.name 
          })
        }
      }
      
      // 3. Don't skip if no timezone - we can update it later
      // Just log it for potential future updates
      if (!tzId) {
        // Only log for airports with IATA codes to reduce noise
        if (hasIATA && created < 5) {
          const tzName = tzByIata.get(row.iata_code.toUpperCase())
          if (tzName) {
            const tzSlug = tzName.toLowerCase().replace(/[\/\s_]+/g, '-')
            log.warn(`No timezone found for ${row.name} (${row.iata_code}) in ${country.name}. TZ name: ${tzName}, looking for slug: ${tzSlug}`)
          }
        }
        // Continue without timezone - it's not critical
      }

      /* optional region */
      let regionId: number | undefined
      if (row.iso_region) {
        regionId = regionByISO.get(row.iso_region)?.id
      }

      /* build document */
      // Get ICAO code - from icao_code field or ident if it looks like ICAO
      let icaoCode = ''
      if (row.icao_code && row.icao_code.trim().length === 4) {
        icaoCode = row.icao_code.trim()
      } else if (identAsICAO && row.ident) {
        icaoCode = row.ident.trim()
      }
      
      const data: Omit<Airport, 'id' | 'createdAt' | 'updatedAt' | 'sizes'> = {
        name: row.name,
        ...(hasIATA && { iata: row.iata_code.toUpperCase() }),
        ...(icaoCode && { icao: icaoCode.toUpperCase() }),
        city: city,
        type: TYPE_MAP[row.type] ?? 'small',
        latitude,
        longitude,
        elevation: row.elevation_ft ? Number(row.elevation_ft) : null,
        country: country.id,
        region: regionId,
        ...(tzId && { timezone: tzId }),
      }

      await payload.create({ collection: 'airports', data })
      created++
      
      // Log progress every 1000 airports
      if (created % 1000 === 0) {
        log.info(`  Progress: ${created} airports created...`)
      }
      
    } catch (err) {
      skipped++
      skipReasons.errors++
      const error = err as any
      
      // Only log errors for important airports (with IATA codes)
      if (row.iata_code) {
        if (error?.message?.includes('duplicate key')) {
          // This is expected for some airports, don't log
        } else if (error?.data?.errors && Array.isArray(error.data.errors)) {
          const fields = error.data.errors.map((e: any) => e.field).join(', ')
          log.error(`[seed-airports] ${row.name} (${row.iata_code}): Validation failed for fields: ${fields}`)
        } else {
          log.error(`[seed-airports] ${row.name} (${row.iata_code}): ${error.message || 'Unknown error'}`)
        }
      }
    }
  }

  log.info(`✅ Airports seed → created ${created}, skipped ${skipped}`)
  log.info(`Skip reasons: No IATA/ICAO: ${skipReasons.noIATA}, No Country: ${skipReasons.noCountry}, Invalid Coords: ${skipReasons.invalidCoords}, No City: ${skipReasons.noCity}, Errors: ${skipReasons.errors}`)
  
  if (airportsNeedingTimezone.length > 0) {
    log.info(`ℹ️  ${airportsNeedingTimezone.length} airports used country timezone as fallback`)
  }
}

export default seedAirports
