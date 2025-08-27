import type { Payload } from 'payload'
import { parse } from 'csv-parse/sync'
import { promises as fs } from 'fs'
import path from 'path'

import type { MichelinRestaurant as MichelinDoc } from '@/payload-types'

/* row mapping */
interface Row {
  name: string
  location?: string
  address?: string
  price?: string
  cuisine?: string
  longitude?: string
  latitude?: string
  url?: string
  websiteUrl?: string
  phoneNumber?: string
  award?: string
  greenStar?: string
  description?: string
}

const HEAD: Record<string, keyof Row> = {
  name: 'name',
  location: 'location',
  address: 'address',
  price: 'price',
  cuisine: 'cuisine',
  longitude: 'longitude',
  latitude: 'latitude',
  url: 'url',
  websiteurl: 'websiteUrl',
  phonenumber: 'phoneNumber',
  award: 'award',
  greenstar: 'greenStar',
  description: 'description',
}

const rowsFromCSV = (csv: string): Row[] =>
  (
    parse(csv, { columns: true, trim: true, skip_empty_lines: true }) as Record<string, string>[]
  ).map((src) => {
    const out: Partial<Row> = {}
    for (const [rawK, v] of Object.entries(src)) {
      const k = rawK.toLowerCase().replace(/[^a-z0-9]/g, '')
      const mapped = HEAD[k]
      if (mapped) out[mapped] = v
    }
    return out as Row
  })

/* ------------------------------------------------------------------ */

type MichelinCreate = Omit<MichelinDoc, 'id' | 'createdAt' | 'updatedAt' | 'sizes'>

export const seedMichelinRestaurants = async (payload: Payload): Promise<void> => {
  const log = payload.logger
  log.info('— Seeding Michelin restaurants…')

  const csv = await fs
    .readFile(path.join(process.cwd(), 'public', 'michelin-data', 'michelin_my_maps.csv'), 'utf8')
    .catch(async () => {
      const r = await fetch(
        'https://raw.githubusercontent.com/ngshiheng/michelin-my-maps/refs/heads/main/data/michelin_my_maps.csv',
      )
      if (!r.ok) throw new Error(`Remote CSV fetch failed: ${r.status}`)
      return r.text()
    })

  const rows = rowsFromCSV(csv)
  log.info(`Parsed ${rows.length} rows`)

  let created = 0,
    updated = 0,
    skipped = 0

  for (const row of rows) {
    try {
      const name = row.name?.trim()
      if (!name) {
        skipped++
        continue
      }

      /* city / country */
      let city = ''
      let countryName = ''
      if (row.location) {
        const parts = row.location.split(',').map((s) => s.trim())
        city = parts[0] ?? ''
        countryName = parts.at(-1) ?? ''
        
        // Map country names to match database
        const countryMap: Record<string, string> = {
          'USA': 'United States',
          'China Mainland': 'China',
          'Hong Kong SAR China': 'Hong Kong',
          'Dubai': 'United Arab Emirates',
          'Abu Dhabi': 'United Arab Emirates',
        }
        
        if (countryMap[countryName]) {
          const originalName = countryName
          countryName = countryMap[countryName]
          log.info(`[seed-michelin] Mapped country "${originalName}" to "${countryName}"`)
        }
      }

      const countryResult = await payload.find({
        collection: 'countries',
        where: { name: { like: countryName } },
        limit: 1,
      })
      const country = countryResult.docs[0]?.id
      
      // Log when country is not found
      if (!country && countryName) {
        log.warn(`[seed-michelin] Country not found: "${countryName}" (for restaurant: ${name})`)
      }

      // Removed destination lookup - destinations will find restaurants by coordinates

      /* rating / price */
      const rating = (row.award?.match(/\d/)?.[0] as '1' | '2' | '3' | undefined) ?? undefined
      const priceCnt = (row.price?.match(/[$€£¥]/g) ?? []).length
      const priceRange =
        priceCnt >= 1 && priceCnt <= 4 ? (String(priceCnt) as '1' | '2' | '3' | '4') : undefined

      /* lat/lon */
      const latitude = row.latitude ? Number(row.latitude) : undefined
      const longitude = row.longitude ? Number(row.longitude) : undefined

      /* look for an existing record (name + city) */
      const existing = await payload.find({
        collection: 'michelin-restaurants',
        where: {
          and: [{ name: { equals: name } }, { 'location.city': { equals: city } }],
        },
        limit: 1,
      })

      const base: MichelinCreate = {
        name,
        year: new Date().getFullYear(),
        link: row.url?.trim(),
        website: row.websiteUrl?.trim(),
        phone: row.phoneNumber?.trim(),
        award: row.award,
        greenStar: !!row.greenStar,
        ...(country ? { country } : {}),
        location: {
          address: row.address?.trim(),
          city,
          latitude,
          longitude,
        },
        type: rating ? 'restaurant' : 'bib-gourmand',
        cuisine: row.cuisine?.trim(),
        description: row.description?.trim(),
        isActive: true,
      }

      if (rating) base.rating = Number(rating) as 1 | 2 | 3
      if (priceRange) base.priceRange = priceRange

      if (existing.docs.length === 0) {
        await payload.create({ collection: 'michelin-restaurants', data: base })
        created++
      } else {
        await payload.update({
          collection: 'michelin-restaurants',
          id: existing.docs[0]!.id,
          data: base,
        })
        updated++
      }
    } catch (err) {
      skipped++
      log.error(`[seed-michelin] ${row.name}: ${(err as Error).message}`)
    }
  }

  log.info(`✓ Michelin → created ${created}, updated ${updated}, skipped ${skipped}`)
}

export default seedMichelinRestaurants
