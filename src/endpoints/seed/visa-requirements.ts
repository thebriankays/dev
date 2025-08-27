/* ---------------------------------------------------------------------- */
/*  src/endpoints/seed/visa-requirements.ts                               */
/* ---------------------------------------------------------------------- */

import type { Payload } from 'payload'
import type { Country, VisaRequirement } from '@/payload-types'
import fs from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'csv-parse/sync'

/* ───────── CSV row shape ───────── */
interface CsvRow {
  passport: string
  destination: string
  requirement: string
}

/* ───────── Normalise free-text → enum + optional days ───────── */
type Req = VisaRequirement['requirement']
interface NormalisedReq {
  requirement: Req
  days?: number
}

const normaliseReq = (raw: string): NormalisedReq | null => {
  const r = raw.trim().toLowerCase()

  /* 1. Positive integer → visa_free + days */
  const num = Number(r)
  if (!Number.isNaN(num) && num > 0) {
    return { requirement: 'visa_free', days: num }
  }

  /* 2. Canonical strings */
  switch (r) {
    case 'visa free':
    case 'visa-free':
      return { requirement: 'visa_free' }

    case 'visa on arrival':
    case 'visa-on-arrival':
      return { requirement: 'visa_on_arrival' }

    case 'e-visa':
    case 'evisa':
      return { requirement: 'evisa' }

    case 'eta':
      return { requirement: 'eta' }

    case 'visa required':
    case 'visa-required':
      return { requirement: 'visa_required' }

    case 'no admission':
      return { requirement: 'no_admission' }

    /* legacy junk we skip silently */
    case 'hayya entry permit':
    case 'covid ban':
      return null

    default:
      return null
  }
}

/* ====================================================================== */
/*  MAIN EXPORT                                                           */
/* ====================================================================== */
export const seedVisaRequirements = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('— Seeding visa requirements…')

  /* ---------- 1. ISO-2 → country-ID look-up ---------- */
  const { docs: countries } = (await payload.find({
    collection: 'countries',
    limit: 0, // No limit - get all countries
  })) as unknown as { docs: Country[] }

  const isoToId = new Map(countries.map((c) => [c.code.toUpperCase(), c.id]))

  /* ---------- 2. Parse CSV ------------------------------------------ */
  const csvFile = path.join(process.cwd(), 'public', 'country-data', 'passport-index-tidy-iso2.csv')
  const csvRaw = await fs.readFile(csvFile, 'utf8')

  const records = parse(csvRaw, {
    columns: true,
    trim: true,
    skip_empty_lines: true,
  }) as Record<string, string>[]

  const rows: CsvRow[] = records.map((r) => ({
    passport: r.Passport?.toUpperCase() ?? '',
    destination: r.Destination?.toUpperCase() ?? '',
    requirement: r.Requirement ?? '',
  }))

  /* ---------- 3. Insert --------------------------------------------- */
  let created = 0,
    skipped = 0,
    badIso = 0,
    badReq = 0

  for (const row of rows) {
    const homeId = isoToId.get(row.passport)
    const destId = isoToId.get(row.destination)
    const norm = normaliseReq(row.requirement)

    if (!homeId || !destId) {
      badIso++
      skipped++
      continue
    }
    if (!norm) {
      badReq++
      skipped++
      continue
    }

    const data: Omit<VisaRequirement, 'id' | 'createdAt' | 'updatedAt' | 'sizes'> = {
      passportCountry: homeId,
      destinationCountry: destId,
      requirement: norm.requirement,
      ...(norm.days ? { days: norm.days } : {}),
    }

    try {
      await payload.create({
        collection: 'visa-requirements',
        data,
      })
      created++
    } catch (err) {
      skipped++
      log.error(`[visa-seed] ${row.passport}-${row.destination}: ${(err as Error).message}`)
    }
  }

  log.info(
    `✓ Visa requirements → created ${created}, skipped ${skipped} (bad ISO: ${badIso}, bad req: ${badReq})`,
  )
}

export default seedVisaRequirements
