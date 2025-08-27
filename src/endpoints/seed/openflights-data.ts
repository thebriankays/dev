import type { Payload } from 'payload'
import fs from 'fs/promises'
import { createWriteStream } from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import https from 'https'
import { findCountryInMap } from './country-name-mappings'
import type { Airport, Airline, Route, Country } from '@/payload-types'

interface OpenFlightsAirport {
  id: string
  name: string
  city: string
  country: string
  iata: string
  icao: string
  latitude: string
  longitude: string
  altitude: string
  timezone: string
  dst: string
  tz: string
  type: string
  source: string
}

interface OpenFlightsAirline {
  id: string
  name: string
  alias: string
  iata: string
  icao: string
  callsign: string
  country: string
  active: string
}

interface OpenFlightsRoute {
  airline: string
  airline_id: string
  source_airport: string
  source_airport_id: string
  destination_airport: string
  destination_airport_id: string
  codeshare: string
  stops: string
  equipment: string
}

// Helper to parse NULL values
function parseNull(value: string): string | null {
  return value === '\\N' || value === '' ? null : value
}

// Helper to parse boolean
function parseBoolean(value: string): boolean {
  return value === 'Y'
}

// Map OpenFlights airport types to our enum
const AIRPORT_TYPE_MAP: Record<string, Airport['type']> = {
  airport: 'large',
  station: 'medium',
  port: 'small',
}

// Download function for OpenFlights data
async function downloadOpenFlightsData(log: any): Promise<boolean> {
  const dataDir = path.join(process.cwd(), 'src', 'data', 'openflights')
  
  // Ensure directory exists
  await fs.mkdir(dataDir, { recursive: true })
  
  const DATA_URLS = {
    airlines: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat',
    airports: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat',
    routes: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat'
  }
  
  async function downloadFile(url: string, filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      log.info(`Downloading ${filename}...`)
      
      const filePath = path.join(dataDir, filename)
      const file = createWriteStream(filePath)
      
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: ${response.statusCode}`))
          return
        }
        
        response.pipe(file)
        
        file.on('finish', () => {
          file.close()
          log.info(`✓ Downloaded ${filename}`)
          resolve()
        })
      }).on('error', reject)
    })
  }
  
  try {
    // Download all data files
    for (const [name, url] of Object.entries(DATA_URLS)) {
      await downloadFile(url, `${name}.dat`)
    }
    
    log.info('All OpenFlights data files downloaded successfully!')
    return true
  } catch (error) {
    log.error('Error downloading OpenFlights data:', error)
    return false
  }
}

export async function seedOpenFlightsData(payload: Payload): Promise<void> {
  const log = payload.logger ?? console
  
  try {
    log.info('🌍 Starting OpenFlights data import...')
    
    // Get data directory
    const dataDir = path.join(process.cwd(), 'src', 'data', 'openflights')
    
    // Check if data files exist
    const airlinesFile = path.join(dataDir, 'airlines.dat')
    const airportsFile = path.join(dataDir, 'airports.dat')
    const routesFile = path.join(dataDir, 'routes.dat')
    
    const filesExist = await Promise.all([
      fs.access(airlinesFile).then(() => true).catch(() => false),
      fs.access(airportsFile).then(() => true).catch(() => false),
      fs.access(routesFile).then(() => true).catch(() => false),
    ])
    
    if (!filesExist.every(exists => exists)) {
      log.warn('⚠️  OpenFlights data files not found. Downloading...')
      
      // Download the data files
      const downloadSuccess = await downloadOpenFlightsData(log)
      if (!downloadSuccess) {
        log.error('Failed to download OpenFlights data')
        return
      }
      
      // Process the data files
      log.info('Processing OpenFlights data...')
      try {
        const { createLookupTables } = await import('@/data/openflights/loader')
        await createLookupTables(dataDir)
        log.info('✅ OpenFlights data processed successfully')
      } catch (error) {
        log.error('Failed to process OpenFlights data:', error)
        return
      }
    }
    
    // Load country lookup
    const countryRes = await payload.find({
      collection: 'countries',
      limit: 0,
    })
    const countryByName = new Map<string, any>(
      countryRes.docs.map((c: any) => [c.name.toLowerCase(), c])
    )
    
    // Use the centralized country finder instead of custom mappings
    
    // 1. Import Airlines
    log.info('✈️  Importing airlines...')
    const airlinesData = await fs.readFile(airlinesFile, 'utf-8')
    const airlines = parse(airlinesData, {
      delimiter: ',',
      quote: '"',
      escape: '\\',
      relax_quotes: true,
      skip_empty_lines: true,
    }) as string[][]
    
    log.info(`  Found ${airlines.length} airlines in data file`)
    
    const airlineMap = new Map<string, any>()
    let airlineCount = 0
    let skippedCount = 0
    let errorCount = 0
    
    for (const row of airlines) {
      try {
        const airline: OpenFlightsAirline = {
          id: row[0] || '',
          name: row[1] || '',
          alias: row[2] || '',
          iata: row[3] || '',
          icao: row[4] || '',
          callsign: row[5] || '',
          country: row[6] || '',
          active: row[7] || '',
        }
        
        if (!airline.name || airline.name === '\\N') {
          skippedCount++
          continue
        }
        
        const data = {
          name: airline.name,
          alias: parseNull(airline.alias),
          iata: parseNull(airline.iata),
          icao: parseNull(airline.icao),
          callsign: parseNull(airline.callsign),
          country: airline.country,
          active: parseBoolean(airline.active),
          openflights_id: parseInt(airline.id),
        }
        
        // Check if airline already exists
        const existing = await payload.find({
          collection: 'airlines',
          where: {
            openflights_id: {
              equals: data.openflights_id,
            },
          },
          limit: 1,
        })
        
        let airlineDoc
        if (existing.docs.length > 0 && existing.docs[0]) {
          // Update existing
          airlineDoc = await payload.update({
            collection: 'airlines',
            id: existing.docs[0].id,
            data,
          })
        } else {
          // Create new
          airlineDoc = await payload.create({
            collection: 'airlines',
            data,
          })
        }
        
        // Store for route mapping
        airlineMap.set(airline.id, airlineDoc)
        if (airline.iata && parseNull(airline.iata)) airlineMap.set(airline.iata, airlineDoc)
        if (airline.icao && parseNull(airline.icao)) airlineMap.set(airline.icao, airlineDoc)
        
        airlineCount++
        
        if (airlineCount % 100 === 0) {
          log.info(`  Processed ${airlineCount} airlines...`)
        }
      } catch (error) {
        errorCount++
        log.error(`Failed to import airline: ${error}`)
      }
    }
    
    log.info(`✅ Imported ${airlineCount} airlines (${skippedCount} skipped, ${errorCount} errors)`)
    
    const airportMap = new Map<string, any>()
    let airportCount = 0
    let updatedCount = 0
    let createdCount = 0
    
    // 2. Import/Update Airports
    const existingAirportCount = await payload.count({ collection: 'airports' })
    if (existingAirportCount.totalDocs > 0) {
      log.info(`🛬 Found ${existingAirportCount.totalDocs} existing airports - updating with OpenFlights IDs...`)
      
      // We need to update existing airports with OpenFlights IDs for route mapping
      const airportsData = await fs.readFile(airportsFile, 'utf-8')
      const airports = parse(airportsData, {
        delimiter: ',',
        quote: '"',
        escape: '\\',
        relax_quotes: true,
        skip_empty_lines: true,
      }) as string[][]
      
      let mappedCount = 0
      
      for (const row of airports) {
        try {
          const airport: OpenFlightsAirport = {
            id: row[0] || '',
            name: row[1] || '',
            city: row[2] || '',
            country: row[3] || '',
            iata: row[4] || '',
            icao: row[5] || '',
            latitude: row[6] || '',
            longitude: row[7] || '',
            altitude: row[8] || '',
            timezone: row[9] || '',
            dst: row[10] || '',
            tz: row[11] || '',
            type: row[12] || 'airport',
            source: row[13] || 'OurAirports',
          }
          
          if (!airport.name || airport.name === '\\N') continue
          
          const iata = parseNull(airport.iata)
          const icao = parseNull(airport.icao)
          
          if (!iata && !icao) continue
          
          // Find existing airport by IATA or ICAO
          const whereClause: any = {
            or: []
          }
          if (iata) whereClause.or.push({ iata: { equals: iata } })
          if (icao) whereClause.or.push({ icao: { equals: icao } })
          
          const existing = await payload.find({
            collection: 'airports',
            where: whereClause,
            limit: 1,
          })
          
          if (existing.docs.length > 0 && existing.docs[0]) {
            // Update with OpenFlights ID
            const airportDoc = await payload.update({
              collection: 'airports',
              id: existing.docs[0].id,
              data: {
                openflights_id: parseInt(airport.id),
              },
            })
            
            // Store in map for route creation
            airportMap.set(airport.id, airportDoc)
            if (iata) airportMap.set(iata, airportDoc)
            if (icao) airportMap.set(icao, airportDoc)
            
            mappedCount++
            
            if (mappedCount % 100 === 0) {
              log.info(`  Mapped ${mappedCount} airports...`)
            }
          }
        } catch (error) {
          // Skip errors
        }
      }
      
      log.info(`✅ Mapped ${mappedCount} airports with OpenFlights IDs`)
      
      // Also load any remaining airports that weren't in OpenFlights
      const allAirports = await payload.find({
        collection: 'airports',
        limit: 0,
      })
      
      for (const airport of allAirports.docs) {
        // Add to map if not already there
        if (airport.iata && !airportMap.has(airport.iata as string)) {
          airportMap.set(airport.iata as string, airport)
        }
        if (airport.icao && !airportMap.has(airport.icao as string)) {
          airportMap.set(airport.icao as string, airport)
        }
      }
      
      log.info(`✅ Total airports in lookup map: ${airportMap.size}`)
    } else {
      // Original airport import code
      log.info('🛬 Updating airports with OpenFlights data...')
    const airportsData = await fs.readFile(airportsFile, 'utf-8')
    const airports = parse(airportsData, {
      delimiter: ',',
      quote: '"',
      escape: '\\',
      relax_quotes: true,
      skip_empty_lines: true,
    }) as string[][]
    
    airportCount = 0
    updatedCount = 0
    createdCount = 0
    
    for (const row of airports) {
      try {
        const airport: OpenFlightsAirport = {
          id: row[0] || '',
          name: row[1] || '',
          city: row[2] || '',
          country: row[3] || '',
          iata: row[4] || '',
          icao: row[5] || '',
          latitude: row[6] || '',
          longitude: row[7] || '',
          altitude: row[8] || '',
          timezone: row[9] || '',
          dst: row[10] || '',
          tz: row[11] || '',
          type: row[12] || 'airport',
          source: row[13] || 'OurAirports',
        }
        
        if (!airport.name || airport.name === '\\N') continue
        
        const iata = parseNull(airport.iata)
        const icao = parseNull(airport.icao)
        
        // Skip if no IATA or ICAO code
        if (!iata && !icao) continue
        
        // Validate IATA code (2-3 letters)
        if (iata && !/^[A-Z]{2,3}$/.test(iata)) {
          log.warn(`Invalid IATA code for airport ${airport.name}: ${iata}`)
          continue
        }
        
        // Validate ICAO code (4 letters)
        if (icao && !/^[A-Z]{4}$/.test(icao)) {
          log.warn(`Invalid ICAO code for airport ${airport.name}: ${icao}`)
          continue
        }
        
        // Validate city name
        if (!airport.city || airport.city === '\\N' || airport.city.length < 2) {
          log.warn(`Invalid city for airport ${airport.name}`)
          continue
        }
        
        // Find country
        const country = findCountryInMap(countryByName, airport.country)
        if (!country) {
          log.warn(`Country not found for airport ${airport.name}: ${airport.country}`)
          continue
        }
        
        const data: any = {
          name: airport.name,
          iata,
          icao,
          city: airport.city,
          country: country.id,
          latitude: parseFloat(airport.latitude),
          longitude: parseFloat(airport.longitude),
          elevation: airport.altitude ? parseInt(airport.altitude) : null,
          type: AIRPORT_TYPE_MAP[airport.type] || 'medium',
          openflights_id: parseInt(airport.id), // Store OpenFlights ID for reference
        }
        
        // Check if airport exists by IATA or ICAO
        const whereClause: any = {
          or: []
        }
        if (iata) whereClause.or.push({ iata: { equals: iata } })
        if (icao) whereClause.or.push({ icao: { equals: icao } })
        
        const existing = await payload.find({
          collection: 'airports',
          where: whereClause,
          limit: 1,
        })
        
        let airportDoc
        if (existing.docs.length > 0 && existing.docs[0]) {
          // Update existing
          airportDoc = await payload.update({
            collection: 'airports',
            id: existing.docs[0].id,
            data,
          })
          updatedCount++
        } else {
          // Create new
          airportDoc = await payload.create({
            collection: 'airports',
            data,
          })
          createdCount++
        }
        
        // Store for route mapping
        airportMap.set(airport.id, airportDoc)
        if (iata && data.iata) airportMap.set(iata, airportDoc)
        if (icao && data.icao) airportMap.set(icao, airportDoc)
        
        airportCount++
        
        if (airportCount % 100 === 0) {
          log.info(`  Processed ${airportCount} airports (${createdCount} new, ${updatedCount} updated)...`)
        }
      } catch (error) {
        log.error(`Failed to process airport: ${error}`)
      }
    }
    
    log.info(`✅ Processed ${airportCount} airports (${createdCount} created, ${updatedCount} updated)`)
    }
    
    // 3. Import Routes
    log.info('🛫 Importing routes...')
    const routesData = await fs.readFile(routesFile, 'utf-8')
    const routes = parse(routesData, {
      delimiter: ',',
      quote: '"',
      escape: '\\',
      relax_quotes: true,
      skip_empty_lines: true,
    }) as string[][]
    
    log.info(`  Found ${routes.length} routes in OpenFlights data`)
    log.info(`  Airlines in map: ${airlineMap.size}`)
    log.info(`  Airports in map: ${airportMap.size}`)
    
    let routeCount = 0
    let skippedNoAirline = 0
    let skippedNoAirports = 0
    let skippedDuplicate = 0
    const ROUTE_BATCH_SIZE = 1000 // Process routes in batches
    
    for (let i = 0; i < routes.length; i += ROUTE_BATCH_SIZE) {
      const batch = routes.slice(i, i + ROUTE_BATCH_SIZE)
      
      for (const row of batch) {
        try {
          const route: OpenFlightsRoute = {
            airline: row[0] || '',
            airline_id: row[1] || '',
            source_airport: row[2] || '',
            source_airport_id: row[3] || '',
            destination_airport: row[4] || '',
            destination_airport_id: row[5] || '',
            codeshare: row[6] || '',
            stops: row[7] || '',
            equipment: row[8] || '',
          }
          
          // Find airline
          const airline = airlineMap.get(route.airline_id) || airlineMap.get(route.airline)
          if (!airline) {
            skippedNoAirline++
            continue
          }
          
          // Find airports
          const sourceAirport = airportMap.get(route.source_airport_id) || airportMap.get(route.source_airport)
          const destAirport = airportMap.get(route.destination_airport_id) || airportMap.get(route.destination_airport)
          
          if (!sourceAirport || !destAirport) {
            skippedNoAirports++
            continue
          }
          
          const equipmentArray = route.equipment
            ? route.equipment.split(' ').filter(e => e).map(aircraft => ({ aircraft }))
            : []
          
          const data = {
            airline: airline.id,
            airline_code: route.airline,
            sourceAirport: sourceAirport.id,
            source_airport_code: route.source_airport,
            destinationAirport: destAirport.id,
            destination_airport_code: route.destination_airport,
            codeshare: parseBoolean(route.codeshare),
            stops: parseInt(route.stops) || 0,
            equipment: equipmentArray,
          }
          
          // Check if route already exists
          const existing = await payload.find({
            collection: 'routes',
            where: {
              and: [
                { airline_code: { equals: data.airline_code } },
                { source_airport_code: { equals: data.source_airport_code } },
                { destination_airport_code: { equals: data.destination_airport_code } },
              ],
            },
            limit: 1,
          })
          
          if (existing.docs.length === 0) {
            await payload.create({
              collection: 'routes',
              data,
            })
            routeCount++
          } else {
            skippedDuplicate++
          }
          
        } catch (error) {
          // Routes often have data issues, just skip
        }
      }
      
      log.info(`  Processed ${Math.min(i + ROUTE_BATCH_SIZE, routes.length)} of ${routes.length} routes...`)
    }
    
    log.info(`✅ Imported ${routeCount} routes`)
    log.info(`  Skipped ${skippedNoAirline} routes (airline not found)`)
    log.info(`  Skipped ${skippedNoAirports} routes (airports not found)`)
    log.info(`  Skipped ${skippedDuplicate} routes (already exist)`)
    
    log.info('🎉 OpenFlights data import complete!')
    
  } catch (error) {
    log.error('Failed to import OpenFlights data:', (error as Error).message)
    log.error('Stack trace:', (error as Error).stack)
    throw error
  }
}

// Export for use in main seed script
export default seedOpenFlightsData
