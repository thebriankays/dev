import type { Payload } from 'payload'
import type { Country } from '@/payload-types'
import axios from 'axios'
import * as cheerio from 'cheerio'

// Web scraper for Global Organized Crime Index 2023
// Source: https://ocindex.net/report/2023/

interface CountryProfile {
  countryCode: string
  countryName: string
  criminalityScore: number
  resilienceScore: number
  rank: number
  region: string
  criminalMarkets: {
    humanTrafficking: number
    humanSmuggling: number
    extortionProtection: number
    armsTrafficking: number
    tradeCounterfeitGoods: number
    illicitTradeExciseGoods: number
    floraFaunaCrimes: number
    nonRenewableResourceCrimes: number
    heroinTrade: number
    cocaineTrade: number
    cannabisTrade: number
    syntheticDrugTrade: number
    cyberDependentCrimes: number
    financialCrimes: number
  }
  criminalActors: {
    mafiaStyleGroups: number
    criminalNetworks: number
    stateEmbeddedActors: number
    foreignActors: number
    privateActors: number
  }
  resilience: {
    politicalLeadership: number
    governmentTransparency: number
    internationalCooperation: number
    nationalPolicies: number
    judicialSystem: number
    lawEnforcement: number
    territorialIntegrity: number
    antiMoneyLaundering: number
    economicRegulatory: number
    victimSupport: number
    prevention: number
    nonStateActors: number
  }
}

// Country codes mapping for the report URLs
const countryUrlMappings: Record<string, string> = {
  // Africa
  'algeria': 'DZ',
  'angola': 'AO',
  'benin': 'BJ',
  'botswana': 'BW',
  'burkina-faso': 'BF',
  'burundi': 'BI',
  'cabo-verde': 'CV',
  'cameroon': 'CM',
  'central-african-republic': 'CF',
  'chad': 'TD',
  'comoros': 'KM',
  'congo-republic': 'CG',
  'congo-democratic-republic': 'CD',
  'cote-divoire': 'CI',
  'djibouti': 'DJ',
  'egypt': 'EG',
  'equatorial-guinea': 'GQ',
  'eritrea': 'ER',
  'eswatini': 'SZ',
  'ethiopia': 'ET',
  'gabon': 'GA',
  'gambia': 'GM',
  'ghana': 'GH',
  'guinea': 'GN',
  'guinea-bissau': 'GW',
  'kenya': 'KE',
  'lesotho': 'LS',
  'liberia': 'LR',
  'libya': 'LY',
  'madagascar': 'MG',
  'malawi': 'MW',
  'mali': 'ML',
  'mauritania': 'MR',
  'mauritius': 'MU',
  'morocco': 'MA',
  'mozambique': 'MZ',
  'namibia': 'NA',
  'niger': 'NE',
  'nigeria': 'NG',
  'rwanda': 'RW',
  'sao-tome-and-principe': 'ST',
  'senegal': 'SN',
  'seychelles': 'SC',
  'sierra-leone': 'SL',
  'somalia': 'SO',
  'south-africa': 'ZA',
  'south-sudan': 'SS',
  'sudan': 'SD',
  'tanzania': 'TZ',
  'togo': 'TG',
  'tunisia': 'TN',
  'uganda': 'UG',
  'zambia': 'ZM',
  'zimbabwe': 'ZW',
  
  // Americas
  'antigua-and-barbuda': 'AG',
  'argentina': 'AR',
  'bahamas': 'BS',
  'barbados': 'BB',
  'belize': 'BZ',
  'bolivia': 'BO',
  'brazil': 'BR',
  'canada': 'CA',
  'chile': 'CL',
  'colombia': 'CO',
  'costa-rica': 'CR',
  'cuba': 'CU',
  'dominica': 'DM',
  'dominican-republic': 'DO',
  'ecuador': 'EC',
  'el-salvador': 'SV',
  'grenada': 'GD',
  'guatemala': 'GT',
  'guyana': 'GY',
  'haiti': 'HT',
  'honduras': 'HN',
  'jamaica': 'JM',
  'mexico': 'MX',
  'nicaragua': 'NI',
  'panama': 'PA',
  'paraguay': 'PY',
  'peru': 'PE',
  'st-kitts-and-nevis': 'KN',
  'st-lucia': 'LC',
  'st-vincent-and-the-grenadines': 'VC',
  'suriname': 'SR',
  'trinidad-and-tobago': 'TT',
  'united-states': 'US',
  'uruguay': 'UY',
  'venezuela': 'VE',
  
  // Asia
  'afghanistan': 'AF',
  'armenia': 'AM',
  'azerbaijan': 'AZ',
  'bahrain': 'BH',
  'bangladesh': 'BD',
  'bhutan': 'BT',
  'brunei': 'BN',
  'cambodia': 'KH',
  'china': 'CN',
  'georgia': 'GE',
  'india': 'IN',
  'indonesia': 'ID',
  'iran': 'IR',
  'iraq': 'IQ',
  'israel': 'IL',
  'japan': 'JP',
  'jordan': 'JO',
  'kazakhstan': 'KZ',
  'kuwait': 'KW',
  'kyrgyzstan': 'KG',
  'laos': 'LA',
  'lebanon': 'LB',
  'malaysia': 'MY',
  'maldives': 'MV',
  'mongolia': 'MN',
  'myanmar': 'MM',
  'nepal': 'NP',
  'north-korea': 'KP',
  'oman': 'OM',
  'pakistan': 'PK',
  'palestine': 'PS',
  'philippines': 'PH',
  'qatar': 'QA',
  'saudi-arabia': 'SA',
  'singapore': 'SG',
  'south-korea': 'KR',
  'sri-lanka': 'LK',
  'syria': 'SY',
  'taiwan': 'TW',
  'tajikistan': 'TJ',
  'thailand': 'TH',
  'timor-leste': 'TL',
  'turkey': 'TR',
  'turkmenistan': 'TM',
  'united-arab-emirates': 'AE',
  'uzbekistan': 'UZ',
  'vietnam': 'VN',
  'yemen': 'YE',
  
  // Europe
  'albania': 'AL',
  'andorra': 'AD',
  'austria': 'AT',
  'belarus': 'BY',
  'belgium': 'BE',
  'bosnia-and-herzegovina': 'BA',
  'bulgaria': 'BG',
  'croatia': 'HR',
  'cyprus': 'CY',
  'czech-republic': 'CZ',
  'denmark': 'DK',
  'estonia': 'EE',
  'finland': 'FI',
  'france': 'FR',
  'germany': 'DE',
  'greece': 'GR',
  'hungary': 'HU',
  'iceland': 'IS',
  'ireland': 'IE',
  'italy': 'IT',
  'kosovo': 'XK',
  'latvia': 'LV',
  'liechtenstein': 'LI',
  'lithuania': 'LT',
  'luxembourg': 'LU',
  'malta': 'MT',
  'moldova': 'MD',
  'monaco': 'MC',
  'montenegro': 'ME',
  'netherlands': 'NL',
  'north-macedonia': 'MK',
  'norway': 'NO',
  'poland': 'PL',
  'portugal': 'PT',
  'romania': 'RO',
  'russia': 'RU',
  'san-marino': 'SM',
  'serbia': 'RS',
  'slovakia': 'SK',
  'slovenia': 'SI',
  'spain': 'ES',
  'sweden': 'SE',
  'switzerland': 'CH',
  'ukraine': 'UA',
  'united-kingdom': 'GB',
  'vatican': 'VA',
  
  // Oceania
  'australia': 'AU',
  'fiji': 'FJ',
  'kiribati': 'KI',
  'marshall-islands': 'MH',
  'micronesia': 'FM',
  'nauru': 'NR',
  'new-zealand': 'NZ',
  'palau': 'PW',
  'papua-new-guinea': 'PG',
  'samoa': 'WS',
  'solomon-islands': 'SB',
  'tonga': 'TO',
  'tuvalu': 'TV',
  'vanuatu': 'VU',
}

// Function to extract score from text (handles "N/A" and numeric values)
function extractScore(text: string): number {
  const cleaned = text.trim()
  if (cleaned === 'N/A' || cleaned === 'n/a' || cleaned === '') {
    return 0
  }
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

// Function to determine region from URL
function getRegionFromUrl(url: string): string {
  if (url.includes('/africa/')) return 'africa'
  if (url.includes('/americas/')) return 'americas'
  if (url.includes('/asia/')) return 'asia'
  if (url.includes('/europe/')) return 'europe'
  if (url.includes('/oceania/')) return 'oceania'
  return 'unknown'
}

// Function to scrape a single country profile
async function scrapeCountryProfile(countryUrl: string, countryCode: string): Promise<CountryProfile | null> {
  try {
    const response = await axios.get(`https://ocindex.net/report/2023/${countryUrl}`)
    const $ = cheerio.load(response.data)
    
    // Extract country name from the page
    let countryName = $('h1').first().text().trim()
    if (!countryName) {
      countryName = countryUrl.split('/').pop()?.replace(/-/g, ' ').replace('.html', '') || 'Unknown'
    }
    
    // Initialize scores with defaults
    let criminalityScore = 0
    let resilienceScore = 0
    let rank = 0
    
    // Look for scores in various formats
    // Try to find criminality score
    const scoreBoxes = $('.score-box, .indicator-score, .score')
    scoreBoxes.each((i, elem) => {
      const text = $(elem).text().trim()
      const label = $(elem).prev().text().trim() || $(elem).parent().find('.label, .title').text().trim()
      
      if (label.toLowerCase().includes('criminality')) {
        const score = extractScore(text)
        if (score > 0) criminalityScore = score
      }
      if (label.toLowerCase().includes('resilience')) {
        const score = extractScore(text)
        if (score > 0) resilienceScore = score
      }
    })
    
    // Try to extract from meta tags or script tags
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html() || ''
      const crimMatch = scriptContent ? scriptContent.match(/criminality["']?\s*:\s*([\d.]+)/i) : null
      const resMatch = scriptContent ? scriptContent.match(/resilience["']?\s*:\s*([\d.]+)/i) : null
      const rankMatch = scriptContent ? scriptContent.match(/rank["']?\s*:\s*([\d]+)/i) : null
      
      if (crimMatch && crimMatch[1]) criminalityScore = parseFloat(crimMatch[1]) || criminalityScore
      if (resMatch && resMatch[1]) resilienceScore = parseFloat(resMatch[1]) || resilienceScore
      if (rankMatch && rankMatch[1]) rank = parseInt(rankMatch[1]) || rank
    })
    
    // Extract criminal markets scores
    const marketsSection = $('.criminal-markets').length ? $('.criminal-markets') : $('.markets-section')
    const criminalMarkets = {
      humanTrafficking: extractScore(marketsSection.find('.human-trafficking .score').text()),
      humanSmuggling: extractScore(marketsSection.find('.human-smuggling .score').text()),
      extortionProtection: extractScore(marketsSection.find('.extortion .score').text()),
      armsTrafficking: extractScore(marketsSection.find('.arms-trafficking .score').text()),
      tradeCounterfeitGoods: extractScore(marketsSection.find('.counterfeit .score').text()),
      illicitTradeExciseGoods: extractScore(marketsSection.find('.excise-goods .score').text()),
      floraFaunaCrimes: extractScore(marketsSection.find('.flora-fauna .score').text()),
      nonRenewableResourceCrimes: extractScore(marketsSection.find('.non-renewable .score').text()),
      heroinTrade: extractScore(marketsSection.find('.heroin .score').text()),
      cocaineTrade: extractScore(marketsSection.find('.cocaine .score').text()),
      cannabisTrade: extractScore(marketsSection.find('.cannabis .score').text()),
      syntheticDrugTrade: extractScore(marketsSection.find('.synthetic-drugs .score').text()),
      cyberDependentCrimes: extractScore(marketsSection.find('.cyber-crimes .score').text()),
      financialCrimes: extractScore(marketsSection.find('.financial-crimes .score').text()),
    }
    
    // Extract criminal actors scores
    const actorsSection = $('.criminal-actors').length ? $('.criminal-actors') : $('.actors-section')
    const criminalActors = {
      mafiaStyleGroups: extractScore(actorsSection.find('.mafia-style .score').text()),
      criminalNetworks: extractScore(actorsSection.find('.criminal-networks .score').text()),
      stateEmbeddedActors: extractScore(actorsSection.find('.state-embedded .score').text()),
      foreignActors: extractScore(actorsSection.find('.foreign-actors .score').text()),
      privateActors: extractScore(actorsSection.find('.private-sector .score').text()),
    }
    
    // Extract resilience indicators
    const resilienceSection = $('.resilience-indicators').length ? $('.resilience-indicators') : $('.resilience-section')
    const resilience = {
      politicalLeadership: extractScore(resilienceSection.find('.political-leadership .score').text()),
      governmentTransparency: extractScore(resilienceSection.find('.transparency .score').text()),
      internationalCooperation: extractScore(resilienceSection.find('.international-cooperation .score').text()),
      nationalPolicies: extractScore(resilienceSection.find('.national-policies .score').text()),
      judicialSystem: extractScore(resilienceSection.find('.judicial-system .score').text()),
      lawEnforcement: extractScore(resilienceSection.find('.law-enforcement .score').text()),
      territorialIntegrity: extractScore(resilienceSection.find('.territorial-integrity .score').text()),
      antiMoneyLaundering: extractScore(resilienceSection.find('.anti-money-laundering .score').text()),
      economicRegulatory: extractScore(resilienceSection.find('.economic-regulatory .score').text()),
      victimSupport: extractScore(resilienceSection.find('.victim-support .score').text()),
      prevention: extractScore(resilienceSection.find('.prevention .score').text()),
      nonStateActors: extractScore(resilienceSection.find('.non-state-actors .score').text()),
    }
    
    // Alternative approach: look for score tables
    if (Object.values(criminalMarkets).every(v => v === 0)) {
      // Try to find scores in tables
      $('table').each((i, table) => {
        const $table = $(table)
        $table.find('tr').each((j, row) => {
          const $row = $(row)
          const indicator = $row.find('td:first').text().toLowerCase()
          const score = extractScore($row.find('td:last').text())
          
          // Map to appropriate field
          if (indicator.includes('human trafficking')) criminalMarkets.humanTrafficking = score
          if (indicator.includes('human smuggling')) criminalMarkets.humanSmuggling = score
          if (indicator.includes('extortion')) criminalMarkets.extortionProtection = score
          if (indicator.includes('arms')) criminalMarkets.armsTrafficking = score
          if (indicator.includes('counterfeit')) criminalMarkets.tradeCounterfeitGoods = score
          if (indicator.includes('excise')) criminalMarkets.illicitTradeExciseGoods = score
          if (indicator.includes('flora')) criminalMarkets.floraFaunaCrimes = score
          if (indicator.includes('fauna')) criminalMarkets.floraFaunaCrimes = score
          if (indicator.includes('non-renewable')) criminalMarkets.nonRenewableResourceCrimes = score
          if (indicator.includes('heroin')) criminalMarkets.heroinTrade = score
          if (indicator.includes('cocaine')) criminalMarkets.cocaineTrade = score
          if (indicator.includes('cannabis')) criminalMarkets.cannabisTrade = score
          if (indicator.includes('synthetic')) criminalMarkets.syntheticDrugTrade = score
          if (indicator.includes('cyber')) criminalMarkets.cyberDependentCrimes = score
          if (indicator.includes('financial')) criminalMarkets.financialCrimes = score
          
          // Criminal actors
          if (indicator.includes('mafia')) criminalActors.mafiaStyleGroups = score
          if (indicator.includes('criminal networks')) criminalActors.criminalNetworks = score
          if (indicator.includes('state-embedded')) criminalActors.stateEmbeddedActors = score
          if (indicator.includes('foreign')) criminalActors.foreignActors = score
          if (indicator.includes('private')) criminalActors.privateActors = score
          
          // Resilience
          if (indicator.includes('political leadership')) resilience.politicalLeadership = score
          if (indicator.includes('transparency')) resilience.governmentTransparency = score
          if (indicator.includes('international cooperation')) resilience.internationalCooperation = score
          if (indicator.includes('national policies')) resilience.nationalPolicies = score
          if (indicator.includes('judicial')) resilience.judicialSystem = score
          if (indicator.includes('law enforcement')) resilience.lawEnforcement = score
          if (indicator.includes('territorial')) resilience.territorialIntegrity = score
          if (indicator.includes('money laundering')) resilience.antiMoneyLaundering = score
          if (indicator.includes('economic regulatory')) resilience.economicRegulatory = score
          if (indicator.includes('victim')) resilience.victimSupport = score
          if (indicator.includes('prevention')) resilience.prevention = score
          if (indicator.includes('non-state')) resilience.nonStateActors = score
        })
      })
    }
    
    return {
      countryCode,
      countryName: countryName || 'Unknown',
      criminalityScore,
      resilienceScore,
      rank,
      region: getRegionFromUrl(countryUrl),
      criminalMarkets,
      criminalActors,
      resilience,
    }
  } catch (error) {
    console.error(`Failed to scrape ${countryUrl}:`, (error as any).message)
    return null
  }
}

// Function to scrape all country profiles
async function scrapeAllCountries(): Promise<CountryProfile[]> {
  const profiles: CountryProfile[] = []
  
  for (const [urlSlug, countryCode] of Object.entries(countryUrlMappings)) {
    // Construct the URL based on region
    let countryUrl = ''
    
    // Determine region and construct URL
    if (['algeria', 'angola', 'benin', 'botswana', 'burkina-faso', 'burundi', 'cabo-verde', 'cameroon', 'central-african-republic', 'chad', 'comoros', 'congo-republic', 'congo-democratic-republic', 'cote-divoire', 'djibouti', 'egypt', 'equatorial-guinea', 'eritrea', 'eswatini', 'ethiopia', 'gabon', 'gambia', 'ghana', 'guinea', 'guinea-bissau', 'kenya', 'lesotho', 'liberia', 'libya', 'madagascar', 'malawi', 'mali', 'mauritania', 'mauritius', 'morocco', 'mozambique', 'namibia', 'niger', 'nigeria', 'rwanda', 'sao-tome-and-principe', 'senegal', 'seychelles', 'sierra-leone', 'somalia', 'south-africa', 'south-sudan', 'sudan', 'tanzania', 'togo', 'tunisia', 'uganda', 'zambia', 'zimbabwe'].includes(urlSlug)) {
      countryUrl = `africa/${urlSlug}.html`
    } else if (['antigua-and-barbuda', 'argentina', 'bahamas', 'barbados', 'belize', 'bolivia', 'brazil', 'canada', 'chile', 'colombia', 'costa-rica', 'cuba', 'dominica', 'dominican-republic', 'ecuador', 'el-salvador', 'grenada', 'guatemala', 'guyana', 'haiti', 'honduras', 'jamaica', 'mexico', 'nicaragua', 'panama', 'paraguay', 'peru', 'st-kitts-and-nevis', 'st-lucia', 'st-vincent-and-the-grenadines', 'suriname', 'trinidad-and-tobago', 'united-states', 'uruguay', 'venezuela'].includes(urlSlug)) {
      countryUrl = `americas/${urlSlug}.html`
    } else if (['afghanistan', 'armenia', 'azerbaijan', 'bahrain', 'bangladesh', 'bhutan', 'brunei', 'cambodia', 'china', 'georgia', 'india', 'indonesia', 'iran', 'iraq', 'israel', 'japan', 'jordan', 'kazakhstan', 'kuwait', 'kyrgyzstan', 'laos', 'lebanon', 'malaysia', 'maldives', 'mongolia', 'myanmar', 'nepal', 'north-korea', 'oman', 'pakistan', 'palestine', 'philippines', 'qatar', 'saudi-arabia', 'singapore', 'south-korea', 'sri-lanka', 'syria', 'taiwan', 'tajikistan', 'thailand', 'timor-leste', 'turkey', 'turkmenistan', 'united-arab-emirates', 'uzbekistan', 'vietnam', 'yemen'].includes(urlSlug)) {
      countryUrl = `asia/${urlSlug}.html`
    } else if (['albania', 'andorra', 'austria', 'belarus', 'belgium', 'bosnia-and-herzegovina', 'bulgaria', 'croatia', 'cyprus', 'czech-republic', 'denmark', 'estonia', 'finland', 'france', 'germany', 'greece', 'hungary', 'iceland', 'ireland', 'italy', 'kosovo', 'latvia', 'liechtenstein', 'lithuania', 'luxembourg', 'malta', 'moldova', 'monaco', 'montenegro', 'netherlands', 'north-macedonia', 'norway', 'poland', 'portugal', 'romania', 'russia', 'san-marino', 'serbia', 'slovakia', 'slovenia', 'spain', 'sweden', 'switzerland', 'ukraine', 'united-kingdom', 'vatican'].includes(urlSlug)) {
      countryUrl = `europe/${urlSlug}.html`
    } else if (['australia', 'fiji', 'kiribati', 'marshall-islands', 'micronesia', 'nauru', 'new-zealand', 'palau', 'papua-new-guinea', 'samoa', 'solomon-islands', 'tonga', 'tuvalu', 'vanuatu'].includes(urlSlug)) {
      countryUrl = `oceania/${urlSlug}.html`
    }
    
    if (countryUrl) {
      console.log(`Scraping ${countryUrl}...`)
      const profile = await scrapeCountryProfile(countryUrl, countryCode)
      if (profile) {
        profiles.push(profile)
      }
      
      // Add delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return profiles
}

// Export the seed function
export const seedCrimeIndexFromWeb = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('— Scraping crime index data from ocindex.net...')
  
  try {
    // Scrape all country profiles
    const profiles = await scrapeAllCountries()
    log.info(`Scraped ${profiles.length} country profiles`)
    
    // Get all countries from database
    const countryRes = await payload.find({
      collection: 'countries',
      limit: 0,
    }) as unknown as { docs: Country[] }
    
    const countryByCode = new Map<string, Country>(
      countryRes.docs.map((c): [string, Country] => [c.code, c])
    )
    
    let created = 0
    let updated = 0
    let skipped = 0
    
    // Seed the data
    for (const profile of profiles) {
      try {
        const country = countryByCode.get(profile.countryCode)
        if (!country) {
          log.warn(`Country not found for code: ${profile.countryCode}`)
          skipped++
          continue
        }
        
        // Check if data already exists
        const existing = await payload.find({
          collection: 'crime-index-scores' as any,
          where: {
            and: [
              { country: { equals: country.id } },
              { year: { equals: 2023 } },
            ],
          },
          limit: 1,
        })
        
        const crimeData = {
          country: country.id,
          year: 2023,
          criminalityScore: profile.criminalityScore,
          resilienceScore: profile.resilienceScore,
          rank: profile.rank,
          region: profile.region,
          criminalMarkets: profile.criminalMarkets,
          criminalActors: profile.criminalActors,
          resilience: profile.resilience,
        }
        
        if (existing.docs.length > 0) {
          await payload.update({
            collection: 'crime-index-scores' as any,
            id: existing.docs[0].id,
            data: crimeData,
          })
          updated++
        } else {
          await payload.create({
            collection: 'crime-index-scores' as any,
            data: crimeData,
          })
          created++
        }
      } catch (error) {
        log.error(`Failed to save crime data for ${profile.countryName}: ${(error as any).message}`)
        skipped++
      }
    }
    
    log.info(`✓ Crime index web scraping complete: ${created} created, ${updated} updated, ${skipped} skipped`)
    
  } catch (error) {
    log.error(`Failed to scrape crime index data: ${(error as any).message}`)
  }
}

// Export function to save scraped data to file
export async function saveCrimeDataToFile(): Promise<void> {
  console.log('Starting web scrape of crime index data...')
  const profiles = await scrapeAllCountries()
  
  const fileContent = `// Crime index data scraped from https://ocindex.net/report/2023/
// Generated on ${new Date().toISOString()}

export const crimeIndexData = ${JSON.stringify(profiles, null, 2)};
`
  
  // Save to file
  const fs = await import('fs/promises')
  const path = await import('path')
  const __dirname = path.dirname(new URL(import.meta.url).pathname)
  
  await fs.writeFile(
    path.join(__dirname, 'crime-index-data-scraped.ts'),
    fileContent
  )
  
  console.log(`✓ Saved ${profiles.length} country profiles to crime-index-data-scraped.ts`)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  saveCrimeDataToFile().catch(console.error)
}
