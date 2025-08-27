import type { Payload } from 'payload'
import { languagesData } from './location-data/languages'

// Fix language codes that don't match ISO standards
const LANGUAGE_CODE_FIXES: Record<string, string> = {
  'ven': 've',      // Venetian
  'vec': 've',      // Alternative Venetian code
  'scn': 'sc',      // Sicilian
  'nap': 'na',      // Neapolitan
  'lmo': 'lm',      // Lombard
  'lij': 'lj',      // Ligurian
  'eml': 'em',      // Emilian-Romagnol
  'rgn': 'rg',      // Romagnol
  'fur': 'fu',      // Friulian
  'lld': 'll',      // Ladin
  'srd': 'sr',      // Sardinian
  'pms': 'pm',      // Piedmontese
  'zh-CN': 'zh',    // Chinese simplified to base code
  'zh-TW': 'zh',    // Chinese traditional to base code
  'no-NO': 'no',    // Norwegian
  'sv-SE': 'sv',    // Swedish
  'da-DK': 'da',    // Danish
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
  if (match) {
    return match[1]
  }
  
  // Default to first 2 chars
  return code.substring(0, 2).toLowerCase()
}

export const seedLanguages = async (payload: Payload): Promise<void> => {
  const { totalDocs: existing } = await payload.count({
    collection: 'languages',
  })

  if (existing > 0) {
    payload.logger.info(`— Skipping languages seed, ${existing} already exist`)
    return
  }

  payload.logger.info('— Seeding languages...')
  
  const processedCodes = new Set<string>()
  let created = 0
  let skipped = 0

  for (const language of languagesData) {
    try {
      // Fix the language code if needed
      const validCode = getValidLanguageCode(language.code)
      
      // Skip if we've already processed this code
      if (processedCodes.has(validCode)) {
        payload.logger.info(`Skipping duplicate language code: ${validCode} (${language.name})`)
        skipped++
        continue
      }
      
      processedCodes.add(validCode)
      
      await payload.create({
        collection: 'languages',
        data: {
          ...language,
          code: validCode,
        },
      })
      created++
    } catch (error) {
      payload.logger.error(`Error creating language ${language.name}: ${error instanceof Error ? error.message : String(error)}`)
      skipped++
    }
  }

  payload.logger.info(`✓ Seeded ${created} languages (${skipped} skipped)`)
}
