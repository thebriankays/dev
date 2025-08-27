/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Payload } from 'payload'
import fs from 'node:fs/promises'
import path from 'node:path'
import worldCountries from 'world-countries'

import type { Country, Currency, Language, Timezone } from '@/payload-types'

// ISO 639-2 (3-letter) to ISO 639-1 (2-letter) language code mapping
const ISO_639_2_TO_1: Record<string, string> = {
  'aar': 'aa', // Afar
  'abk': 'ab', // Abkhazian
  'afr': 'af', // Afrikaans
  'aka': 'ak', // Akan
  'alb': 'sq', // Albanian
  'sqi': 'sq', // Albanian (alternative)
  'amh': 'am', // Amharic
  'ara': 'ar', // Arabic
  'arg': 'an', // Aragonese
  'arm': 'hy', // Armenian
  'hye': 'hy', // Armenian (alternative)
  'asm': 'as', // Assamese
  'ava': 'av', // Avaric
  'ave': 'ae', // Avestan
  'aym': 'ay', // Aymara
  'aze': 'az', // Azerbaijani
  'bak': 'ba', // Bashkir
  'bam': 'bm', // Bambara
  'baq': 'eu', // Basque
  'eus': 'eu', // Basque (alternative)
  'bel': 'be', // Belarusian
  'ben': 'bn', // Bengali
  'bih': 'bh', // Bihari languages
  'bis': 'bi', // Bislama
  'bos': 'bs', // Bosnian
  'bre': 'br', // Breton
  'bul': 'bg', // Bulgarian
  'bur': 'my', // Burmese
  'mya': 'my', // Burmese (alternative)
  'cat': 'ca', // Catalan
  'cha': 'ch', // Chamorro
  'che': 'ce', // Chechen
  'chi': 'zh', // Chinese
  'zho': 'zh', // Chinese (alternative)
  'chu': 'cu', // Church Slavic
  'chv': 'cv', // Chuvash
  'cor': 'kw', // Cornish
  'cos': 'co', // Corsican
  'cre': 'cr', // Cree
  'cze': 'cs', // Czech
  'ces': 'cs', // Czech (alternative)
  'dan': 'da', // Danish
  'div': 'dv', // Dhivehi
  'dut': 'nl', // Dutch
  'nld': 'nl', // Dutch (alternative)
  'dzo': 'dz', // Dzongkha
  'eng': 'en', // English
  'epo': 'eo', // Esperanto
  'est': 'et', // Estonian
  'ewe': 'ee', // Ewe
  'fao': 'fo', // Faroese
  'fij': 'fj', // Fijian
  'fin': 'fi', // Finnish
  'fre': 'fr', // French
  'fra': 'fr', // French (alternative)
  'fry': 'fy', // Western Frisian
  'ful': 'ff', // Fulah
  'geo': 'ka', // Georgian
  'kat': 'ka', // Georgian (alternative)
  'ger': 'de', // German
  'deu': 'de', // German (alternative)
  'gla': 'gd', // Scottish Gaelic
  'gle': 'ga', // Irish
  'glg': 'gl', // Galician
  'glv': 'gv', // Manx
  'gre': 'el', // Greek
  'ell': 'el', // Greek (alternative)
  'grn': 'gn', // Guarani
  'guj': 'gu', // Gujarati
  'hat': 'ht', // Haitian
  'hau': 'ha', // Hausa
  'heb': 'he', // Hebrew
  'her': 'hz', // Herero
  'hin': 'hi', // Hindi
  'hmo': 'ho', // Hiri Motu
  'hrv': 'hr', // Croatian
  'hun': 'hu', // Hungarian
  'ibo': 'ig', // Igbo
  'ice': 'is', // Icelandic
  'isl': 'is', // Icelandic (alternative)
  'ido': 'io', // Ido
  'iii': 'ii', // Sichuan Yi
  'iku': 'iu', // Inuktitut
  'ile': 'ie', // Interlingue
  'ina': 'ia', // Interlingua
  'ind': 'id', // Indonesian
  'ipk': 'ik', // Inupiaq
  'ita': 'it', // Italian
  'jav': 'jv', // Javanese
  'jpn': 'ja', // Japanese
  'kal': 'kl', // Kalaallisut
  'kan': 'kn', // Kannada
  'kas': 'ks', // Kashmiri
  'kau': 'kr', // Kanuri
  'kaz': 'kk', // Kazakh
  'khm': 'km', // Central Khmer
  'kik': 'ki', // Kikuyu
  'kin': 'rw', // Kinyarwanda
  'kir': 'ky', // Kirghiz
  'kom': 'kv', // Komi
  'kon': 'kg', // Kongo
  'kor': 'ko', // Korean
  'kua': 'kj', // Kuanyama
  'kur': 'ku', // Kurdish
  'lao': 'lo', // Lao
  'lat': 'la', // Latin
  'lav': 'lv', // Latvian
  'lim': 'li', // Limburgan
  'lin': 'ln', // Lingala
  'lit': 'lt', // Lithuanian
  'ltz': 'lb', // Luxembourgish
  'lub': 'lu', // Luba-Katanga
  'lug': 'lg', // Ganda
  'mac': 'mk', // Macedonian
  'mkd': 'mk', // Macedonian (alternative)
  'mah': 'mh', // Marshallese
  'mal': 'ml', // Malayalam
  'mao': 'mi', // Maori
  'mri': 'mi', // Maori (alternative)
  'mar': 'mr', // Marathi
  'may': 'ms', // Malay
  'msa': 'ms', // Malay (alternative)
  'mlg': 'mg', // Malagasy
  'mlt': 'mt', // Maltese
  'mon': 'mn', // Mongolian
  'nau': 'na', // Nauru
  'nav': 'nv', // Navajo
  'nbl': 'nr', // South Ndebele
  'nde': 'nd', // North Ndebele
  'ndo': 'ng', // Ndonga
  'nep': 'ne', // Nepali
  'nno': 'nn', // Norwegian Nynorsk
  'nob': 'nb', // Norwegian Bokmål
  'nor': 'no', // Norwegian
  'nya': 'ny', // Nyanja
  'oci': 'oc', // Occitan
  'oji': 'oj', // Ojibwa
  'ori': 'or', // Oriya
  'orm': 'om', // Oromo
  'oss': 'os', // Ossetian
  'pan': 'pa', // Panjabi
  'per': 'fa', // Persian
  'fas': 'fa', // Persian (alternative)
  'pli': 'pi', // Pali
  'pol': 'pl', // Polish
  'por': 'pt', // Portuguese
  'pus': 'ps', // Pushto
  'que': 'qu', // Quechua
  'roh': 'rm', // Romansh
  'rum': 'ro', // Romanian
  'ron': 'ro', // Romanian (alternative)
  'run': 'rn', // Rundi
  'rus': 'ru', // Russian
  'sag': 'sg', // Sango
  'san': 'sa', // Sanskrit
  'sin': 'si', // Sinhala
  'slo': 'sk', // Slovak
  'slk': 'sk', // Slovak (alternative)
  'slv': 'sl', // Slovenian
  'sme': 'se', // Northern Sami
  'smo': 'sm', // Samoan
  'sna': 'sn', // Shona
  'snd': 'sd', // Sindhi
  'som': 'so', // Somali
  'sot': 'st', // Southern Sotho
  'spa': 'es', // Spanish
  'srd': 'sc', // Sardinian
  'srp': 'sr', // Serbian
  'ssw': 'ss', // Swati
  'sun': 'su', // Sundanese
  'swa': 'sw', // Swahili
  'swe': 'sv', // Swedish
  'tah': 'ty', // Tahitian
  'tam': 'ta', // Tamil
  'tat': 'tt', // Tatar
  'tel': 'te', // Telugu
  'tgk': 'tg', // Tajik
  'tgl': 'tl', // Tagalog
  'tha': 'th', // Thai
  'tib': 'bo', // Tibetan
  'bod': 'bo', // Tibetan (alternative)
  'tir': 'ti', // Tigrinya
  'ton': 'to', // Tonga
  'tsn': 'tn', // Tswana
  'tso': 'ts', // Tsonga
  'tuk': 'tk', // Turkmen
  'tur': 'tr', // Turkish
  'twi': 'tw', // Twi
  'uig': 'ug', // Uighur
  'ukr': 'uk', // Ukrainian
  'urd': 'ur', // Urdu
  'uzb': 'uz', // Uzbek
  'ven': 've', // Venda
  'vie': 'vi', // Vietnamese
  'vol': 'vo', // Volapük
  'wel': 'cy', // Welsh
  'cym': 'cy', // Welsh (alternative)
  'wln': 'wa', // Walloon
  'wol': 'wo', // Wolof
  'xho': 'xh', // Xhosa
  'yid': 'yi', // Yiddish
  'yor': 'yo', // Yoruba
  'zha': 'za', // Zhuang
  'zul': 'zu', // Zulu
}

/* -------------------------------------------------------------------------- */
/*  world-countries subset typing                                             */
/* -------------------------------------------------------------------------- */
interface WCountry {
  name: { common: string }
  cca2: string
  cca3: string
  ccn3?: string
  region?: string
  subregion?: string
  capital?: string[]
  tld?: string[]
  idd?: { root?: string; suffixes?: string[] }
  demonyms?: { eng?: { m?: string } }
  landlocked?: boolean
  area?: number
  population?: number
  borders?: string[]
  languages?: Record<string, string>
  currencies?: Record<string, unknown>
  timezones?: string[]
}

/* -------------------------------------------------------------------------- */
/*  side-car helpers                                                          */
/* -------------------------------------------------------------------------- */
const load = async <T extends { country: string }>(
  file: string,
  key: keyof Omit<T, 'country'>,
): Promise<Map<string, T[keyof T]>> => {
  const raw = await fs.readFile(path.join(process.cwd(), 'public', 'country-data', file), 'utf-8')
  const arr: T[] = JSON.parse(raw)
  return new Map(arr.map((r) => [r.country.toUpperCase(), r[key]]))
}

const drivingSide = await load<{ country: string; side: 'left' | 'right' }>(
  'country-by-driving-side.json',
  'side',
)
const elevation = await load<{ country: string; elevation: number }>(
  'country-by-elevation.json',
  'elevation',
)
const governmentType = await load<{ country: string; government: string }>(
  'country-by-government-type.json',
  'government',
)
const lifeExpectancy = await load<{ country: string; expectancy: number | null }>(
  'country-by-life-expectancy.json',
  'expectancy',
)
const populationJson = await load<{ country: string; population: number }>(
  'country-by-population.json',
  'population',
)
const popDensity = await load<{ country: string; density: number }>(
  'country-by-population-density.json',
  'density',
)
const surfaceArea = await load<{ country: string; area: number }>(
  'country-by-surface-area.json',
  'area',
)
const yearlyTemp = await load<{ country: string; temperature: number }>(
  'country-by-yearly-average-temperature.json',
  'temperature',
)
const tldJson = await load<{ country: string; tld: string }>('country-by-domain-tld.json', 'tld')
const nationalDish = await load<{ country: string; dish: string | null }>(
  'country-by-national-dish.json',
  'dish',
)
const majorReligion = await load<{ country: string; religion: string | null }>(
  'country-by-religion.json',
  'religion',
)

// Load comprehensive country data including timezones and languages
const countryDataPath = path.join(process.cwd(), 'public', 'country-timezones', 'country.json')
const countryDataRaw = await fs.readFile(countryDataPath, 'utf-8')
const countryData = JSON.parse(countryDataRaw) as Array<{
  code: string
  name: string
  language: string
  currency: string
  phoneCode: string
  timezones: Array<{ name: string }>
}>

// Create maps for quick lookups
const countryDataByCode = new Map<string, typeof countryData[0]>()
for (const country of countryData) {
  countryDataByCode.set(country.code, country)
}

/* -------------------------------------------------------------------------- */
type Continent =
  | 'africa'
  | 'antarctica'
  | 'asia'
  | 'europe'
  | 'north-america'
  | 'oceania-australia'
  | 'south-america'

const toContinent = (reg?: string, sub?: string): Continent => {
  switch (reg) {
    case 'Africa':
      return 'africa'
    case 'Asia':
      return 'asia'
    case 'Europe':
      return 'europe'
    case 'Oceania':
      return 'oceania-australia'
    case 'Americas':
      return sub?.includes('South') ? 'south-america' : 'north-america'
    case 'Antarctic':
    case 'Antarctica':
      return 'antarctica'
    default:
      return 'antarctica'
  }
}

/* ========================================================================== */
/*  SEEDER                                                                    */
/* ========================================================================== */
export const seedCountries = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('— Seeding countries…')
  log.info(`  Loaded comprehensive data for ${countryData.length} countries`)
  
  // First, clear all existing countries to avoid unique constraint violations
  try {
    const existingCountries = await payload.find({
      collection: 'countries',
      limit: 0, // Get all
      depth: 0,
    })
    
    if (existingCountries.totalDocs > 0) {
      log.info(`  Clearing ${existingCountries.totalDocs} existing countries...`)
      for (const country of existingCountries.docs) {
        try {
          await payload.delete({
            collection: 'countries',
            id: country.id,
            depth: 0,
          })
        } catch (e) {
          // Continue even if individual deletes fail
        }
      }
    }
  } catch (e) {
    log.warn('  Could not clear existing countries:', (e as Error).message)
  }

  /* ---- lookup documents already in DB -------------------------------- */
  const currencyDocs = (
    (await payload.find({
      collection: 'currencies',
      limit: 0, // No limit - get all currencies
    })) as any
  ).docs as Currency[]

  const languageDocs = (
    (await payload.find({
      collection: 'languages',
      limit: 0, // No limit - get all languages
    })) as any
  ).docs as Language[]

  const timezoneDocs = (
    (await payload.find({
      collection: 'timezones',
      limit: 0, // No limit - get all timezones
    })) as any
  ).docs as Timezone[]

  const currencyByCode = new Map(currencyDocs.map((c) => [c.code, c.id]))
  const languageByCode = new Map(languageDocs.map((l) => [l.code, l.id]))
  const tzBySlug = new Map(timezoneDocs.map((t) => [t.slug, t.id]))
  
  log.info(`  Found ${currencyDocs.length} currencies, ${languageDocs.length} languages, ${timezoneDocs.length} timezones`)
  log.info(`  Currency codes: ${Array.from(currencyByCode.keys()).slice(0, 5).join(', ')}...`)
  log.info(`  Language codes: ${Array.from(languageByCode.keys()).slice(0, 5).join(', ')}...`)
  log.info(`  Timezone slugs: ${Array.from(tzBySlug.keys()).slice(0, 5).join(', ')}...`)

  /* ---- seed pass ----------------------------------------------------- */
  const alpha3ToId = new Map<string, number>()
  const bordersBuf = new Map<string, string[]>()

  for (const c of worldCountries as unknown as WCountry[]) {
    const key = c.name.common.toUpperCase()
    const countryInfo = countryDataByCode.get(c.cca2)

    /* currencies */
    let currencyId =
      Object.keys(c.currencies ?? {})
        .map((code) => currencyByCode.get(code))
        .find(Boolean) ?? null
    
    // If no currency from world-countries, use the currency from our country data
    if (!currencyId && countryInfo?.currency) {
      currencyId = currencyByCode.get(countryInfo.currency) ?? null
    }

    /* languages */
    const langCodes = Object.keys(c.languages ?? {})
    
    // Convert 3-letter codes to 2-letter codes
    const convertedLangCodes: string[] = []
    for (const code of langCodes) {
      // First check if it's already a 2-letter code in our database
      if (languageByCode.has(code)) {
        convertedLangCodes.push(code)
      } else {
        // Try to convert from 3-letter to 2-letter
        const twoLetterCode = ISO_639_2_TO_1[code.toLowerCase()]
        if (twoLetterCode) {
          convertedLangCodes.push(twoLetterCode)
        } else if (c.name.common === 'United States') {
          log.warn(`  No mapping found for language code: ${code}`)
        }
      }
    }
    
    // If no languages from world-countries, use the primary language from our country data
    if (convertedLangCodes.length === 0 && countryInfo?.language) {
      convertedLangCodes.push(countryInfo.language)
    }
    
    if (convertedLangCodes.length > 0 && c.name.common === 'United States') {
      log.info(`  ${c.name.common} converted language codes: ${convertedLangCodes.join(', ')}`)
    }
    
    const languageIds = convertedLangCodes
      .map((l) => {
        const id = languageByCode.get(l)
        if (!id && c.name.common === 'United States') {
          log.warn(`    Language code '${l}' not found in database`)
        }
        return id
      })
      .filter(Boolean) as number[]

    /* time-zones */
    const tzIds: number[] = []
    let primaryTz: number | null = null
    
    // Get timezones from our comprehensive country data
    const tzNames = countryInfo?.timezones?.map(tz => tz.name) ?? []
    
    if (tzNames.length > 0 && c.name.common === 'United States') {
      log.info(`  ${c.name.common} timezone names: ${tzNames.slice(0, 3).join(', ')}...`)
    }
    
    for (const tzName of tzNames) {
      const slug = tzName.toLowerCase().replace(/[\/\s_]+/g, '-')
      const tzId = tzBySlug.get(slug)
      if (tzId) {
        tzIds.push(tzId)
        if (!primaryTz) primaryTz = tzId
      } else if (c.name.common === 'United States') {
        log.warn(`    Timezone '${tzName}' (slug: '${slug}') not found in database`)
      }
    }

    try {
      // Check if country with this code already exists
      const existingByCode = await payload.find({
        collection: 'countries',
        where: {
          code: {
            equals: c.cca2,
          },
        },
        limit: 1,
      })
      
      if (existingByCode.docs.length > 0) {
        log.warn(`  Country with code ${c.cca2} already exists, skipping ${c.name.common}`)
        continue
      }
      
      if (c.name.common === 'United States') {
        log.info(`  Creating ${c.name.common} with ${languageIds.length} languages and ${tzIds.length} timezones`)
        log.info(`    Language IDs: ${languageIds.join(', ')}`)
        log.info(`    Timezone IDs: ${tzIds.slice(0, 5).join(', ')}...`)
      }
      
      const created = await payload.create({
        collection: 'countries',
        data: {
          /* identity */
          name: c.name.common,
          code: c.cca2,
          code3: c.cca3,
          isoCode: c.ccn3 ?? null,

          continent: toContinent(c.region, c.subregion),
          region: c.region ?? null,
          subregion: c.subregion ?? null,
          capital: c.capital?.[0] ?? null,

          flag: `${c.cca2.toLowerCase()}.svg`,
          webDomain: c.tld?.[0] ?? tldJson.get(key) ?? null,

          dialingCode: c.idd?.root ? `${c.idd.root}${c.idd.suffixes?.[0] ?? ''}` : null,
          demonym: c.demonyms?.eng?.m ?? null,

          // Relations
          currencies: currencyId ? [currencyId] : [],
          languages: languageIds,
          timezones: tzIds,
        } satisfies Partial<Country>,
      })

      alpha3ToId.set(c.cca3, Number(created.id))
      if (c.borders?.length) bordersBuf.set(c.cca3, c.borders)
    } catch (e) {
      const error = e as any
      const validationErrors = error?.errors || []
      if (validationErrors.length > 0) {
        const errorMessages = validationErrors.map((err: any) => 
          `${err.field || err.path}: ${err.message}`
        ).join(', ')
        log.error(`[seed-countries] ${c.name.common}: ${errorMessages}`)
      } else if (error?.data?.errors) {
        // Payload validation errors format
        const fieldErrors = error.data.errors.map((err: any) => {
          return `${err.field}: ${err.message}`
        }).join(', ')
        log.error(`[seed-countries] ${c.name.common}: ${fieldErrors}`)
      } else {
        log.error(`[seed-countries] ${c.name.common}: ${error.message || JSON.stringify(error)}`)
      }
    }
  }

  /* ---- borders second pass ------------------------------------------ */
  for (const [cca3, codes] of bordersBuf) {
    const thisId = alpha3ToId.get(cca3)
    if (!thisId) continue
    const neighbourIds = codes.map((c3) => alpha3ToId.get(c3)).filter(Boolean) as number[]

    await payload.update({
      collection: 'countries',
      id: thisId,
      data: { neighboringCountries: neighbourIds },
    })
  }

  log.info(`✅  Seeded ${alpha3ToId.size} countries`)
}

export default seedCountries
