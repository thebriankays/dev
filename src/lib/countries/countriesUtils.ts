import { countriesData } from '@/endpoints/seed/location-data/countries'

export interface Country {
  label: string
  code: string
  code3?: string
  region: string
  currency?: {
    code: string
    name?: string
  }
  language?: {
    code: string
    name?: string
  }
  flag?: string
}

// Map country data to our format
const countries: Country[] = countriesData.map(country => ({
  label: country.name,
  code: country.code,
  code3: country.code3,
  region: country.continent,
  currency: {
    code: country.currencyCode,
  },
  language: country.languageCodes?.[0] ? {
    code: country.languageCodes[0],
  } : undefined,
  flag: country.code.toLowerCase(),
}))

// Map of alternative country names to official names
const COUNTRY_NAME_ALIASES: Record<string, string> = {
  'USA': 'United States',
  'US': 'United States',
  'UK': 'United Kingdom',
  'Britain': 'United Kingdom',
  'Great Britain': 'United Kingdom',
  'England': 'United Kingdom',
  'Scotland': 'United Kingdom',
  'Wales': 'United Kingdom',
  'Northern Ireland': 'United Kingdom',
  'UAE': 'United Arab Emirates',
  'HK': 'Hong Kong',
  'HKSAR': 'Hong Kong',
  'Hong Kong SAR': 'Hong Kong',
}

export const getByCountryName = (countryName: string): Country | undefined => {
  // First try exact match
  let country = countries.find((country: Country) => country.label === countryName)
  
  // If no exact match, try with alias
  if (!country && COUNTRY_NAME_ALIASES[countryName]) {
    const officialName = COUNTRY_NAME_ALIASES[countryName]
    country = countries.find((country: Country) => country.label === officialName)
  }
  
  // If still no match, try case-insensitive search
  if (!country) {
    country = countries.find(
      (country: Country) => country.label.toLowerCase() === countryName.toLowerCase(),
    )
  }
  
  return country
}

export const getByCode = (code: string): Country | undefined =>
  countries.find((country: Country) => country.code === code)

export const listCountries = (): Country[] => countries