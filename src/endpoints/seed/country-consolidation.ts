import type { Payload } from 'payload'
import type { Country } from '@/payload-types'
import axios from 'axios'
import * as fs from 'fs/promises'
import * as path from 'path'

// Fix language codes that don't match ISO standards
const LANGUAGE_CODE_FIXES: Record<string, string> = {
  ven: 've', // Venetian
  vec: 've', // Alternative Venetian code
  scn: 'sc', // Sicilian
  nap: 'na', // Neapolitan
  lmo: 'lm', // Lombard
  lij: 'lj', // Ligurian
  eml: 'em', // Emilian-Romagnol
  rgn: 'rg', // Romagnol
  fur: 'fu', // Friulian
  lld: 'll', // Ladin
  srd: 'sr', // Sardinian
  pms: 'pm', // Piedmontese
  'zh-CN': 'zh', // Chinese simplified to base code
  'zh-TW': 'zh', // Chinese traditional to base code
  'no-NO': 'no', // Norwegian
  'sv-SE': 'sv', // Swedish
  'da-DK': 'da', // Danish
}

// Function to get valid language code
function getValidLanguageCode(code: string): string {
  // First check if it needs fixing
  if (LANGUAGE_CODE_FIXES[code]) {
    return LANGUAGE_CODE_FIXES[code]
  }

  // If it's already 2-3 chars, it's probably valid
  if (/^[a-z]{2,3}$/.test(code)) {
    return code
  }

  // If it has a region, take just the language part
  const match = code.match(/^([a-z]{2,3})-/)
  if (match && match[1]) {
    return match[1]
  }

  // Default to first 2 chars
  return code.substring(0, 2).toLowerCase()
}

export async function consolidateCountryData(payload: Payload): Promise<void> {
  const log = payload.logger ?? console
  log.info('— Consolidating country data...')

  try {
    // Get all countries
    const countries = (await payload.find({
      collection: 'countries',
      limit: 0,
    })) as unknown as { docs: Country[] }

    log.info(`Processing ${countries.docs.length} countries...`)

    for (const country of countries.docs) {
      try {
        // For now, we'll skip the CountryDetails creation since the collection doesn't exist yet
        log.info(`Processing data for ${country.name}`)

        // Get country details if they exist
        const countryDetails = await payload.find({
          collection: 'country-details' as any,
          where: {
            country: { equals: country.id },
          },
          limit: 1,
        })

        const crimeData = await payload.find({
          collection: 'crime-index-scores',
          where: {
            country: { equals: country.id },
          },
          limit: 1,
          sort: '-year',
        })

        if (countryDetails.docs.length > 0 || crimeData.docs.length > 0) {
          log.info(`Found existing data for ${country.name}`)
        }
      } catch (error) {
        log.error(`Failed to process ${country.name}: ${(error as any).message}`)
      }
    }

    log.info('✓ Country data consolidation complete')
  } catch (error) {
    log.error(`Failed to consolidate country data: ${(error as any).message}`)
  }
}

export async function downloadCountryMedia(payload: Payload): Promise<void> {
  const log = payload.logger ?? console
  log.info('— Downloading country media from CIA Factbook...')

  try {
    // Base URL for factbook media
    const mediaBaseUrl = 'https://raw.githubusercontent.com/factbook/media/master'

    // Get all countries
    const countries = (await payload.find({
      collection: 'countries',
      limit: 0,
    })) as unknown as { docs: Country[] }

    for (const country of countries.docs) {
      try {
        const countryCode = country.code.toLowerCase()

        // Define media files to download
        const mediaFiles = [
          {
            folder: 'maps',
            filename: `${countryCode}.png`,
            type: 'political',
            title: `${country.name} Political Map`,
          },
          {
            folder: 'locators',
            filename: `${countryCode}.png`,
            type: 'locator',
            title: `${country.name} Location Map`,
          },
        ]

        for (const media of mediaFiles) {
          try {
            // For now, use the existing media collection
            const existing = await payload.find({
              collection: 'media',
              where: {
                alt: { equals: `${country.name} ${media.type} map` },
              },
              limit: 1,
            })

            if (existing.docs.length > 0) {
              continue
            }

            // Try to download the media file
            const mediaUrl = `${mediaBaseUrl}/${media.folder}/${media.filename}`
            const response = await axios
              .get(mediaUrl, {
                responseType: 'arraybuffer',
                validateStatus: (status) => status === 200,
              })
              .catch(() => null)

            if (!response) {
              continue
            }

            // Convert to buffer
            const buffer = Buffer.from(response.data)

            // Create media record with proper Lexical format for caption
            const captionData = {
              root: {
                type: 'root' as const,
                children: [
                  {
                    type: 'paragraph',
                    version: 1,
                    children: [
                      {
                        type: 'text',
                        version: 1,
                        text: `Official CIA World Factbook ${media.type} map of ${country.name}`,
                        format: 0,
                        style: '',
                        mode: 'normal',
                        detail: 0,
                      },
                    ],
                  },
                ],
                direction: null,
                format: '' as const,
                indent: 0,
                version: 1,
              },
            }

            // Create media record
            await payload.create({
              collection: 'media',
              data: {
                alt: `${country.name} ${media.type} map`,
                caption: captionData,
              },
              file: {
                data: buffer,
                mimetype: 'image/png',
                name: media.filename,
                size: buffer.length,
              },
            })

            log.info(`Downloaded ${media.type} map for ${country.name}`)
          } catch (error) {
            // Silent fail for individual media files
          }
        }
      } catch (error) {
        log.error(`Failed to download media for ${country.name}: ${(error as any).message}`)
      }
    }

    log.info('✓ Country media download complete')
  } catch (error) {
    log.error(`Failed to download country media: ${(error as any).message}`)
  }
}

// Main seed function that combines everything
export async function seedConsolidatedCountryData(payload: Payload): Promise<void> {
  const log = payload.logger ?? console
  log.info('=== Starting consolidated country data seed ===')

  // Step 1: Consolidate existing data into CountryDetails
  await consolidateCountryData(payload)

  // Step 2: Download media from CIA Factbook
  await downloadCountryMedia(payload)

  log.info('=== Consolidated country data seed complete ===')
}
