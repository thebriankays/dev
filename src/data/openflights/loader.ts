// OpenFlights Data Loader
// Processes and optimizes OpenFlights data for use in the FlightTracker component

import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Airline {
  id: number
  name: string
  alias: string | null
  iata: string | null
  icao: string | null
  callsign: string | null
  country: string
  active: boolean
}

interface Airport {
  id: number
  name: string
  city: string
  country: string
  iata: string | null
  icao: string | null
  latitude: number
  longitude: number
  altitude: number
  timezone: number
  dst: string
  tz: string
  type: string
  source: string
}

interface Route {
  airline: string
  airlineId: number
  sourceAirport: string
  sourceAirportId: number
  destinationAirport: string
  destinationAirportId: number
  codeshare: boolean
  stops: number
  equipment: string[]
}

// Parse NULL values
function parseNull(value: string): string | null {
  return value === '\\N' ? null : value
}

// Load airlines data
export async function loadAirlines(filePath: string): Promise<Map<string, Airline>> {
  const airlines = new Map<string, Airline>()
  const callsignMap = new Map<string, Airline>()
  
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
    const parser = stream.pipe(parse({
      delimiter: ',',
      quote: '"',
      escape: '\\',
      relax_quotes: true,
      skip_empty_lines: true
    }))
    
    parser.on('data', (row) => {
      const airline: Airline = {
        id: parseInt(row[0]),
        name: row[1],
        alias: parseNull(row[2]),
        iata: parseNull(row[3]),
        icao: parseNull(row[4]),
        callsign: parseNull(row[5]),
        country: row[6],
        active: row[7] === 'Y'
      }
      
      // Index by IATA code
      if (airline.iata) {
        airlines.set(airline.iata, airline)
      }
      
      // Index by ICAO code
      if (airline.icao) {
        airlines.set(airline.icao, airline)
      }
      
      // Index by callsign (uppercase for matching)
      if (airline.callsign) {
        callsignMap.set(airline.callsign.toUpperCase(), airline)
      }
    })
    
    parser.on('end', () => {
      console.log(`Loaded ${airlines.size} airlines`)
      // Merge callsign map into airlines map
      callsignMap.forEach((airline, callsign) => {
        airlines.set(callsign, airline)
      })
      resolve(airlines)
    })
    
    parser.on('error', reject)
  })
}

// Load airports data
export async function loadAirports(filePath: string): Promise<Map<string, Airport>> {
  const airports = new Map<string, Airport>()
  
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
    const parser = stream.pipe(parse({
      delimiter: ',',
      quote: '"',
      escape: '\\',
      relax_quotes: true,
      skip_empty_lines: true
    }))
    
    parser.on('data', (row) => {
      const airport: Airport = {
        id: parseInt(row[0]),
        name: row[1],
        city: row[2],
        country: row[3],
        iata: parseNull(row[4]),
        icao: parseNull(row[5]),
        latitude: parseFloat(row[6]),
        longitude: parseFloat(row[7]),
        altitude: parseInt(row[8]),
        timezone: parseFloat(row[9]),
        dst: row[10],
        tz: row[11],
        type: row[12] || 'airport',
        source: row[13] || 'Unknown'
      }
      
      // Index by IATA code
      if (airport.iata) {
        airports.set(airport.iata, airport)
      }
      
      // Index by ICAO code
      if (airport.icao) {
        airports.set(airport.icao, airport)
      }
    })
    
    parser.on('end', () => {
      console.log(`Loaded ${airports.size} airports`)
      resolve(airports)
    })
    
    parser.on('error', reject)
  })
}

// Load routes data
export async function loadRoutes(filePath: string): Promise<Route[]> {
  const routes: Route[] = []
  
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
    const parser = stream.pipe(parse({
      delimiter: ',',
      quote: '"',
      escape: '\\',
      relax_quotes: true,
      skip_empty_lines: true
    }))
    
    parser.on('data', (row) => {
      const route: Route = {
        airline: row[0],
        airlineId: parseInt(row[1]) || 0,
        sourceAirport: row[2],
        sourceAirportId: parseInt(row[3]) || 0,
        destinationAirport: row[4],
        destinationAirportId: parseInt(row[5]) || 0,
        codeshare: row[6] === 'Y',
        stops: parseInt(row[7]) || 0,
        equipment: row[8] ? row[8].split(' ') : []
      }
      
      routes.push(route)
    })
    
    parser.on('end', () => {
      console.log(`Loaded ${routes.length} routes`)
      resolve(routes)
    })
    
    parser.on('error', reject)
  })
}

// Create optimized lookup tables
export async function createLookupTables(dataDir: string) {
  try {
    console.log('Loading OpenFlights data...')
    
    // Load all data
    const airlines = await loadAirlines(path.join(dataDir, 'airlines.dat'))
    const airports = await loadAirports(path.join(dataDir, 'airports.dat'))
    const routes = await loadRoutes(path.join(dataDir, 'routes.dat'))
    
    // Create route lookup by airport
    const routesByAirport = new Map<string, Set<string>>()
    routes.forEach(route => {
      if (!routesByAirport.has(route.sourceAirport)) {
        routesByAirport.set(route.sourceAirport, new Set())
      }
      routesByAirport.get(route.sourceAirport)!.add(route.destinationAirport)
    })
    
    // Create optimized data structure
    const lookupData = {
      airlines: Object.fromEntries(airlines),
      airports: Object.fromEntries(airports),
      routesByAirport: Object.fromEntries(
        Array.from(routesByAirport.entries()).map(([key, value]) => [key, Array.from(value)])
      ),
      metadata: {
        generated: new Date().toISOString(),
        airlineCount: airlines.size,
        airportCount: airports.size,
        routeCount: routes.length
      }
    }
    
    // Save as JSON for fast loading
    const outputPath = path.join(dataDir, 'openflights-lookup.json')
    fs.writeFileSync(outputPath, JSON.stringify(lookupData, null, 2))
    
    console.log(`Created lookup tables at ${outputPath}`)
    console.log('Metadata:', lookupData.metadata)
    
    // Also create a smaller runtime version with just essential data
    const runtimeData = {
      airlines: Object.fromEntries(
        Array.from(airlines.entries()).map(([key, airline]) => [
          key,
          {
            name: airline.name,
            iata: airline.iata,
            icao: airline.icao,
            callsign: airline.callsign,
            country: airline.country
          }
        ])
      ),
      airports: Object.fromEntries(
        Array.from(airports.entries()).map(([key, airport]) => [
          key,
          {
            name: airport.name,
            city: airport.city,
            country: airport.country,
            iata: airport.iata,
            icao: airport.icao,
            lat: airport.latitude,
            lng: airport.longitude,
            tz: airport.tz
          }
        ])
      )
    }
    
    const runtimePath = path.join(dataDir, 'openflights-runtime.json')
    fs.writeFileSync(runtimePath, JSON.stringify(runtimeData))
    
    console.log(`Created runtime data at ${runtimePath}`)
    
  } catch (error) {
    console.error('Error processing OpenFlights data:', error)
    throw error
  }
}

// CLI interface
if (process.argv[1] === __filename) {
  const dataDir = process.argv[2] || __dirname
  
  createLookupTables(dataDir)
    .then(() => {
      console.log('OpenFlights data processing complete!')
    })
    .catch(error => {
      console.error('Failed to process data:', error)
      process.exit(1)
    })
}