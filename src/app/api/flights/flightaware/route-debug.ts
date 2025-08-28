import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

// Debug version of FlightAware route that returns detailed information
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const callsign = searchParams.get('callsign')
    const flightCode = searchParams.get('flightCode')
    const debug = searchParams.get('debug') === 'true'

    if (!callsign && !flightCode) {
      return NextResponse.json({ error: 'Callsign or flight code required' }, { status: 400 })
    }

    const code = (callsign || flightCode || '').toUpperCase()
    const url = `https://flightaware.com/live/flight/${code}`
    
    console.log('\n=== DEBUG: FlightAware Request ===')
    console.log('Code:', code)
    console.log('URL:', url)
    console.log('Time:', new Date().toISOString())

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

    const response = await fetch(url, {
      headers,
      next: { revalidate: 60 },
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      return NextResponse.json({
        error: 'Failed to fetch FlightAware',
        status: response.status,
        statusText: response.statusText,
      }, { status: response.status })
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    
    // Debug information
    const debugInfo = {
      code,
      url,
      responseStatus: response.status,
      htmlLength: html.length,
      title: $('title').text(),
      hasCloudflare: html.includes('cloudflare') || html.includes('cf-browser-verification'),
      is404: html.includes('404') || html.includes('Page Not Found'),
      selectors: {
        flightPageAvatar: $('.flightPageAvatar').length,
        flightPageFriendlyIdentLbl: $('.flightPageFriendlyIdentLbl').length,
        flightPageIdent: $('.flightPageIdent').length,
        flightPageSummaryStatus: $('.flightPageSummaryStatus').length,
        flightPageSummaryOrigin: $('.flightPageSummaryOrigin').length,
        flightPageSummaryDestination: $('.flightPageSummaryDestination').length,
        flightPageAirportGate: $('.flightPageAirportGate').length,
        flightPageProgressContainer: $('.flightPageProgressContainer').length,
        flightPageDataTable: $('.flightPageDataTable').length,
      },
      h1Tags: $('h1').map((i, el) => $(el).text().trim()).get(),
      metaTags: {
        description: $('meta[name="description"]').attr('content'),
        ogTitle: $('meta[property="og:title"]').attr('content'),
        ogDescription: $('meta[property="og:description"]').attr('content'),
      },
      jsonLdScripts: $('script[type="application/ld+json"]').length,
      containsFlightCode: html.includes(code),
      htmlSnippet: html.substring(0, 1000),
    }

    // Try to extract basic data
    const data: any = {
      flightCode: code,
      source: 'flightaware',
      debug: debugInfo,
    }

    // Try various extraction methods
    // Method 1: Standard selectors
    const friendlyIdent = $('.flightPageFriendlyIdentLbl h1').text().trim()
    if (friendlyIdent) {
      data.friendlyFlightIdentifier = friendlyIdent
      const parts = friendlyIdent.match(/^(.+?)\s+(\d+)$/)
      if (parts) {
        data.airline = parts[1].trim()
        data.flightNumber = parts[2]
      }
    }

    // Method 2: JSON-LD
    $('script[type="application/ld+json"]').each((i, script) => {
      try {
        const jsonData = JSON.parse($(script).html() || '{}')
        if (jsonData['@type'] === 'Flight') {
          data.jsonLdData = jsonData
        }
      } catch (e) {
        // Ignore
      }
    })

    // Method 3: Text search
    const bodyText = $('body').text()
    
    // Look for gates
    const gateMatch = bodyText.match(/Gate\s+([A-Z0-9]+)/i)
    if (gateMatch) {
      data.gateFound = gateMatch[1]
    }

    // Look for airports
    const airportMatch = bodyText.match(/([A-Z]{3,4})\s*-\s*([A-Z]{3,4})/i)
    if (airportMatch) {
      data.routeFound = `${airportMatch[1]}-${airportMatch[2]}`
    }

    // If debug mode, return all debug info
    if (debug) {
      return NextResponse.json({
        success: true,
        data,
        debug: debugInfo,
      })
    }

    // Check if we're being blocked or got invalid page
    if (debugInfo.hasCloudflare) {
      return NextResponse.json({
        error: 'Blocked by Cloudflare',
        message: 'FlightAware is blocking automated requests. Using fallback data.',
        fallback: true,
        mockData: getMockFlightData(code),
      })
    }

    if (debugInfo.is404 || debugInfo.htmlLength < 5000) {
      return NextResponse.json({
        error: 'Flight not found',
        message: 'Flight page not found or invalid. Using fallback data.',
        fallback: true,
        mockData: getMockFlightData(code),
      })
    }

    // If we have no useful data, return mock data
    if (!data.airline && !data.routeFound) {
      return NextResponse.json({
        error: 'No data extracted',
        message: 'Unable to extract flight data. Using fallback data.',
        fallback: true,
        mockData: getMockFlightData(code),
        debug: debug ? debugInfo : undefined,
      })
    }

    return NextResponse.json({
      success: true,
      data,
      debug: debug ? debugInfo : undefined,
    })

  } catch (error) {
    console.error('Error in FlightAware debug endpoint:', error)
    return NextResponse.json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallback: true,
      mockData: getMockFlightData(request.nextUrl.searchParams.get('callsign') || 'UNKNOWN'),
    }, { status: 500 })
  }
}

// Mock data generator for testing and fallback
function getMockFlightData(code: string) {
  // Parse common airline codes
  const airlineMap: Record<string, string> = {
    'DAL': 'Delta Air Lines',
    'DL': 'Delta Air Lines',
    'AAL': 'American Airlines',
    'AA': 'American Airlines',
    'UAL': 'United Airlines',
    'UA': 'United Airlines',
    'SWA': 'Southwest Airlines',
    'WN': 'Southwest Airlines',
    'BAW': 'British Airways',
    'BA': 'British Airways',
  }

  // Extract airline and flight number
  let airline = 'Unknown Airline'
  let flightNumber = ''
  
  for (const [prefix, name] of Object.entries(airlineMap)) {
    if (code.startsWith(prefix)) {
      airline = name
      flightNumber = code.substring(prefix.length)
      break
    }
  }

  // Generate realistic mock data
  const routes = [
    { dep: 'LAX', depCity: 'Los Angeles, CA', arr: 'JFK', arrCity: 'New York, NY', distance: '2475' },
    { dep: 'ORD', depCity: 'Chicago, IL', arr: 'LAX', arrCity: 'Los Angeles, CA', distance: '1745' },
    { dep: 'ATL', depCity: 'Atlanta, GA', arr: 'DFW', arrCity: 'Dallas, TX', distance: '731' },
    { dep: 'DEN', depCity: 'Denver, CO', arr: 'SEA', arrCity: 'Seattle, WA', distance: '1024' },
    { dep: 'MIA', depCity: 'Miami, FL', arr: 'BOS', arrCity: 'Boston, MA', distance: '1258' },
  ]

  const route = routes[Math.floor(Math.random() * routes.length)]
  const gates = ['A1', 'B12', 'C23', 'D45', 'E67', 'F89', 'G10', 'H22']
  const aircraft = ['Boeing 737-800', 'Airbus A320', 'Boeing 777-300ER', 'Airbus A350-900', 'Boeing 787-9']

  return {
    flight: code,
    airline,
    flightNumber,
    friendlyFlightIdentifier: `${airline} ${flightNumber}`,
    callsign: code,
    iataCode: code,
    
    departureAirport: route.depCity,
    departureAirportCode: route.dep,
    departureCity: route.depCity.split(',')[0],
    departureState: route.depCity.split(',')[1]?.trim(),
    departureGate: gates[Math.floor(Math.random() * gates.length)],
    
    arrivalAirport: route.arrCity,
    arrivalAirportCode: route.arr,
    arrivalCity: route.arrCity.split(',')[0],
    arrivalState: route.arrCity.split(',')[1]?.trim(),
    arrivalGate: gates[Math.floor(Math.random() * gates.length)],
    
    status: 'En Route',
    flightProgressStatus: 'En Route - On Time',
    flightProgressTimeRemaining: 'Arriving in 2 hours',
    
    gateDepartureTime: '10:30 AM PST',
    takeoffTime: '10:45 AM PST',
    landingTime: '4:15 PM EST',
    gateArrivalTime: '4:25 PM EST',
    
    elapsedTime: '2h 15m',
    remainingTime: '2h 0m',
    totalTravelTime: '4h 15m',
    duration: { hours: 4, minutes: 15 },
    
    flownDistance: 1237,
    remainingDistance: 1238,
    distance: route.distance,
    
    altitude: '35000',
    speed: '545',
    
    aircraft: aircraft[Math.floor(Math.random() * aircraft.length)],
    registration: `N${Math.floor(Math.random() * 900) + 100}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
    
    isMockData: true,
    mockReason: 'FlightAware data unavailable',
  }
}
