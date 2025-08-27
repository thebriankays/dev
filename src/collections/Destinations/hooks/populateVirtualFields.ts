import type { CollectionAfterReadHook } from 'payload'
import type { Destination, Country, Currency, Language } from '@/payload-types'

/**
 * Populate virtual fields from relationships for backward compatibility
 * Ensures no circular references by only copying primitive values
 */
export const populateVirtualFields: CollectionAfterReadHook<Destination> = async ({ doc }) => {
  if (!doc) return doc

  // Create a shallow copy to avoid mutating the original
  const next = { ...doc }

  // Populate countryData virtual group from relationships
  if (next.countryRelation && typeof next.countryRelation === 'object') {
    const country = next.countryRelation as Country

    // Get currency from country's currencies relationship (plural) or from destination's direct currency relationship
    let currencyData: { code: string; label: string; symbol: string } | null = null
    
    if (country.currencies && Array.isArray(country.currencies) && country.currencies.length > 0) {
      // Take the first currency from the country's currencies array
      const firstCurrency = country.currencies[0]
      if (typeof firstCurrency === 'object' && 'code' in firstCurrency) {
        currencyData = {
          code: firstCurrency.code || '',
          label: firstCurrency.name || '',
          symbol: firstCurrency.symbol || '',
        }
      }
    } else if (next.currencyRelation && typeof next.currencyRelation === 'object') {
      const currency = next.currencyRelation as Currency
      currencyData = {
        code: currency.code || '',
        label: currency.name || '',
        symbol: currency.symbol || '',
      }
    }

    // Get language from country's languages relationship or from destination's direct languages relationship
    let languageData: { code: string; label: string; nativeName: string } | null = null
    
    if (
      country.languages &&
      Array.isArray(country.languages) &&
      country.languages.length > 0 &&
      typeof country.languages[0] === 'object' &&
      'code' in country.languages[0]
    ) {
      const firstLang = country.languages[0] as Language
      languageData = {
        code: firstLang.code || '',
        label: firstLang.name || '',
        nativeName: firstLang.nativeName || '',
      }
    } else if (
      next.languagesRelation &&
      Array.isArray(next.languagesRelation) &&
      next.languagesRelation.length > 0 &&
      typeof next.languagesRelation[0] === 'object'
    ) {
      const language = next.languagesRelation[0] as Language
      languageData = {
        code: language.code || '',
        label: language.name || '',
        nativeName: language.nativeName || '',
      }
    }

    // Create countryData with only primitive values - no object references
    next.countryData = {
      label: String(country.name || ''),
      code: String(country.code || ''),
      capital: String(country.capital || ''),
      region: String(country.continent || ''),
      currency: currencyData || {
        code: '',
        label: '',
        symbol: '',
      },
      language: languageData || {
        code: '',
        label: '',
        nativeName: '',
      },
      flag: String(country.flag || ''),
    }
  }

  return next
}