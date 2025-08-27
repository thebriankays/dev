/**
 * Centralized country name mappings for all seeders
 * This handles various spellings, abbreviations, and alternative names
 */

export const COUNTRY_NAME_MAPPINGS: Record<string, string> = {
  // Common variations and alternative names
  'united states': 'united states',
  'united states of america': 'united states',
  'usa': 'united states',
  'us': 'united states',
  'america': 'united states',
  
  'united kingdom': 'united kingdom',
  'uk': 'united kingdom',
  'great britain': 'united kingdom',
  'britain': 'united kingdom',
  'england': 'united kingdom', // Note: England is part of UK
  
  // Countries with name changes
  'burma': 'myanmar',
  'macedonia': 'north macedonia',
  'swaziland': 'eswatini',
  'czech republic': 'czechia',
  'turkey': 'türkiye',
  
  // Congo variations
  'congo': 'republic of the congo', // Default to Republic if not specified
  'congo (brazzaville)': 'republic of the congo',
  'congo-brazzaville': 'republic of the congo',
  'republic of congo': 'republic of the congo',
  'congo (kinshasa)': 'democratic republic of the congo',
  'congo-kinshasa': 'democratic republic of the congo',
  'dr congo': 'democratic republic of the congo',
  'drc': 'democratic republic of the congo',
  'congo (democratic republic)': 'democratic republic of the congo',
  'zaire': 'democratic republic of the congo', // Historical name
  
  // Ivory Coast variations
  "cote d'ivoire": "côte d'ivoire",
  'ivory coast': "côte d'ivoire",
  "cote divoire": "côte d'ivoire",
  
  // Korea variations
  'south korea': 'south korea',
  'korea, south': 'south korea',
  'republic of korea': 'south korea',
  'rok': 'south korea',
  'north korea': 'north korea',
  'korea, north': 'north korea',
  'democratic peoples republic of korea': 'north korea',
  'dprk': 'north korea',
  
  // China variations
  'china': 'china',
  'peoples republic of china': 'china',
  'prc': 'china',
  'mainland china': 'china',
  
  // Special Administrative Regions
  'hong kong': 'hong kong',
  'hong kong sar': 'hong kong',
  'macau': 'macao',
  'macao': 'macao',
  'macao sar': 'macao',
  
  // Island territories and dependencies
  'virgin islands': 'united states virgin islands',
  'us virgin islands': 'united states virgin islands',
  'british virgin islands': 'british virgin islands',
  'netherlands antilles': 'sint maarten', // Note: dissolved, now multiple entities
  'curacao': 'curaçao',
  
  // Timor variations
  'east timor': 'timor-leste',
  'timor leste': 'timor-leste',
  
  // São Tomé variations
  'sao tome and principe': 'são tomé and príncipe',
  'sao tome & principe': 'são tomé and príncipe',
  'st. tome and principe': 'são tomé and príncipe',
  
  // Saint variations
  'st. lucia': 'saint lucia',
  'st lucia': 'saint lucia',
  'st. vincent and the grenadines': 'saint vincent and the grenadines',
  'st vincent and the grenadines': 'saint vincent and the grenadines',
  'st. kitts and nevis': 'saint kitts and nevis',
  'st kitts and nevis': 'saint kitts and nevis',
  
  // Reunion variations
  'reunion': 'réunion',
  'la reunion': 'réunion',
  
  // Other territories
  'svalbard': 'svalbard and jan mayen',
  'saint helena': 'saint helena, ascension and tristan da cunha',
  'palestine': 'palestine',
  'palestinian territories': 'palestine',
  'west bank': 'palestine',
  'west bank and gaza': 'palestine',
  
  // Atoll territories
  'johnston atoll': 'united states minor outlying islands',
  'wake island': 'united states minor outlying islands',
  'midway islands': 'united states minor outlying islands',
  
  // Russia variations
  'russia': 'russia',
  'russian federation': 'russia',
  
  // Vatican variations
  'vatican': 'vatican city',
  'vatican city state': 'vatican city',
  'holy see': 'vatican city',
  
  // Micronesia variations
  'micronesia': 'micronesia',
  'federated states of micronesia': 'micronesia',
  'fsm': 'micronesia',
  
  // Laos variations
  'laos': 'laos',
  'lao pdr': 'laos',
  "lao people's democratic republic": 'laos',
  
  // Other common variations
  'brunei': 'brunei',
  'brunei darussalam': 'brunei',
  'cape verde': 'cabo verde',
  'gambia': 'gambia',
  'the gambia': 'gambia',
  'bahamas': 'bahamas',
  'the bahamas': 'bahamas',
  'netherlands': 'netherlands',
  'the netherlands': 'netherlands',
  'holland': 'netherlands',
  'marshall islands': 'marshall islands',
  'the marshall islands': 'marshall islands',
  'solomon islands': 'solomon islands',
  'the solomon islands': 'solomon islands',
  'philippines': 'philippines',
  'the philippines': 'philippines',
  'maldives': 'maldives',
  'the maldives': 'maldives',
  'seychelles': 'seychelles',
  'the seychelles': 'seychelles',
  'comoros': 'comoros',
  'the comoros': 'comoros',
  
  // Add more mappings as needed
}

/**
 * Helper function to normalize country names
 * @param name The country name to normalize
 * @returns The normalized country name
 */
export function normalizeCountryName(name: string): string {
  if (!name) return ''
  
  // Convert to lowercase and trim
  const normalized = name.toLowerCase().trim()
  
  // Remove common prefixes
  const withoutPrefix = normalized
    .replace(/^the\s+/, '')
    .replace(/^republic\s+of\s+/, '')
    .replace(/^kingdom\s+of\s+/, '')
    .replace(/^state\s+of\s+/, '')
    .replace(/^commonwealth\s+of\s+/, '')
    .replace(/^union\s+of\s+/, '')
  
  // Check mappings
  return COUNTRY_NAME_MAPPINGS[withoutPrefix] || 
         COUNTRY_NAME_MAPPINGS[normalized] || 
         normalized
}

/**
 * Helper function to find a country in a map
 * @param countryMap Map of country names to country objects
 * @param searchName The name to search for
 * @returns The country object if found, null otherwise
 */
export function findCountryInMap<T>(
  countryMap: Map<string, T>,
  searchName: string
): T | null {
  if (!searchName) return null
  
  // Try exact match first
  const exactMatch = countryMap.get(searchName.toLowerCase())
  if (exactMatch) return exactMatch
  
  // Try normalized name
  const normalizedName = normalizeCountryName(searchName)
  const normalizedMatch = countryMap.get(normalizedName)
  if (normalizedMatch) return normalizedMatch
  
  // Try all mappings
  for (const [variant, standard] of Object.entries(COUNTRY_NAME_MAPPINGS)) {
    if (variant === searchName.toLowerCase() || standard === searchName.toLowerCase()) {
      const mapped = countryMap.get(standard)
      if (mapped) return mapped
    }
  }
  
  // Try partial matching as last resort
  const searchLower = searchName.toLowerCase()
  for (const [name, country] of countryMap.entries()) {
    if (name.includes(searchLower) || searchLower.includes(name)) {
      return country
    }
  }
  
  return null
}

/**
 * Get all possible variations of a country name
 * @param standardName The standard country name
 * @returns Array of all known variations
 */
export function getCountryNameVariations(standardName: string): string[] {
  const variations = new Set<string>()
  const normalized = normalizeCountryName(standardName)
  
  // Add the standard name
  variations.add(normalized)
  variations.add(standardName.toLowerCase())
  
  // Find all variations that map to this standard name
  for (const [variant, standard] of Object.entries(COUNTRY_NAME_MAPPINGS)) {
    if (standard === normalized) {
      variations.add(variant)
    }
  }
  
  return Array.from(variations)
}
