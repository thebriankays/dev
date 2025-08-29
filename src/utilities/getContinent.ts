import continentMap from './continentMap'

/**
 * Get continent by country code
 * @param countryCode - Two-letter country code (ISO 3166-1 alpha-2)
 * @returns Continent name or 'Unknown' if not found
 */
export const getContinent = (countryCode: string): string => {
  if (!countryCode) return 'Unknown'
  
  // Convert to uppercase to ensure consistency
  const code = countryCode.toUpperCase()
  
  // Return the continent from the map, or 'Unknown' if not found
  return continentMap[code] || 'Unknown'
}

/**
 * Common country codes to continent mapping for quick reference
 * This is a subset of the full continentMap for the most common countries
 */
export const commonContinents: Record<string, string> = {
  // North America
  US: 'North America',
  CA: 'North America',
  MX: 'North America',
  
  // South America
  BR: 'South America',
  AR: 'South America',
  CL: 'South America',
  PE: 'South America',
  CO: 'South America',
  
  // Europe
  GB: 'Europe',
  FR: 'Europe',
  DE: 'Europe',
  IT: 'Europe',
  ES: 'Europe',
  NL: 'Europe',
  BE: 'Europe',
  CH: 'Europe',
  AT: 'Europe',
  SE: 'Europe',
  NO: 'Europe',
  DK: 'Europe',
  FI: 'Europe',
  PL: 'Europe',
  CZ: 'Europe',
  GR: 'Europe',
  PT: 'Europe',
  IE: 'Europe',
  
  // Asia
  CN: 'Asia',
  JP: 'Asia',
  IN: 'Asia',
  KR: 'Asia',
  TH: 'Asia',
  VN: 'Asia',
  PH: 'Asia',
  ID: 'Asia',
  MY: 'Asia',
  SG: 'Asia',
  TW: 'Asia',
  HK: 'Asia',
  AE: 'Asia',
  IL: 'Asia',
  TR: 'Asia',
  
  // Oceania
  AU: 'Oceania',
  NZ: 'Oceania',
  FJ: 'Oceania',
  
  // Africa
  EG: 'Africa',
  ZA: 'Africa',
  NG: 'Africa',
  KE: 'Africa',
  MA: 'Africa',
  ET: 'Africa',
  GH: 'Africa',
  TZ: 'Africa',
  
  // Antarctica
  AQ: 'Antarctica',
}

export default getContinent