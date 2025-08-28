import { NextRequest, NextResponse } from 'next/server'
import { getAirlineByCode, getAirportDisplay, getAircraftImage } from '@/lib/flights/flight-service'
import { getPayload } from 'payload'
import config from '@payload-config'
import * as cheerio from 'cheerio'

// Alternative FlightAware scraper with multiple strategies
// This version tries different approaches to handle various page structures

// Cache for FlightAware data to reduce requests
const flightAwareCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Helper function to parse time strings like "2h 6m" to object
function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null
  
  const match = timeStr.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/i)
  if (!match) return null
  
  return {
    hours: parseInt(match[1] || '0'),
    minutes: parseInt(match[2] || '0')
  }
}

// Different URL patterns to try
function getFlightAwareUrls(flightCode: string): string[] {
  const code = flightCode.toUpperCase()
  
  // Try to parse airline and flight number
  const patterns = [
    /^([A-Z]{2,3})(\d+)$/,  // AA123, DAL41
    /^([A-Z]{2})(\d+)$/,    // DL41
    /^([A-Z]{3})(\d+)$/,    // AAL123
  ]
  
  let airline = ''
  let flightNum = ''
  
  for (const pattern of patterns) {
    const match = code.match(pattern)
    if (match) {
      airline = match[1]
      flightNum = match[2]
      break
    }
  }
  
  // Return multiple URL patterns to try
  const urls = [
    `https://flightaware.com/live/flight/${code}`,
  ]
  
  // If we parsed airline and number, try additional formats
  if (airline && flightNum) {
    // Map common ICAO to IATA codes
    const icaoToIata: Record<string, string> = {
      'DAL': 'DL',
      'AAL': 'AA',
      'UAL': 'UA',
      'SWA': 'WN',
      'BAW': 'BA',
      'AFR': 'AF',
      'DLH': 'LH',
    }
    
    const iataCode = icaoToIata[airline] || airline
    urls.push(`https://flightaware.com/live/flight/${iataCode}${flightNum}`)
  }
  
  return urls
}

async function scrapeFlightAware(flightCode: string): Promise<any> {
  const payload = await getPayload({ config })

  try {
    // Check database cache first
    const cached = await payload.find({
      collection: 'flight-cache',
      where: {
        and: [
          { flightCode: { equals: flightCode } },
          { cacheExpiry: { greater_than: new Date().toISOString() } },
        ],
      },
      limit: 1,
    })

    if (cached.docs.length > 0 && cached.docs[0]) {
      console.log('Returning cached FlightAware data from DB for:', flightCode)
      return (cached.docs[0] as any).rawData
    }

    // Check memory cache next
    const memoryCached = flightAwareCache.get(flightCode)
    if (memoryCached && Date.now() - memoryCached.timestamp < CACHE_DURATION) {
      console.log('Returning cached FlightAware data from memory for:', flightCode)
      return memoryCached.data
    }

    // Try multiple URL patterns
    const urls = getFlightAwareUrls(flightCode)
    console.log('\n=== ATTEMPTING TO SCRAPE FLIGHTAWARE ===')
    console.log('Flight code:', flightCode)
    console.log('URLs to try:', urls)

    // Browser-like headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    }

    let html = ''
    let successUrl = ''
    
    // Try each URL until we get a valid response
    for (const url of urls) {
      console.log(`\nTrying URL: ${url}`)
      
      try {
        const response = await fetch(url, {
          headers,
          next: { revalidate: 60 },
        })

        if (response.ok) {
          const tempHtml = await response.text()
          
          // Check if it's a valid flight page
          if (tempHtml.length > 5000 && 
              !tempHtml.includes('Page Not Found') && 
              !tempHtml.includes('404') &&
              !tempHtml.includes('cloudflare')) {
            html = tempHtml
            successUrl = url
            console.log('✓ Success with URL:', url)
            break
          } else {
            console.log('✗ Invalid response from URL:', url)
          }
        } else {
          console.log('✗ HTTP error:', response.status)
        }
      } catch (error) {
        console.log('✗ Fetch error:', error)
      }
    }
    
    if (!html) {
      console.error('Failed to fetch any valid FlightAware page')
      return null
    }

    console.log('\n=== HTML Response Length:', html.length, 'characters ===')
    console.log('First 500 chars:', html.substring(0, 500))
    
    const $ = cheerio.load(html)
    const pageTitle = $('title').text()
    console.log('\n=== Page Title:', pageTitle, '===\n')
    
    // Initialize data object
    const data: any = {
      flightCode: flightCode.toUpperCase(),
      source: 'flightaware',
      sourceUrl: successUrl,
      airline: null,
      flightNumber: null,
      departureAirport: null,
      departureAirportCode: null,
      arrivalAirport: null,
      arrivalAirportCode: null,
      departureGate: null,
      arrivalGate: null,
      status: null,
      aircraft: null,
      distance: null,
      // ... (rest of the fields)
    }

    // Strategy 1: Try standard selectors
    console.log('\n--- Strategy 1: Standard Selectors ---')
    
    // Airline and flight info
    const friendlyIdent = $('.flightPageFriendlyIdentLbl h1').text().trim()
    if (friendlyIdent) {
      data.friendlyFlightIdentifier = friendlyIdent
      const parts = friendlyIdent.match(/^(.+?)\s+(\d+)$/)
      if (parts) {
        data.airline = parts[1].trim()
        data.flightNumber = parts[2]
      }
    }
    
    // Strategy 2: Look for structured data
    console.log('\n--- Strategy 2: Structured Data ---')
    $('script[type="application/ld+json"]').each((i, script) => {
      try {
        const jsonData = JSON.parse($(script).html() || '{}')
        if (jsonData['@type'] === 'Flight') {
          console.log('Found Flight structured data!')
          if (jsonData.provider?.name) data.airline = jsonData.provider.name
          if (jsonData.flightNumber) data.flightNumber = jsonData.flightNumber
          if (jsonData.departureAirport?.name) data.departureAirport = jsonData.departureAirport.name
          if (jsonData.arrivalAirport?.name) data.arrivalAirport = jsonData.arrivalAirport.name
        }
      } catch (e) {
        // Ignore parse errors
      }
    })
    
    // Strategy 3: Meta tags
    console.log('\n--- Strategy 3: Meta Tags ---')
    const metaDescription = $('meta[name="description"]').attr('content') || ''
    const ogTitle = $('meta[property="og:title"]').attr('content') || ''
    
    if (!data.airline && (metaDescription || ogTitle)) {
      const content = metaDescription + ' ' + ogTitle
      // Look for airline patterns
      const airlineMatch = content.match(/(Delta|American|United|Southwest|JetBlue|Alaska|Spirit|Frontier|Hawaiian|British Airways|Air Canada|Lufthansa|Emirates)/i)
      if (airlineMatch) {
        data.airline = airlineMatch[1]
        console.log('Found airline in meta:', data.airline)
      }
    }
    
    // Strategy 4: Text pattern matching
    console.log('\n--- Strategy 4: Pattern Matching ---')
    const bodyText = $('body').text()
    
    // Gate patterns
    const gatePatterns = [
      /(?:departing|departed|left)\s+(?:from\s+)?(?:Terminal\s+[A-Z0-9]+\s+)?Gate\s+([A-Z0-9]+)/i,
      /Gate\s+([A-Z0-9]+)\s+(?:departure|departing)/i,
      /(?:arriving|arrived)\s+(?:at\s+)?(?:Terminal\s+[A-Z0-9]+\s+)?Gate\s+([A-Z0-9]+)/i,
      /Gate\s+([A-Z0-9]+)\s+(?:arrival|arriving)/i,
    ]
    
    for (const pattern of gatePatterns) {
      const match = bodyText.match(pattern)
      if (match) {
        if (pattern.source.includes('depart') && !data.departureGate) {
          data.departureGate = match[1]
          console.log('Found departure gate:', data.departureGate)
        } else if (pattern.source.includes('arriv') && !data.arrivalGate) {
          data.arrivalGate = match[1]
          console.log('Found arrival gate:', data.arrivalGate)
        }
      }
    }
    
    // Airport patterns
    const airportPatterns = [
      /(?:from|departing|departed)\s+([A-Z]{3,4})\s*[-–]\s*(.+?)(?:\s+to|\s+arriving|\s+\()/i,
      /(?:to|arriving|arrived)\s+([A-Z]{3,4})\s*[-–]\s*(.+?)(?:\s+from|\s+\(|$)/i,
    ]
    
    for (const pattern of airportPatterns) {
      const match = bodyText.match(pattern)
      if (match) {
        if (pattern.source.includes('from|depart') && !data.departureAirportCode) {
          data.departureAirportCode = match[1]
          data.departureAirport = match[2].trim()
          console.log('Found departure:', data.departureAirportCode, data.departureAirport)
        } else if (pattern.source.includes('to|arriv') && !data.arrivalAirportCode) {
          data.arrivalAirportCode = match[1]
          data.arrivalAirport = match[2].trim()
          console.log('Found arrival:', data.arrivalAirportCode, data.arrivalAirport)
        }
      }
    }
    
    // Status patterns
    const statusPatterns = [
      /Status:\s*([^\n]+)/i,
      /\b(En Route|Scheduled|Delayed|Cancelled|Landed|Arrived|Departed)\b/i,
    ]
    
    for (const pattern of statusPatterns) {
      const match = bodyText.match(pattern)
      if (match && !data.status) {
        data.status = match[1].trim()
        console.log('Found status:', data.status)
        break
      }
    }
    
    // Distance pattern
    const distanceMatch = bodyText.match(/(\d{1,3},?\d*)\s*(?:mi|miles)\s+(?:planned|total|distance)/i)
    if (distanceMatch && !data.distance) {
      data.distance = distanceMatch[1].replace(',', '')
      console.log('Found distance:', data.distance)
    }
    
    console.log('\n=== FINAL SCRAPED DATA ===\n', JSON.stringify(data, null, 2))
    
    // Only cache if we got some useful data
    if (data.airline || data.departureAirportCode || data.status) {
      // Save to memory cache
      flightAwareCache.set(flightCode, {
        data,
        timestamp: Date.now(),
      })
      
      // Save to database cache
      try {
        const cacheExpiry = new Date(Date.now() + 30 * 60 * 1000)
        
        const existing = await payload.find({
          collection: 'flight-cache',
          where: { flightCode: { equals: flightCode } },
          limit: 1,
        })
        
        const cacheData = {
          flightCode: data.flightCode,
          airline: data.airline,
          departureAirport: data.departureAirport,
          departureAirportCode: data.departureAirportCode,
          arrivalAirport: data.arrivalAirport,
          arrivalAirportCode: data.arrivalAirportCode,
          departureGate: data.departureGate,
          arrivalGate: data.arrivalGate,
          status: data.status,
          distance: data.distance ? parseInt(data.distance) : null,
          rawData: data,
          lastUpdated: new Date().toISOString(),
          cacheExpiry: cacheExpiry.toISOString(),
        }
        
        if (existing.docs.length > 0 && existing.docs[0]) {
          await payload.update({
            collection: 'flight-cache',
            id: existing.docs[0].id,
            data: cacheData,
          })
        } else {
          await payload.create({
            collection: 'flight-cache',
            data: cacheData,
          })
        }
      } catch (error) {
        console.error('Error saving to cache:', error)
      }
    }
    
    return data
  } catch (error) {
    console.error('Error scraping FlightAware:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const callsign = searchParams.get('callsign')
    const flightCode = searchParams.get('flightCode')

    if (!callsign && !flightCode) {
      return NextResponse.json({ error: 'Callsign or flight code required' }, { status: 400 })
    }

    const code = (callsign || flightCode || '').toUpperCase()
    const flightData = await scrapeFlightAware(code)

    if (!flightData) {
      return NextResponse.json(
        {
          error: 'Flight data not found',
          message: 'Unable to retrieve flight information from FlightAware',
        },
        { status: 404 },
      )
    }

    // Get additional data from our services
    const airline = await getAirlineByCode(flightData.airline || code)
    const payload = await getPayload({ config })

    // Format the response
    const formattedData: any = {
      flight: flightData.flightCode,
      airline: airline?.name || flightData.airline,
      airline_iata: airline?.iata,
      airline_icao: airline?.icao,
      flightNumber: flightData.flightNumber,
      departureAirport: flightData.departureAirport,
      arrivalAirport: flightData.arrivalAirport,
      departureAirportCode: flightData.departureAirportCode,
      arrivalAirportCode: flightData.arrivalAirportCode,
      departureGate: flightData.departureGate,
      arrivalGate: flightData.arrivalGate,
      status: flightData.status,
      distance: flightData.distance,
      sourceUrl: flightData.sourceUrl,
    }

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Error in FlightAware endpoint:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch flight data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
