import type { Payload } from 'payload'

// Travel Advisory country name mappings
export const TRAVEL_ADVISORY_COUNTRY_MAPPINGS: Record<string, string> = {
  // Direct mappings for problem countries from the logs
  'jordan': 'Jordan',
  'sudan': 'Sudan',
  'cuba': 'Cuba',
  'slovakia': 'Slovakia',
  'guinea-bissau': 'Guinea-Bissau',
  'cyprus': 'Cyprus',
  'eritrea': 'Eritrea',
  'morocco': 'Morocco',
  
  // Common variations
  'the gambia': 'Gambia',
  'the bahamas': 'Bahamas',
  'the netherlands': 'Netherlands',
  'the philippines': 'Philippines',
  'democratic republic of the congo': 'Congo, Democratic Republic of the',
  'republic of the congo': 'Congo',
  'south korea': 'Korea, South',
  'north korea': 'Korea, North',
  'east timor': 'Timor-Leste',
  'ivory coast': "Côte d'Ivoire",
  'cote d ivoire': "Côte d'Ivoire",
  'cape verde': 'Cabo Verde',
  'cabo verde': 'Cape Verde',
  'burma': 'Myanmar',
  'burma (myanmar)': 'Myanmar',
  'holland': 'Netherlands',
  'britain': 'United Kingdom',
  'great britain': 'United Kingdom',
  'usa': 'United States',
  'u.s.': 'United States',
  'u.s.a.': 'United States',
  'america': 'United States',
  'uk': 'United Kingdom',
  'uae': 'United Arab Emirates',
  'dprk': 'Korea, North',
  'rok': 'Korea, South',
  'china': 'China',
  'russia': 'Russia',
  'turkey': 'Turkey',
  'türkiye': 'Turkey',
  'syria': 'Syria',
  'vietnam': 'Vietnam',
  'vatican': 'Vatican City',
  'palestine': 'Palestine',
  'west bank': 'Palestine',
  'gaza': 'Palestine',
  'sao tome and principe': 'São Tomé and Príncipe',
  'kingdom of denmark': 'Denmark',
  'french west indies': 'France',
  'federated states of micronesia': 'Micronesia',
  'sint eustatius': 'Netherlands',
  'bonaire': 'Netherlands',
  'saba': 'Netherlands',
  'mainland china, hong kong & macau - see summaries': 'China',
}

// Country code to name mappings for factbook data issues
export const FACTBOOK_MISSING_COUNTRIES = [
  { code: 'US', name: 'United States', ciaCode: 'us' },
  { code: 'JO', name: 'Jordan', ciaCode: 'jo' },
  { code: 'SD', name: 'Sudan', ciaCode: 'su' },
  { code: 'CU', name: 'Cuba', ciaCode: 'cu' },
  { code: 'SK', name: 'Slovakia', ciaCode: 'lo' },
  { code: 'GW', name: 'Guinea-Bissau', ciaCode: 'pu' },
  { code: 'CY', name: 'Cyprus', ciaCode: 'cy' },
  { code: 'ER', name: 'Eritrea', ciaCode: 'er' },
  { code: 'MA', name: 'Morocco', ciaCode: 'mo' },
]

export async function checkMissingCountries(payload: Payload) {
  const log = payload.logger ?? console
  
  log.info('=== Checking for missing countries ===')
  
  // Check which countries exist
  const countryRes = await payload.find({
    collection: 'countries',
    limit: 0,
  })
  
  const existingCodes = new Set(countryRes.docs.map(c => c.code))
  const existingNames = new Set(countryRes.docs.map(c => c.name?.toLowerCase()))
  
  log.info(`Found ${countryRes.totalDocs} countries in database`)
  
  // Check for missing countries
  const missingCountries = FACTBOOK_MISSING_COUNTRIES.filter(c => !existingCodes.has(c.code))
  
  if (missingCountries.length > 0) {
    log.warn(`Missing ${missingCountries.length} countries:`)
    missingCountries.forEach(c => {
      log.warn(`  - ${c.name} (${c.code})`)
    })
  } else {
    log.info('All expected countries are present')
  }
  
  // Check travel advisory mappings
  log.info('\n=== Checking travel advisory country mappings ===')
  
  const unmappedNames: string[] = []
  for (const [variant, standard] of Object.entries(TRAVEL_ADVISORY_COUNTRY_MAPPINGS)) {
    const standardLower = standard.toLowerCase()
    if (!existingNames.has(standardLower)) {
      unmappedNames.push(`${variant} -> ${standard}`)
    }
  }
  
  if (unmappedNames.length > 0) {
    log.warn(`${unmappedNames.length} travel advisory mappings point to non-existent countries:`)
    unmappedNames.forEach(mapping => log.warn(`  - ${mapping}`))
  }
  
  // Check if country details exist for all countries
  const detailsRes = await payload.find({
    collection: 'country-details' as any,
    limit: 0,
  })
  
  log.info(`\n=== Country Details Coverage ===`)
  log.info(`Countries: ${countryRes.totalDocs}`)
  log.info(`Country Details: ${detailsRes.totalDocs}`)
  log.info(`Coverage: ${((detailsRes.totalDocs / countryRes.totalDocs) * 100).toFixed(1)}%`)
  
  if (detailsRes.totalDocs < countryRes.totalDocs) {
    // Find which countries are missing details
    const detailsCountryIds = new Set(detailsRes.docs.map(d => d.country))
    const missingDetails = countryRes.docs.filter(c => !detailsCountryIds.has(c.id))
    
    log.warn(`\n${missingDetails.length} countries missing details:`)
    missingDetails.slice(0, 10).forEach(c => {
      log.warn(`  - ${c.name} (${c.code})`)
    })
    if (missingDetails.length > 10) {
      log.warn(`  ... and ${missingDetails.length - 10} more`)
    }
  }
}
