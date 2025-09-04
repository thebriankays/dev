import { NextRequest, NextResponse } from 'next/server'
import { getAirlineByCode, getAirportDisplay, getAircraftImage } from '@/lib/flights/flight-service'
import { getPayload } from 'payload'
import config from '@payload-config'
import * as cheerio from 'cheerio'

// FlightAware scraper for flight details
// Now extracts data from embedded JSON instead of HTML scraping

// Cache for FlightAware data to reduce requests
const flightAwareCache = new Map<string, { data: Record<string, unknown>; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Helper function to parse time strings like "2h 6m" to object
// Currently unused but kept for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null
  
  const match = timeStr.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/i)
  if (!match) return null
  
  return {
    hours: parseInt(match[1] || '0'),
    minutes: parseInt(match[2] || '0')
  }
}

// Helper function to extract text from cheerio element safely
// Currently unused but kept for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractText($: cheerio.CheerioAPI, selector: string): string | null {
  const element = $(selector).first()
  return element.length > 0 ? element.text().trim() : null
}

interface FlightAwareData {
  flightCode?: string
  airline?: string
  airline_iata?: string
  airline_icao?: string
  aircraft?: string
  registration?: string
  departureAirport?: string
  destinationAirport?: string
  departureTime?: string
  arrivalTime?: string
  scheduled_departure?: string
  scheduled_arrival?: string
  departureGate?: string
  arrivalGate?: string
  departureTerminal?: string
  arrivalTerminal?: string
  status?: string
  statusCode?: string
  distance?: number
  duration?: { hours: number; minutes: number }
  baggage?: string
  aircraft_image?: string
  route?: string
  [key: string]: unknown
}

async function scrapeFlightAware(flightCode: string): Promise<FlightAwareData> {
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
      const doc = cached.docs[0] as unknown as { rawData: FlightAwareData }
      return doc.rawData
    }

    // Check memory cache next
    const memoryCached = flightAwareCache.get(flightCode)
    if (memoryCached && Date.now() - memoryCached.timestamp < CACHE_DURATION) {
      console.log('Returning cached FlightAware data from memory for:', flightCode)
      return memoryCached.data as FlightAwareData
    }

    // FlightAware URL format - we need to get the exact flight, not just search
    // Try multiple URL formats as FlightAware might use different patterns
    const searchUrl = `https://flightaware.com/live/flight/${flightCode.toUpperCase()}`
    
    console.log('\n=== ATTEMPTING TO SCRAPE FLIGHTAWARE ===')
    console.log('Flight code:', flightCode)
    console.log('URL:', searchUrl)

    // Add a User-Agent that mimics a real browser
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    }

    // Fetch the page
    const response = await fetch(searchUrl, {
      headers,
      next: { revalidate: 60 }, // Cache for 1 minute
    })

    if (!response.ok) {
      console.error('FlightAware response not OK:', response.status, response.statusText)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      // Return mock data for testing
      if (response.status === 403 || response.status === 429) {
        console.log('Returning mock data due to rate limiting or blocking')
        return getMockFlightData(flightCode)
      }
      return getMockFlightData(flightCode)
    }

    const html = await response.text()
    console.log('\n=== HTML Response Length:', html.length, 'characters ===')
    console.log('First 500 chars of HTML:', html.substring(0, 500))
    
    // Check if we got a valid response
    if (html.includes('Page Not Found') || html.includes('404') || html.length < 1000) {
      console.error('\n!!! Possible 404 or invalid page detected !!!')
      console.log('HTML snippet:', html.substring(0, 1000))
    }
    
    const $ = cheerio.load(html)
    console.log('\n=== Page Title:', $('title').text(), '===\n')
    
    // Check if we're on a valid flight page
    const pageTitle = $('title').text()
    if (!pageTitle.includes(flightCode.toUpperCase()) && !pageTitle.includes('Flight Status')) {
      console.error('\n!!! WARNING: Page title does not contain flight code, might be wrong page !!!')
      console.log('Expected flight code in title:', flightCode.toUpperCase())
    }
    
    // Try to detect if we're being blocked
    if (html.includes('cloudflare') || html.includes('cf-browser-verification')) {
      console.error('\n!!! BLOCKED BY CLOUDFLARE !!!')
      console.log('Returning mock data due to Cloudflare blocking')
      return getMockFlightData(flightCode)
    }
    
    // Check if we got a very small response (likely an error page)
    if (html.length < 5000) {
      console.error('\n!!! Response too small, likely an error page !!!')
      console.log('HTML length:', html.length)
      console.log('Returning mock data')
      return getMockFlightData(flightCode)
    }
    
    // Initialize data object
    const data: FlightAwareData = {
      flightCode: flightCode.toUpperCase(),
      source: 'flightaware',
      airline: undefined,
      flightNumber: undefined,
      departureAirport: undefined,
      departureAirportCode: undefined,
      arrivalAirport: undefined,
      arrivalAirportCode: undefined,
      scheduledDepartureTime: undefined,
      scheduledArrivalTime: undefined,
      actualDepartureTime: undefined,
      gateDepartureTime: undefined,
      status: undefined,
      aircraft: undefined,
      registration: undefined,
      distance: undefined,
      duration: undefined,
      altitude: undefined,
      speed: undefined,
      gateArrivalTime: undefined,
      landingTime: undefined,
      elapsedTime: undefined,
      remainingTime: undefined,
      taxiOut: undefined,
      taxiIn: undefined,
      averageDelay: undefined,
      airlineLogoUrl: undefined,
      friendlyFlightIdentifier: undefined,
      callsign: undefined,
      iataCode: undefined,
      departureCity: undefined,
      departureState: undefined,
      arrivalCity: undefined,
      arrivalState: undefined,
      departureGate: undefined,
      arrivalGate: undefined,
      flightProgressStatus: undefined,
      flightProgressTimeRemaining: undefined,
      totalTravelTime: undefined,
      flownDistance: undefined,
      remainingDistanceScraped: undefined,
      plannedSpeed: undefined,
      plannedAltitude: undefined,
      route: undefined,
    }
    
    // Look for trackpollBootstrap JSON data (FlightAware embeds flight data as JSON)
    console.log('\n--- Looking for trackpollBootstrap data ---')
    const scriptMatch = html.match(/trackpollBootstrap\s*=\s*({[^;]+});/)
    if (scriptMatch) {
      console.log('Found trackpollBootstrap data!')
      try {
        const bootstrapData = JSON.parse(scriptMatch[1])
        console.log('Bootstrap data structure:', JSON.stringify(bootstrapData, null, 2).substring(0, 500))
        
        // Extract flight data from trackpollBootstrap
        if (bootstrapData.flights) {
          const flightKeys = Object.keys(bootstrapData.flights)
          console.log('Flight keys found:', flightKeys)
          
          if (flightKeys.length > 0) {
            const flightData = bootstrapData.flights[flightKeys[0]]
            console.log('\nExtracting data from flight:', flightKeys[0])
            
            if (flightData.activityLog?.flights?.length > 0) {
              const flight = flightData.activityLog.flights[0]
              console.log('Flight data:', JSON.stringify(flight, null, 2).substring(0, 1000))
              
              // Parse airline from flight code
              const airlineCodeMap: Record<string, string> = {
                'DAL': 'Delta Air Lines',
                'AAL': 'American Airlines',
                'UAL': 'United Airlines',
                'SWA': 'Southwest Airlines',
                'JBU': 'JetBlue Airways',
                'ASA': 'Alaska Airlines',
                'NKS': 'Spirit Airlines',
                'FFT': 'Frontier Airlines',
                'HAL': 'Hawaiian Airlines',
                'VRD': 'Virgin America',
                'BAW': 'British Airways',
                'AFR': 'Air France',
                'DLH': 'Lufthansa',
                'UAE': 'Emirates',
                'QTR': 'Qatar Airways',
                'SIA': 'Singapore Airlines',
                'ACA': 'Air Canada',
                'KLM': 'KLM Royal Dutch Airlines',
                'CPA': 'Cathay Pacific',
                'ANA': 'All Nippon Airways',
                'JAL': 'Japan Airlines',
              }
              
              // Extract airline code from display ident or flight code
              const identCode = flight.displayIdent || flightCode
              const airlineMatch = identCode.match(/^([A-Z]{2,3})/)
              if (airlineMatch && airlineCodeMap[airlineMatch[1]]) {
                data.airline = airlineCodeMap[airlineMatch[1]]
              } else {
                data.airline = flight.airline || 'Unknown Airline'
              }
              
              data.flightNumber = flight.displayIdent?.replace(/[A-Z]+/, '') || flightCode.replace(/[A-Z]+/, '')
              data.friendlyFlightIdentifier = `${data.airline} ${data.flightNumber}`
              data.callsign = flight.displayIdent || flightCode
              data.iataCode = flight.displayIdent || flightCode
              
              // Airport information
              if (flight.origin) {
                data.departureAirport = flight.origin.friendlyLocation || flight.origin.friendlyName
                data.departureAirportCode = flight.origin.iata || flight.origin.icao?.replace('K', '')
                data.departureCity = flight.origin.friendlyLocation?.split(',')[0]?.trim()
                data.departureState = flight.origin.friendlyLocation?.split(',')[1]?.trim()
                data.departureGate = flight.origin.gate
                data.departureTerminal = flight.origin.terminal
              }
              
              if (flight.destination) {
                data.arrivalAirport = flight.destination.friendlyLocation || flight.destination.friendlyName
                data.arrivalAirportCode = flight.destination.iata || flight.destination.icao?.replace('K', '')
                data.arrivalCity = flight.destination.friendlyLocation?.split(',')[0]?.trim()
                data.arrivalState = flight.destination.friendlyLocation?.split(',')[1]?.trim()
                data.arrivalGate = flight.destination.gate
                data.arrivalTerminal = flight.destination.terminal
              }
              
              // Aircraft information
              data.aircraft = flight.aircraftTypeFriendly || flight.aircraftType
              data.registration = flight.aircraft?.tail
              
              // Times (FlightAware uses Unix timestamps)
              if (flight.gateDepartureTimes) {
                const depTime = flight.gateDepartureTimes.actual || flight.gateDepartureTimes.estimated || flight.gateDepartureTimes.scheduled
                if (depTime) {
                  data.gateDepartureTime = new Date(depTime * 1000).toLocaleString()
                }
              }
              
              if (flight.takeoffTimes) {
                const takeoffTime = flight.takeoffTimes.actual || flight.takeoffTimes.estimated || flight.takeoffTimes.scheduled
                if (takeoffTime) {
                  data.actualDepartureTime = new Date(takeoffTime * 1000).toLocaleString()
                  data.takeoffTime = new Date(takeoffTime * 1000).toLocaleString()
                }
              }
              
              if (flight.landingTimes) {
                const landTime = flight.landingTimes.actual || flight.landingTimes.estimated || flight.landingTimes.scheduled
                if (landTime) {
                  data.landingTime = new Date(landTime * 1000).toLocaleString()
                }
              }
              
              if (flight.gateArrivalTimes) {
                const arrTime = flight.gateArrivalTimes.actual || flight.gateArrivalTimes.estimated || flight.gateArrivalTimes.scheduled
                if (arrTime) {
                  data.gateArrivalTime = new Date(arrTime * 1000).toLocaleString()
                }
              }
              
              // Flight plan data
              if (flight.flightPlan) {
                data.distance = flight.flightPlan.directDistance?.toString()
                data.plannedSpeed = flight.flightPlan.speed?.toString()
                data.plannedAltitude = flight.flightPlan.altitude?.toString()
                data.route = flight.flightPlan.route || 'Direct'
                
                // Calculate duration from ETE (estimated time enroute)
                if (flight.flightPlan.ete) {
                  const hours = Math.floor(flight.flightPlan.ete / 3600)
                  const minutes = Math.floor((flight.flightPlan.ete % 3600) / 60)
                  data.duration = { hours, minutes }
                  data.totalTravelTime = `${hours}h ${minutes}m`
                }
              }
              
              // Status
              data.status = flight.flightStatus || 'Scheduled'
              if (flight.cancelled) data.status = 'Cancelled'
              if (flight.diverted) data.status = 'Diverted'
              
              // Calculate progress if in flight
              if (flight.takeoffTimes?.actual && flight.flightPlan?.ete) {
                const now = Date.now() / 1000
                const elapsed = now - flight.takeoffTimes.actual
                const remaining = flight.flightPlan.ete - elapsed
                
                if (elapsed > 0 && remaining > 0) {
                  const elapsedHours = Math.floor(elapsed / 3600)
                  const elapsedMinutes = Math.floor((elapsed % 3600) / 60)
                  data.elapsedTime = `${elapsedHours}h ${elapsedMinutes}m`
                  
                  const remainingHours = Math.floor(remaining / 3600)
                  const remainingMinutes = Math.floor((remaining % 3600) / 60)
                  data.remainingTime = `${remainingHours}h ${remainingMinutes}m`
                  
                  if (flight.flightPlan.directDistance) {
                    const progress = elapsed / flight.flightPlan.ete
                    data.flownDistance = Math.round(flight.flightPlan.directDistance * progress)
                    data.remainingDistanceScraped = Math.round(flight.flightPlan.directDistance * (1 - progress))
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Error parsing trackpollBootstrap:', e)
      }
    } else {
      console.log('No trackpollBootstrap data found - trying HTML extraction')
    }

    // Only try HTML extraction if JSON parsing didn't get the data
    if (!data.airline || !data.departureAirportCode) {
      console.log('\n--- Trying HTML extraction as fallback ---')
      
      // Extract airline logo
      const airlineLogo = $('.flightPageAvatar img').first()
      if (airlineLogo.length) {
        data.airlineLogoUrl = airlineLogo.attr('src')
        if (!data.airline) {
          data.airline = airlineLogo.attr('alt')
        }
      }

      // Extract friendly flight identifier
      const friendlyIdent = $('.flightPageFriendlyIdentLbl h1').first().text().trim()
      if (friendlyIdent && !data.friendlyFlightIdentifier) {
        data.friendlyFlightIdentifier = friendlyIdent
        const parts = friendlyIdent.match(/^(.+?)\s+(\d+)$/)
        if (parts) {
          if (!data.airline) data.airline = parts[1].trim()
          if (!data.flightNumber) data.flightNumber = parts[2]
        }
      }

      // Extract callsign and IATA code
      const identContainer = $('.flightPageIdent h1')
      if (identContainer.length >= 1 && !data.callsign) {
        data.callsign = identContainer.eq(0).text().trim()
        if (identContainer.length >= 2 && !data.iataCode) {
          const iataText = identContainer.eq(1).text().trim()
          data.iataCode = iataText.replace(/^[&nbsp;\/\s]+/, '').trim()
        }
      }

      // Extract flight status
      const statusElement = $('.flightPageSummaryStatus').first()
      if (statusElement.length && !data.status) {
        const statusText = statusElement.clone().children().remove().end().text().trim()
        data.flightProgressStatus = statusText
        data.status = statusText
        
        const statusExt = statusElement.find('.flightPageSummaryStatusExt').text().trim()
        if (statusExt) {
          data.flightProgressTimeRemaining = statusExt
        }
      }

      // Extract airport information
      const originSection = $('.flightPageSummaryOrigin').first()
      const destSection = $('.flightPageSummaryDestination').first()

      if (originSection.length && !data.departureAirportCode) {
        const originCode = originSection.find('.flightPageSummaryAirportCode').text().trim()
        if (originCode) {
          data.departureAirportCode = originCode.replace(/^K/, '')
        }
        
        const originCity = originSection.find('.flightPageSummaryCity').text().trim()
        if (originCity) {
          const parts = originCity.split(/,\s*/)
          data.departureCity = parts[0] || null
          data.departureState = parts[1] || null
          data.departureAirport = originCity
        }
      }

      if (destSection.length && !data.arrivalAirportCode) {
        const destCode = destSection.find('.flightPageSummaryAirportCode').text().trim()
        if (destCode) {
          data.arrivalAirportCode = destCode.replace(/^K/, '')
        }
        
        const destCity = destSection.find('.flightPageSummaryCity').text().trim()
        if (destCity) {
          const parts = destCity.split(/,\s*/)
          data.arrivalCity = parts[0] || null
          data.arrivalState = parts[1] || null
          data.arrivalAirport = destCity
        }
      }

      // Extract gate information
      const gateElements = $('.flightPageAirportGate')
      gateElements.each((i, el) => {
        const gateText = $(el).text()
        const leftGateMatch = gateText.match(/left\s+Gate\s+([A-Z0-9]+)/i)
        const arrivingGateMatch = gateText.match(/arriving\s+at\s+Gate\s+([A-Z0-9]+)/i)
        
        if (leftGateMatch && !data.departureGate) {
          data.departureGate = leftGateMatch[1]
        }
        if (arrivingGateMatch && !data.arrivalGate) {
          data.arrivalGate = arrivingGateMatch[1]
        }
      })
    }

    // If we still don't have basic flight info, try more aggressive parsing
    if (!data.airline || !data.flightNumber) {
      console.log('\n--- Attempting aggressive parsing for basic info ---')
      
      // Look for any airline names in the page
      const airlinePatterns = [
        /\b(Delta|American|United|Southwest|JetBlue|Alaska|Spirit|Frontier|Hawaiian)\b/gi,
        /\b(Air Canada|British Airways|Lufthansa|Emirates|Qatar|Singapore)\b/gi,
        /\b(Air France|KLM|Virgin|Cathay|ANA|JAL)\b/gi
      ]
      
      const pageText = $('body').text()
      for (const pattern of airlinePatterns) {
        const match = pageText.match(pattern)
        if (match && !data.airline) {
          data.airline = match[0]
          console.log('Found airline via pattern match:', data.airline)
          break
        }
      }
      
      // Look for flight number patterns
      const flightNumPattern = new RegExp(`${flightCode}|\\b\\d{1,4}\\b`, 'gi')
      const flightNumMatches = pageText.match(flightNumPattern)
      if (flightNumMatches && !data.flightNumber) {
        data.flightNumber = flightNumMatches[0]
        console.log('Found flight number via pattern:', data.flightNumber)
      }
    }
    
    console.log('\n=== FINAL SCRAPED DATA ===\n', JSON.stringify(data, null, 2))
    console.log('\n=== END OF SCRAPING ===\n')

    // Save to memory cache
    flightAwareCache.set(flightCode, {
      data,
      timestamp: Date.now(),
    })

    // Save to database cache
    try {
      const cacheExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      const existing = await payload.find({
        collection: 'flight-cache',
        where: { flightCode: { equals: flightCode } },
        limit: 1,
      })

      const cacheData = {
        flightCode: data.flightCode || '',
        airline: data.airline || null,
        aircraft: data.aircraft || null,
        registration: data.registration || null,
        departureAirport: data.departureAirport || null,
        departureAirportCode: String(data.departureAirportCode || ''),
        arrivalAirport: data.arrivalAirport || null,
        arrivalAirportCode: String(data.arrivalAirportCode || ''),
        departureGate: data.departureGate,
        arrivalGate: data.arrivalGate,
        status: data.status,
        distance: data.distance ? parseInt(String(data.distance)) : null,
        duration: data.duration,
        route: data.route,
        altitude: data.altitude ? parseInt(String(data.altitude).replace(/[^\d]/g, '')) : null,
        speed: data.speed ? parseFloat(String(data.speed).replace(/[^\d.]/g, '')) : null,
        elapsedTime: data.elapsedTime,
        remainingTime: data.remainingTime,
        gateDepartureTime: data.gateDepartureTime,
        gateArrivalTime: data.gateArrivalTime,
        takeoffTime: data.actualDepartureTime,
        landingTime: data.landingTime,
        taxiOut: data.taxiOut,
        taxiIn: data.taxiIn,
        averageDelay: data.averageDelay,
        airlineLogoUrl: data.airlineLogoUrl,
        friendlyFlightIdentifier: data.friendlyFlightIdentifier,
        callsign: data.callsign,
        iataCode: data.iataCode,
        departureCity: data.departureCity,
        departureState: data.departureState,
        arrivalCity: data.arrivalCity,
        arrivalState: data.arrivalState,
        flightProgressStatus: data.flightProgressStatus,
        flightProgressTimeRemaining: data.flightProgressTimeRemaining,
        totalTravelTime: data.totalTravelTime,
        flownDistance: data.flownDistance,
        remainingDistanceScraped: data.remainingDistanceScraped,
        plannedSpeed: data.plannedSpeed
          ? parseFloat(String(data.plannedSpeed).replace(/[^\d.]/g, ''))
          : null,
        plannedAltitude: data.plannedAltitude
          ? parseInt(String(data.plannedAltitude).replace(/[^\d]/g, ''))
          : null,
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
      console.error('Error saving to flight cache:', error)
    }

    // Clean up old memory cache entries
    for (const [key, value] of flightAwareCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_DURATION * 2) {
        flightAwareCache.delete(key)
      }
    }

    return data
  } catch (error) {
    console.error('Error scraping FlightAware:', error)
    return getMockFlightData(flightCode)
  }
}

// Mock data generator for testing and fallback
function getMockFlightData(code: string): FlightAwareData {
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
    'AFR': 'Air France',
    'AF': 'Air France',
    'DLH': 'Lufthansa',
    'LH': 'Lufthansa',
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

  // Generate realistic mock data based on code
  const routes = [
    { dep: 'LAX', depCity: 'Los Angeles, CA', arr: 'JFK', arrCity: 'New York, NY', distance: '2475', gates: { dep: 'T4-42B', arr: 'T4-B22' } },
    { dep: 'ORD', depCity: 'Chicago, IL', arr: 'LAX', arrCity: 'Los Angeles, CA', distance: '1745', gates: { dep: 'T1-C16', arr: 'T6-65A' } },
    { dep: 'ATL', depCity: 'Atlanta, GA', arr: 'DFW', arrCity: 'Dallas, TX', distance: '731', gates: { dep: 'T-S D12', arr: 'A15' } },
    { dep: 'DEN', depCity: 'Denver, CO', arr: 'SEA', arrCity: 'Seattle, WA', distance: '1024', gates: { dep: 'B44', arr: 'N12' } },
    { dep: 'MIA', depCity: 'Miami, FL', arr: 'BOS', arrCity: 'Boston, MA', distance: '1258', gates: { dep: 'D46', arr: 'C19' } },
  ]

  // Use flight number to consistently pick a route (for demo consistency)
  const routeIndex = flightNumber ? parseInt(flightNumber) % routes.length : 0
  const route = routes[routeIndex] || routes[0]
  
  const aircraft = ['Boeing 737-800', 'Airbus A320', 'Boeing 777-300ER', 'Airbus A350-900', 'Boeing 787-9']
  const aircraftIndex = flightNumber ? parseInt(flightNumber) % aircraft.length : 0

  // Calculate times based on current time for realism
  const now = new Date()
  const departureTime = new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
  const arrivalTime = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours from now
  const totalMinutes = 240 // 4 hours
  const elapsedMinutes = 120 // 2 hours
  const progress = 50

  return {
    flightCode: code,
    source: 'flightaware',
    airline,
    flightNumber,
    friendlyFlightIdentifier: `${airline} ${flightNumber}`,
    callsign: code,
    iataCode: code,
    
    departureAirport: route.depCity,
    departureAirportCode: route.dep,
    departureCity: route.depCity.split(',')[0],
    departureState: route.depCity.split(',')[1]?.trim(),
    departureGate: route.gates.dep,
    
    arrivalAirport: route.arrCity,
    arrivalAirportCode: route.arr,
    arrivalCity: route.arrCity.split(',')[0],
    arrivalState: route.arrCity.split(',')[1]?.trim(),
    arrivalGate: route.gates.arr,
    
    status: 'En Route',
    flightProgressStatus: 'En Route - On Time',
    flightProgressTimeRemaining: 'Arriving in 2 hours',
    
    gateDepartureTime: departureTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }),
    takeoffTime: new Date(departureTime.getTime() + 15 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }),
    landingTime: new Date(arrivalTime.getTime() - 10 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }),
    gateArrivalTime: arrivalTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }),
    
    elapsedTime: `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m`,
    remainingTime: `${Math.floor((totalMinutes - elapsedMinutes) / 60)}h ${(totalMinutes - elapsedMinutes) % 60}m`,
    totalTravelTime: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
    duration: { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 },
    
    flownDistance: Math.round(progress * parseInt(route.distance) / 100),
    remainingDistanceScraped: Math.round((100 - progress) * parseInt(route.distance) / 100),
    distance: parseInt(route.distance),
    
    altitude: '35000',
    speed: '545',
    plannedAltitude: '37000',
    plannedSpeed: '550',
    
    aircraft: aircraft[aircraftIndex],
    registration: `N${Math.floor(100 + parseInt(flightNumber || '0') % 900)}${String.fromCharCode(65 + (parseInt(flightNumber || '0') % 26))}A`,
    
    taxiOut: '15',
    taxiIn: '10',
    averageDelay: 'Less than 10 minutes',
    
    route: 'Direct',
    
    // Flag this as mock data
    isMockData: true,
    mockReason: 'FlightAware data unavailable - using demonstration data',
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

    // Get airline from database (if needed, relies on scraped data.airline)
    const airline = await getAirlineByCode(flightData.airline || code)

    const payload = await getPayload({ config })

    let departureAirportData = null
    let arrivalAirportData = null

    if (flightData.departureAirportCode) {
      const depResult = await payload.find({
        collection: 'airports',
        where: {
          or: [
            { iata: { equals: flightData.departureAirportCode } },
            { icao: { equals: flightData.departureAirportCode } },
          ],
        },
        limit: 1,
      })
      if (depResult.docs.length > 0) {
        departureAirportData = depResult.docs[0]
      }
    }

    if (flightData.arrivalAirportCode) {
      const arrResult = await payload.find({
        collection: 'airports',
        where: {
          or: [
            { iata: { equals: flightData.arrivalAirportCode } },
            { icao: { equals: flightData.arrivalAirportCode } },
          ],
        },
        limit: 1,
      })
      if (arrResult.docs.length > 0) {
        arrivalAirportData = arrResult.docs[0]
      }
    }

    // Calculate distance if not scraped and we have airport coordinates
    let calculatedDistance = null
    if (!flightData.distance && departureAirportData && arrivalAirportData) {
      const R = 3959 // Earth's radius in miles
      const lat1 = (departureAirportData.latitude * Math.PI) / 180
      const lat2 = (arrivalAirportData.latitude * Math.PI) / 180
      const deltaLat =
        ((arrivalAirportData.latitude - departureAirportData.latitude) * Math.PI) / 180
      const deltaLon =
        ((arrivalAirportData.longitude - departureAirportData.longitude) * Math.PI) / 180

      const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      calculatedDistance = Math.round(R * c)
    }

    // Get airport display names
    const departureAirportDisplay =
      flightData.departureAirport ||
      departureAirportData?.name ||
      (flightData.departureAirportCode
        ? await getAirportDisplay(String(flightData.departureAirportCode))
        : null)

    const arrivalAirportDisplay =
      flightData.arrivalAirport ||
      arrivalAirportData?.name ||
      (flightData.arrivalAirportCode
        ? await getAirportDisplay(String(flightData.arrivalAirportCode))
        : null)

    let aircraftImageUrl = null
    if (flightData.registration) {
      aircraftImageUrl = await getAircraftImage(flightData.registration)
    }

    // Format the response to match our flight data structure
    const formattedData: FlightAwareData = {
      flight: flightData.flightCode,
      airline: (airline?.name as string) || (flightData.airline as string),
      airline_iata: airline?.iata as string,
      airline_icao: airline?.icao as string,
      flightNumber: flightData.flightNumber,
      departureAirport: departureAirportDisplay as string,
      destinationAirport: arrivalAirportDisplay as string,
      departureAirportCode: flightData.departureAirportCode as string,
      arrivalAirportCode: flightData.arrivalAirportCode as string,
      scheduled_departure: flightData.scheduledDepartureTime as string,
      scheduled_arrival: flightData.scheduledArrivalTime as string,
      actual_departure: flightData.actualDepartureTime,
      gate_departure: flightData.gateDepartureTime,
      status: flightData.status,
      aircraft: flightData.aircraft,
      registration: flightData.registration,
      distance: (flightData.distance as number) || calculatedDistance,
      duration: flightData.duration,
      altitude: flightData.altitude,
      speed: flightData.speed,
      departureGate: flightData.departureGate,
      arrivalGate: flightData.arrivalGate,
      route: flightData.route,
      flightStatus: flightData.status,
      flightDuration: flightData.duration,
      flightDistance: (flightData.distance as number) || calculatedDistance,
      aircraft_image: aircraftImageUrl?.url || aircraftImageUrl as string,
      aircraftImage: aircraftImageUrl?.url || aircraftImageUrl as string,
      departureTime: flightData.scheduledDepartureTime as string,
      arrivalTime: flightData.scheduledArrivalTime as string,
      elapsedTime: flightData.elapsedTime,
      remainingTime: flightData.remainingTime,
      gateDepartureTime: flightData.gateDepartureTime,
      takeoffTime: flightData.actualDepartureTime,
      landingTime: flightData.landingTime,
      gateArrivalTime: flightData.gateArrivalTime,
      taxiOut: flightData.taxiOut,
      taxiIn: flightData.taxiIn,
      averageDelay: flightData.averageDelay,

      // New fields from summary and flight data blocks
      airlineLogoUrl: flightData.airlineLogoUrl,
      friendlyFlightIdentifier: flightData.friendlyFlightIdentifier,
      callsign: flightData.callsign,
      iataCode: flightData.iataCode,
      departureCity: flightData.departureCity,
      departureState: flightData.departureState,
      arrivalCity: flightData.arrivalCity,
      arrivalState: flightData.arrivalState,
      flightProgressStatus: flightData.flightProgressStatus,
      flightProgressTimeRemaining: flightData.flightProgressTimeRemaining,
      totalTravelTime: flightData.totalTravelTime,
      flownDistance: flightData.flownDistance,
      remainingDistance: flightData.remainingDistanceScraped,
      plannedSpeed: flightData.plannedSpeed,
      plannedAltitude: flightData.plannedAltitude,
      
      // Include mock data flag if present
      isMockData: flightData.isMockData,
      mockReason: flightData.mockReason,
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
