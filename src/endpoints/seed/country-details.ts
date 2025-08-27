import type { Payload } from 'payload'
import type { Country } from '@/payload-types'
import axios from 'axios'
import { CIA_CODE_TO_ISO } from './cia-code-mapping'

// Map CIA Factbook country codes to ISO codes
// Now using the complete mapping from cia-code-mapping.ts

interface FactbookCountry {
  name: string
  introduction?: {
    background?: string
  }
  geography?: {
    location?: string
    geographic_coordinates?: {
      latitude?: { degrees?: number; minutes?: number; hemisphere?: string }
      longitude?: { degrees?: number; minutes?: number; hemisphere?: string }
    }
    area?: {
      total?: { value?: number; units?: string }
      land?: { value?: number; units?: string }
      water?: { value?: number; units?: string }
      comparative?: string
    }
    land_boundaries?: {
      total?: { value?: number; units?: string }
      border_countries?: Array<{ country?: string; border_length?: { value?: number } }>
    }
    coastline?: { value?: number; units?: string }
    climate?: string
    terrain?: string
    elevation?: {
      mean_elevation?: { value?: number; units?: string }
      highest_point?: string
      lowest_point?: string
    }
    natural_resources?: { resources?: string[] }
    natural_hazards?: { hazards?: string[] }
    environment?: {
      current_issues?: string[]
    }
  }
  people?: {
    population?: {
      total?: number
      rank?: number
    }
    ethnic_groups?: {
      ethnicity?: Array<{ name?: string; percent?: number }>
    }
    languages?: {
      language?: Array<{ name?: string; percent?: number; note?: string }>
    }
    religions?: {
      religion?: Array<{ name?: string; percent?: number }>
    }
    age_structure?: {
      '0-14_years'?: { percent?: number }
      '15-64_years'?: { percent?: number }
      '65_years_and_over'?: { percent?: number }
    }
    median_age?: {
      total?: { value?: number; units?: string }
      male?: { value?: number; units?: string }
      female?: { value?: number; units?: string }
    }
    population_growth_rate?: { growth_rate?: number }
    birth_rate?: { births_per_1000_population?: number }
    death_rate?: { deaths_per_1000_population?: number }
    net_migration_rate?: { migrants_per_1000_population?: number }
    urbanization?: {
      urban_population?: { percent_of_total?: number }
      rate_of_urbanization?: { percent_change?: number }
    }
    major_urban_areas?: {
      places?: Array<{ place?: string; population?: number; is_capital?: boolean }>
    }
    sex_ratio?: {
      at_birth?: { value?: number }
      total_population?: { value?: number }
    }
    infant_mortality_rate?: {
      total?: { value?: number; units?: string }
    }
    life_expectancy_at_birth?: {
      total_population?: { value?: number; units?: string }
      male?: { value?: number; units?: string }
      female?: { value?: number; units?: string }
    }
    literacy?: {
      total_population?: { value?: number }
      male?: { value?: number }
      female?: { value?: number }
    }
    education_expenditures?: { percent_of_gdp?: number }
  }
  government?: {
    government_type?: string
    capital?: {
      name?: string
      geographic_coordinates?: {
        latitude?: { degrees?: number; minutes?: number; hemisphere?: string }
        longitude?: { degrees?: number; minutes?: number; hemisphere?: string }
      }
      time_difference?: string
    }
    independence?: { date?: string; note?: string }
    constitution?: { history?: string; amendments?: string }
    legal_system?: string
    suffrage?: string
    executive_branch?: {
      chief_of_state?: string
      head_of_government?: string
      elections_appointments?: string
    }
    legislative_branch?: {
      description?: string
      elections?: string
    }
    judicial_branch?: {
      highest_courts?: string
      judge_selection_and_term_of_office?: string
    }
    political_parties?: Array<{ name?: string; leaders?: string[] }>
    international_organization_participation?: string[]
  }
  economy?: {
    overview?: string
    gdp?: {
      purchasing_power_parity?: {
        annual_values?: Array<{ value?: number; units?: string; date?: string }>
      }
      official_exchange_rate?: {
        annual_values?: Array<{ value?: number; units?: string; date?: string }>
      }
      per_capita_purchasing_power_parity?: {
        annual_values?: Array<{ value?: number; units?: string; date?: string }>
      }
      composition?: {
        by_sector_of_origin?: {
          agriculture?: number
          industry?: number
          services?: number
        }
      }
    }
    labor_force?: {
      total_size?: { annual_values?: Array<{ value?: number; date?: string }> }
      by_occupation?: {
        agriculture?: number
        industry?: number
        services?: number
      }
    }
    unemployment_rate?: {
      annual_values?: Array<{ value?: number; units?: string; date?: string }>
    }
    population_below_poverty_line?: { value?: number }
    gini_index?: {
      annual_values?: Array<{ value?: number; date?: string }>
    }
    budget?: {
      revenues?: { value?: number; units?: string }
      expenditures?: { value?: number; units?: string }
    }
    public_debt?: {
      annual_values?: Array<{ value?: number; units?: string; date?: string }>
    }
    inflation_rate?: {
      annual_values?: Array<{ value?: number; units?: string; date?: string }>
    }
    exports?: {
      total_value?: { annual_values?: Array<{ value?: number; units?: string; date?: string }> }
      commodities?: { by_commodity?: string[] }
      partners?: { by_country?: Array<{ name?: string; percent?: number }> }
    }
    imports?: {
      total_value?: { annual_values?: Array<{ value?: number; units?: string; date?: string }> }
      commodities?: { by_commodity?: string[] }
      partners?: { by_country?: Array<{ name?: string; percent?: number }> }
    }
  }
  communications?: {
    telephones?: {
      fixed_lines?: {
        total_subscriptions?: number
        subscriptions_per_100?: number
      }
      mobile_cellular?: {
        total_subscriptions?: number
        subscriptions_per_100?: number
      }
    }
    internet?: {
      users?: {
        total?: number
        percent_of_population?: number
      }
    }
  }
  transportation?: {
    air_transport?: {
      airports?: {
        total?: { airports?: number }
        paved?: { total?: number }
        unpaved?: { total?: number }
      }
    }
    railways?: {
      total?: { length?: number; units?: string }
    }
    roadways?: {
      total?: { value?: number; units?: string }
      paved?: { value?: number; units?: string }
      unpaved?: { value?: number; units?: string }
    }
    waterways?: { value?: number; units?: string }
    pipelines?: {
      by_type?: Array<{ type?: string; length?: number; units?: string }>
    }
    ports_and_terminals?: {
      major_seaports?: string[]
    }
  }
  military_and_security?: {
    service_branches?: string[]
    military_expenditures?: {
      annual_values?: Array<{ value?: number; units?: string; date?: string }>
    }
  }
  transnational_issues?: {
    disputes?: string[]
    refugees_and_idps?: {
      refugees?: { by_country?: Array<{ people?: number; note?: string }> }
      idps?: { people?: number }
      stateless_persons?: { people?: number }
    }
    trafficking_in_persons?: {
      current_situation?: string
      tier_rating?: string
    }
    illicit_drugs?: string
  }
}

// Helper function to convert coordinates
function parseCoordinate(coord: any): number | null {
  if (!coord || !coord.degrees) return null
  const degrees = coord.degrees || 0
  const minutes = (coord.minutes || 0) / 60
  const multiplier = coord.hemisphere === 'S' || coord.hemisphere === 'W' ? -1 : 1
  return multiplier * (degrees + minutes)
}

// Helper function to get the latest value from annual values
function getLatestValue(annualValues?: Array<{ value?: number; date?: string }>): number | null {
  if (!annualValues || annualValues.length === 0) return null
  // Sort by date descending and get the first value
  const sorted = annualValues
    .filter(v => v.value !== undefined)
    .sort((a, b) => {
      const dateA = a.date ? parseInt(a.date) : 0
      const dateB = b.date ? parseInt(b.date) : 0
      return dateB - dateA
    })
  return sorted[0]?.value ?? null
}

export { seedFactbookData as seedCountryDetails } from './factbook-data'

// Seed country media from local CIA Factbook files
export const seedCountryMedia = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('— Seeding country media from local CIA Factbook files...')

  try {
    // Get all countries
    const countryRes = await payload.find({
      collection: 'countries',
      limit: 0,
    }) as unknown as { docs: Country[] }

    let created = 0
    let skipped = 0

    // Media types available in the local CIA Factbook folders
    const mediaTypes = [
      { folder: 'maps', type: 'map-political', title: 'Political Map', extension: 'png' },
      { folder: 'locators', type: 'map-location', title: 'Location Map', extension: 'png' },
    ]

    for (const country of countryRes.docs) {
      const countryCode = country.code.toLowerCase()
      
      for (const media of mediaTypes) {
        try {
          // Check if media already exists
          const existing = await payload.find({
            collection: 'country-media' as any,
            where: {
              and: [
                { country: { equals: country.id } },
                { mediaType: { equals: media.type } },
              ],
            },
            limit: 1,
          })

          if (existing.docs.length > 0) {
            continue
          }

          // Create media record pointing to local file
          const filename = `${countryCode}.${media.extension}`
          const localPath = `/cia-factbook/${media.folder}/${filename}`
          
          await payload.create({
            collection: 'country-media' as any,
            data: {
              country: country.id,
              title: `${country.name} - ${media.title}`,
              mediaType: media.type,
              description: `${media.title} of ${country.name} from CIA World Factbook`,
              externalUrl: localPath, // Local path in public folder
              source: 'cia-factbook',
              sourceUrl: `https://github.com/factbook/media/blob/master/${media.folder}/${filename}`,
              year: new Date().getFullYear(),
              featured: media.type === 'map-political', // Feature political maps
              sortOrder: mediaTypes.indexOf(media),
            },
          })
          created++
          
        } catch (error) {
          // Skip if media doesn't exist or other error
          skipped++
        }
      }
    }

    log.info(`✓ Country media seeding complete: ${created} created, ${skipped} skipped`)
    
  } catch (error) {
    log.error(`Failed to seed country media: ${(error as any).message}`)
  }
}
