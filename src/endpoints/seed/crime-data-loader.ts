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

export const seedCrimeDataFromFile = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('— Loading crime data from public/crime-data.json...')

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

    let created = 0
    let updated = 0
    let skipped = 0

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
          skipped++
          continue
        }

        const country = countryByCode.get(isoCode)
        if (!country) {
          log.warn(`Country not found for ISO code: ${isoCode} (${score.country})`)
          skipped++
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
          updated++
        } else {
          // Create new record
          await payload.create({
            collection: 'crime-index-scores' as any,
            data: crimeIndexData,
          })
          created++
        }

        // Also create crime trends data if we have delta values
        if (score.delta !== 0) {
          try {
            // Create overall criminality trend
            const previousScore = score.score - score.delta
            const currentScore = score.score
            const changePercent = previousScore !== 0 ? ((currentScore - previousScore) / previousScore) * 100 : 0

            // Determine trend direction
            let trend: 'increasing' | 'decreasing' | 'stable'
            if (score.delta > 0.05) {
              trend = 'increasing'
            } else if (score.delta < -0.05) {
              trend = 'decreasing'
            } else {
              trend = 'stable'
            }

            // Check if overall criminality trend already exists
            const existingTrend = await payload.find({
              collection: 'crime-trends' as any,
              where: {
                and: [
                  { country: { equals: country.id } },
                  { indicator: { equals: 'Criminality Score' } },
                  { year: { equals: 2024 } },
                ],
              },
              limit: 1,
            })

            if (existingTrend.docs.length === 0) {
              await payload.create({
                collection: 'crime-trends' as any,
                data: {
                  country: country.id,
                  indicator: 'Criminality Score',
                  category: 'markets', // Using markets as the default category for overall score
                  previousScore: Math.max(0, Math.min(10, previousScore)),
                  currentScore: Math.max(0, Math.min(10, currentScore)),
                  changePercent,
                  trend,
                  year: 2024,
                },
              })
              log.info(`Created crime trend for ${score.country}`)
            }

            // Create individual market trends if we have market data
            if (marketData) {
              const marketIndicators = [
                { name: 'Human Trafficking', value: marketData.human_trafficking_score, delta: marketData.human_trafficking_delta },
                { name: 'Human Smuggling', value: marketData.human_smuggling_score, delta: marketData.human_smuggling_delta },
                { name: 'Extortion/Protection', value: marketData.extortion_protection_score, delta: marketData.extortion_protection_delta },
                { name: 'Arms Trafficking', value: marketData.arms_trafficking_score, delta: marketData.arms_trafficking_delta },
                { name: 'Counterfeit Goods', value: marketData.counterfeit_goods_score, delta: marketData.counterfeit_goods_delta },
                { name: 'Financial Crimes', value: marketData.financial_crimes_score, delta: marketData.financial_crimes_delta },
                { name: 'Cyber Crimes', value: marketData.cyber_dependent_crimes_score, delta: marketData.cyber_dependent_crimes_delta },
                { name: 'Heroin Trade', value: marketData.heroin_trade_score, delta: marketData.heroin_trade_delta },
                { name: 'Cocaine Trade', value: marketData.cocaine_trade_score, delta: marketData.cocaine_trade_delta },
                { name: 'Cannabis Trade', value: marketData.cannabis_trade_score, delta: marketData.cannabis_trade_delta },
                { name: 'Synthetic Drug Trade', value: marketData.synthetic_drug_trade_score, delta: marketData.synthetic_drug_trade_delta },
              ]

              for (const indicator of marketIndicators) {
                if (indicator.delta !== null && indicator.delta !== 0) {
                  const prevScore = indicator.value - indicator.delta
                  const currScore = indicator.value
                  const changePct = prevScore !== 0 ? ((currScore - prevScore) / prevScore) * 100 : 0

                  let indicatorTrend: 'increasing' | 'decreasing' | 'stable'
                  if (indicator.delta > 0.05) {
                    indicatorTrend = 'increasing'
                  } else if (indicator.delta < -0.05) {
                    indicatorTrend = 'decreasing'
                  } else {
                    indicatorTrend = 'stable'
                  }

                  // Check if this market trend already exists
                  const existingMarketTrend = await payload.find({
                    collection: 'crime-trends' as any,
                    where: {
                      and: [
                        { country: { equals: country.id } },
                        { indicator: { equals: indicator.name } },
                        { year: { equals: 2024 } },
                      ],
                    },
                    limit: 1,
                  })

                  if (existingMarketTrend.docs.length === 0) {
                    await payload.create({
                      collection: 'crime-trends' as any,
                      data: {
                        country: country.id,
                        indicator: indicator.name,
                        category: 'markets',
                        previousScore: Math.max(0, Math.min(10, prevScore)),
                        currentScore: Math.max(0, Math.min(10, currScore)),
                        changePercent: changePct,
                        trend: indicatorTrend,
                        year: 2024,
                      },
                    })
                  }
                }
              }
            }
          } catch (error) {
            log.error(`Failed to create crime trends for ${score.country}: ${(error as any).message}`)
          }
        }

      } catch (error) {
        log.error(`Failed to process crime data for ${score.country}: ${(error as any).message}`)
        skipped++
      }
    }

    log.info(`✓ Crime data loaded: ${created} created, ${updated} updated, ${skipped} skipped`)

  } catch (error) {
    log.error(`Failed to load crime data from file: ${(error as any).message}`)
  }
}
