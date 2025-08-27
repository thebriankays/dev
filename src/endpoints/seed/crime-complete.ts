import type { Payload } from 'payload'
import type { Country } from '@/payload-types'
import fs from 'node:fs/promises'
import path from 'node:path'

interface CriminalityScore {
  rank: number | null
  country: string
  score: number
  delta: number
}

interface CriminalMarketScore {
  rank: number | null
  country: string
  average_score: number
  average_delta: number
  human_trafficking_score: number
  human_trafficking_delta: number | null
  human_smuggling_score: number
  human_smuggling_delta: number | null
  extortion_protection_score: number
  extortion_protection_delta: number | null
  arms_trafficking_score: number
  arms_trafficking_delta: number | null
  counterfeit_goods_score: number
  counterfeit_goods_delta: number | null
  illicit_excisable_goods_score: number
  illicit_excisable_goods_delta: number | null
  flora_crimes_score: number
  flora_crimes_delta: number | null
  fauna_crimes_score: number
  fauna_crimes_delta: number | null
  non_renewable_resource_crimes_score: number
  non_renewable_resource_crimes_delta: number | null
  heroin_trade_score: number
  heroin_trade_delta: number | null
  cocaine_trade_score: number
  cocaine_trade_delta: number | null
  cannabis_trade_score: number
  cannabis_trade_delta: number | null
  synthetic_drug_trade_score: number
  synthetic_drug_trade_delta: number | null
  cyber_dependent_crimes_score: number
  cyber_dependent_crimes_delta: number | null
  financial_crimes_score: number
  financial_crimes_delta: number | null
}

// Map country names from the crime data to ISO codes
const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  'MYANMAR': 'MM',
  'COLOMBIA': 'CO',
  'MEXICO': 'MX',
  'PARAGUAY': 'PY',
  'CONGO, DEM. REP': 'CD',
  'NIGERIA': 'NG',
  'SOUTH AFRICA': 'ZA',
  'IRAQ': 'IQ',
  'AFGHANISTAN': 'AF',
  'LEBANON': 'LB',
  'ECUADOR': 'EC',
  'SYRIA': 'SY',
  'HONDURAS': 'HN',
  'IRAN': 'IR',
  'TURKEY': 'TR',
  'KENYA': 'KE',
  'PANAMA': 'PA',
  'LIBYA': 'LY',
  'RUSSIA': 'RU',
  'CAMBODIA': 'KH',
  'INDONESIA': 'ID',
  'BRAZIL': 'BR',
  'CENTRAL AFRICAN REPUBLIC': 'CF',
  'VENEZUELA': 'VE',
  'PHILIPPINES': 'PH',
  'GUATEMALA': 'GT',
  'NEPAL': 'NP',
  'YEMEN': 'YE',
  'UGANDA': 'UG',
  'VIETNAM': 'VN',
  'UKRAINE': 'UA',
  'PERU': 'PE',
  'CHINA': 'CN',
  'SUDAN': 'SD',
  'UNITED ARAB EMIRATES': 'AE',
  'SOUTH SUDAN': 'SS',
  'CAMEROON': 'CM',
  'MALAYSIA': 'MY',
  'SAUDI ARABIA': 'SA',
  'ITALY': 'IT',
  'SERBIA': 'RS',
  'MOZAMBIQUE': 'MZ',
  'TANZANIA': 'TZ',
  'THAILAND': 'TH',
  'SOMALIA': 'SO',
  'LAOS': 'LA',
  'PAKISTAN': 'PK',
  'CÔTE D\'IVOIRE': 'CI',
  'GUYANA': 'GY',
  'HAITI': 'HT',
  'MALI': 'ML',
  'BURKINA FASO': 'BF',
  'EL SALVADOR': 'SV',
  'MONTENEGRO': 'ME',
  'SPAIN': 'ES',
  'BELARUS': 'BY',
  'BOSNIA AND HERZEGOVINA': 'BA',
  'FRANCE': 'FR',
  'GHANA': 'GH',
  'JAMAICA': 'JM',
  'INDIA': 'IN',
  'UNITED KINGDOM': 'GB',
  'NICARAGUA': 'NI',
  'PAPUA NEW GUINEA': 'PG',
  'NIGER': 'NE',
  'ETHIOPIA': 'ET',
  'UNITED STATES': 'US',
  'BULGARIA': 'BG',
  'MOLDOVA': 'MD',
  'ANGOLA': 'AO',
  'MADAGASCAR': 'MG',
  'COSTA RICA': 'CR',
  'KOREA, DPR': 'KP',
  'SENEGAL': 'SN',
  'CHAD': 'TD',
  'LIBERIA': 'LR',
  'ZIMBABWE': 'ZW',
  'QATAR': 'QA',
  'TAJIKISTAN': 'TJ',
  'SLOVAKIA': 'SK',
  'GREECE': 'GR',
  'GERMANY': 'DE',
  'BENIN': 'BJ',
  'TOGO': 'TG',
  'KUWAIT': 'KW',
  'TRINIDAD AND TOBAGO': 'TT',
  'CHILE': 'CL',
  'ALBANIA': 'AL',
  'CROATIA': 'HR',
  'BANGLADESH': 'BD',
  'GUINEA-BISSAU': 'GW',
  'IRELAND': 'IE',
  'EGYPT': 'EG',
  'NORTH MACEDONIA': 'MK',
  'DOMINICAN REPUBLIC': 'DO',
  'ARGENTINA': 'AR',
  'MALTA': 'MT',
  'KOSOVO': 'XK',
  'NETHERLANDS': 'NL',
  'BAHRAIN': 'BH',
  'BOLIVIA': 'BO',
  'SIERRA LEONE': 'SL',
  'UZBEKISTAN': 'UZ',
  'AUSTRIA': 'AT',
  'DENMARK': 'DK',
}

// Complete crime data seeder
export const seedCompleteCrimeData = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('=== Starting COMPLETE Crime Data seed ===')

  try {
    // Read the crime data file
    const dataPath = path.join(process.cwd(), 'public', 'crime-data.json')
    const rawData = await fs.readFile(dataPath, 'utf-8')
    const crimeData = JSON.parse(rawData)

    // Get all countries
    const countryRes = await payload.find({
      collection: 'countries',
      limit: 0,
    }) as unknown as { docs: Country[] }

    const countryByCode = new Map<string, Country>(
      countryRes.docs.map((c): [string, Country] => [c.code, c])
    )

    let scoreCreated = 0
    let scoreUpdated = 0
    let scoreSkipped = 0
    let trendCreated = 0
    let trendUpdated = 0

    // Process criminality scores
    const criminalityScores: CriminalityScore[] = crimeData.criminality_scores || []
    const marketScores: CriminalMarketScore[] = crimeData.criminal_market_scores || []

    // Create a map of market scores by country name
    const marketScoresByCountry = new Map<string, CriminalMarketScore>()
    for (const score of marketScores) {
      marketScoresByCountry.set(score.country, score)
    }

    // Process each criminality score
    for (const score of criminalityScores) {
      try {
        const isoCode = COUNTRY_NAME_TO_ISO[score.country]
        if (!isoCode) {
          log.warn(`No ISO code mapping for country: ${score.country}`)
          scoreSkipped++
          continue
        }

        const country = countryByCode.get(isoCode)
        if (!country) {
          log.warn(`Country not found for ISO code: ${isoCode} (${score.country})`)
          scoreSkipped++
          continue
        }

        // Get the market scores for this country
        const marketData = marketScoresByCountry.get(score.country)

        // Check if data already exists for this country and year (2024)
        const existing = await payload.find({
          collection: 'crime-index-scores' as any,
          where: {
            and: [
              { country: { equals: country.id } },
              { year: { equals: 2024 } },
            ],
          },
          limit: 1,
        })

        const crimeIndexData = {
          country: country.id,
          year: 2024,
          criminalityScore: score.score,
          resilienceScore: 5.0, // Default, as resilience data is not in this file
          rank: score.rank || null,
          region: 'Global', // Default region since it's not provided in this data
          criminalMarkets: marketData ? {
            humanTrafficking: marketData.human_trafficking_score || 0,
            humanSmuggling: marketData.human_smuggling_score || 0,
            extortionProtection: marketData.extortion_protection_score || 0,
            armsTrafficking: marketData.arms_trafficking_score || 0,
            counterfeiting: marketData.counterfeit_goods_score || 0,
            illicitDrugs: (marketData.heroin_trade_score + marketData.cocaine_trade_score + marketData.cannabis_trade_score + marketData.synthetic_drug_trade_score) / 4 || 0,
            environmentalCrimes: (marketData.flora_crimes_score + marketData.fauna_crimes_score + marketData.non_renewable_resource_crimes_score) / 3 || 0,
            heistRobbery: 0, // Not in this data
            financialCrimes: marketData.financial_crimes_score || 0,
            cyberCrimes: marketData.cyber_dependent_crimes_score || 0,
            privateCorruption: 0, // Not in this data
            publicCorruption: 0, // Not in this data
            heroinTrade: marketData.heroin_trade_score || 0,
            syntheticDrugTrade: marketData.synthetic_drug_trade_score || 0,
          } : {
            humanTrafficking: 0,
            humanSmuggling: 0,
            extortionProtection: 0,
            armsTrafficking: 0,
            counterfeiting: 0,
            illicitDrugs: 0,
            environmentalCrimes: 0,
            heistRobbery: 0,
            financialCrimes: 0,
            cyberCrimes: 0,
            privateCorruption: 0,
            publicCorruption: 0,
            heroinTrade: 0,
            syntheticDrugTrade: 0,
          },
          criminalActors: {
            mafiaStyle: 0,
            criminalNetworks: 0,
            stateActors: 0,
            foreignActors: 0,
            privateActors: 0,
          },
          resilience: {
            politicalLeadership: 0,
            governmentTransparency: 0,
            internationalCooperation: 0,
            nationalPolicies: 0,
            judicialSystem: 0,
            lawEnforcement: 0,
            territorialIntegrity: 0,
            antiMoneyLaundering: 0,
            economicRegulation: 0,
            victimSupport: 0,
            prevention: 0,
            nonStateActors: 0,
          },
        }

        if (existing.docs.length > 0) {
          // Update existing record
          await payload.update({
            collection: 'crime-index-scores' as any,
            id: existing.docs[0].id,
            data: crimeIndexData,
          })
          scoreUpdated++
          log.info(`Updated crime data for ${country.name}`)
        } else {
          // Create new record
          await payload.create({
            collection: 'crime-index-scores' as any,
            data: crimeIndexData,
          })
          scoreCreated++
          log.info(`Created crime data for ${country.name}`)
        }

        // Also create crime trends data if we have delta values
        if (score.delta !== 0 && marketData) {
          // Create crime trends that match the schema
          const indicators = [
            {
              indicator: 'Overall Criminality',
              category: 'markets' as const,
              previousScore: score.score - score.delta,
              currentScore: score.score,
              change: score.delta,
            },
            {
              indicator: 'Human Trafficking',
              category: 'markets' as const,
              previousScore: marketData.human_trafficking_score - (marketData.human_trafficking_delta || 0),
              currentScore: marketData.human_trafficking_score,
              change: marketData.human_trafficking_delta || 0,
            },
            {
              indicator: 'Arms Trafficking',
              category: 'markets' as const,
              previousScore: marketData.arms_trafficking_score - (marketData.arms_trafficking_delta || 0),
              currentScore: marketData.arms_trafficking_score,
              change: marketData.arms_trafficking_delta || 0,
            },
            {
              indicator: 'Drug Trade',
              category: 'markets' as const,
              previousScore: marketData.average_score - (marketData.average_delta || 0),
              currentScore: marketData.average_score,
              change: marketData.average_delta || 0,
            },
            {
              indicator: 'Financial Crimes',
              category: 'markets' as const,
              previousScore: marketData.financial_crimes_score - (marketData.financial_crimes_delta || 0),
              currentScore: marketData.financial_crimes_score,
              change: marketData.financial_crimes_delta || 0,
            },
            {
              indicator: 'Cyber Crimes',
              category: 'markets' as const,
              previousScore: marketData.cyber_dependent_crimes_score - (marketData.cyber_dependent_crimes_delta || 0),
              currentScore: marketData.cyber_dependent_crimes_score,
              change: marketData.cyber_dependent_crimes_delta || 0,
            },
          ]

          for (const indicatorData of indicators) {
            // Skip if no change
            if (indicatorData.change === 0) continue

            try {
              // Determine trend
              let trend: 'increasing' | 'decreasing' | 'stable'
              if (indicatorData.change > 0.05) {
                trend = 'increasing'
              } else if (indicatorData.change < -0.05) {
                trend = 'decreasing'
              } else {
                trend = 'stable'
              }

              // Calculate percentage change
              const changePercent = indicatorData.previousScore !== 0 
                ? ((indicatorData.currentScore - indicatorData.previousScore) / indicatorData.previousScore) * 100 
                : 0

              const trendData = {
                country: country.id,
                indicator: indicatorData.indicator,
                category: indicatorData.category,
                previousScore: Math.max(0, Math.min(10, indicatorData.previousScore)),
                currentScore: Math.max(0, Math.min(10, indicatorData.currentScore)),
                changePercent,
                trend,
                year: 2024,
              }

              // Check if trend already exists
              const existingTrend = await payload.find({
                collection: 'crime-trends' as any,
                where: {
                  and: [
                    { country: { equals: country.id } },
                    { indicator: { equals: indicatorData.indicator } },
                    { year: { equals: 2024 } },
                  ],
                },
                limit: 1,
              })

              if (existingTrend.docs.length > 0) {
                await payload.update({
                  collection: 'crime-trends' as any,
                  id: existingTrend.docs[0].id,
                  data: trendData,
                })
                trendUpdated++
              } else {
                await payload.create({
                  collection: 'crime-trends' as any,
                  data: trendData,
                })
                trendCreated++
              }
            } catch (trendError) {
              // Log specific trend creation error but continue with other trends
              log.error(`Failed to create trend for ${country.name} - ${indicatorData.indicator}: ${(trendError as any).message}`)
            }
          }
        }

      } catch (error) {
        log.error(`Failed to process crime data for ${score.country}: ${(error as any).message}`)
        scoreSkipped++
      }
    }

    log.info('=== Crime Data Complete Seed Results ===')
    log.info(`✓ Crime Index Scores: ${scoreCreated} created, ${scoreUpdated} updated, ${scoreSkipped} skipped`)
    log.info(`✓ Crime Trends: ${trendCreated} created, ${trendUpdated} updated`)

  } catch (error) {
    log.error(`Failed to load crime data from file: ${(error as any).message}`)
  }
}
