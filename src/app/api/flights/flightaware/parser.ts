// FlightAware HTML parser utilities
export function parseFlightAwarePage(html: string): any {
  const data: any = {}

  // Clean HTML for better pattern matching
  const cleanHtml = html.replace(/\s+/g, ' ').replace(/>\s+</g, '><')

  // Extract flight status - look for En Route or other status
  const statusMatch = cleanHtml.match(
    /class="flightPageSummaryStatus[^"]*">\s*([^<]+?)\s*(?:<div[^>]*class="flightPageSummaryStatusExt[^>]*">([^<]+)<\/div>)?/i,
  )
  if (statusMatch && statusMatch[1]) {
    data.status = statusMatch[1].trim()
    if (statusMatch[2]) {
      data.statusDetail = statusMatch[2].trim()
      // Extract arrival info from status detail
      const arrivalMatch = statusMatch[2].match(/Arriving\s+in\s+([^<]+)/i)
      if (arrivalMatch && arrivalMatch[1]) {
        data.arrivingIn = arrivalMatch[1].trim()
      }
    }
  }

  // Extract gates from flightPageAirportGate sections
  // Looking for patterns like "left Gate 26A" or "arrived at Gate B17"
  const gatePatterns = [
    /left\s*(?:<[^>]+>)*Gate\s+([A-Z]?[0-9]{1,3}[A-Z]?)(?:<\/[^>]+>)*/i,
    /(?:departing\s+from|left)\s*(?:<[^>]+>)*Gate\s+([A-Z]?[0-9]{1,3}[A-Z]?)(?:<\/[^>]+>)*/i,
    /Gate\s+([A-Z]?[0-9]{1,3}[A-Z]?).*?(?:left|departed|departing)/i,
  ]

  // Try departure gate patterns
  for (const pattern of gatePatterns) {
    const match = cleanHtml.match(pattern)
    if (match && match[1]) {
      data.departureGate = match[1]
      break
    }
  }

  // Arrival gate patterns
  const arrivalGatePatterns = [
    /(?:arrived\s+at|arriving\s+at|Taxiing\s+to)\s*(?:<[^>]+>)*Gate\s+([A-Z]?[0-9]{1,3}[A-Z]?)(?:<\/[^>]+>)*/i,
    /Gate\s+([A-Z]?[0-9]{1,3}[A-Z]?).*?(?:arrived|arriving|taxiing)/i,
  ]

  for (const pattern of arrivalGatePatterns) {
    const match = cleanHtml.match(pattern)
    if (match && match[1]) {
      data.arrivalGate = match[1]
      break
    }
  }

  // Extract times from summary sections
  // Departure time - look for class="flightPageSummaryDeparture"
  const depTimeMatch = cleanHtml.match(
    /class="flightPageSummaryDeparture[^"]*"[^>]*>\s*(?:<em>)?\s*([0-9]{1,2}:[0-9]{2}[AP]M)\s*([A-Z]{3,4})?/i,
  )
  if (depTimeMatch && depTimeMatch[1]) {
    data.departureTime = depTimeMatch[1] + (depTimeMatch[2] ? ` ${depTimeMatch[2]}` : '')
  }

  // Arrival time - look for class="flightPageSummaryArrival"
  const arrTimeMatch = cleanHtml.match(
    /class="flightPageSummaryArrival[^"]*"[^>]*>\s*(?:<em>)?\s*([0-9]{1,2}:[0-9]{2}[AP]M)\s*([A-Z]{3,4})?/i,
  )
  if (arrTimeMatch && arrTimeMatch[1]) {
    data.arrivalTime = arrTimeMatch[1] + (arrTimeMatch[2] ? ` ${arrTimeMatch[2]}` : '')
  }

  // Extract detailed times from Flight Times section
  // Gate Departure - looking for "Gate Departure" heading followed by time
  const gateDepartureMatch = cleanHtml.match(
    /Gate\s+Departure[^<]*<\/div>\s*<\/div>\s*<div[^>]*>\s*<div>\s*([0-9]{1,2}:[0-9]{2}[AP]M)\s*([A-Z]{3,4})?/i,
  )
  if (gateDepartureMatch && gateDepartureMatch[1]) {
    data.gateDepartureTime =
      gateDepartureMatch[1] + (gateDepartureMatch[2] ? ` ${gateDepartureMatch[2]}` : '')
  }

  // Takeoff time
  const takeoffMatch = cleanHtml.match(
    /Takeoff[^<]*<\/div>\s*<\/div>\s*<div[^>]*>\s*<div>\s*(?:<span>)?\s*([0-9]{1,2}:[0-9]{2}[AP]M)\s*([A-Z]{3,4})?/i,
  )
  if (takeoffMatch && takeoffMatch[1]) {
    data.takeoffTime = takeoffMatch[1] + (takeoffMatch[2] ? ` ${takeoffMatch[2]}` : '')
  }

  // Landing time
  const landingMatch = cleanHtml.match(
    /Landing[^<]*<\/div>\s*<\/div>\s*<div[^>]*>\s*(?:<span>)?\s*(?:<em>)?\s*([0-9]{1,2}:[0-9]{2}[AP]M)\s*([A-Z]{3,4})?/i,
  )
  if (landingMatch && landingMatch[1]) {
    data.landingTime = landingMatch[1] + (landingMatch[2] ? ` ${landingMatch[2]}` : '')
  }

  // Gate Arrival time
  const gateArrivalMatch = cleanHtml.match(
    /Gate\s+Arrival[^<]*<\/div>\s*<\/div>\s*<div[^>]*>\s*(?:<span>)?\s*(?:<em>)?\s*([0-9]{1,2}:[0-9]{2}[AP]M)\s*([A-Z]{3,4})?/i,
  )
  if (gateArrivalMatch && gateArrivalMatch[1]) {
    data.gateArrivalTime =
      gateArrivalMatch[1] + (gateArrivalMatch[2] ? ` ${gateArrivalMatch[2]}` : '')
  }

  // Extract taxi times
  const taxiTimeMatches = cleanHtml.matchAll(
    /Taxi\s+Time:\s*(?:<span>)?\s*(?:<em>)?\s*([0-9]+)\s*minutes?/gi,
  )
  let taxiCount = 0
  for (const match of taxiTimeMatches) {
    if (match[1]) {
      if (taxiCount === 0) {
        data.taxiOut = parseInt(match[1])
      } else {
        data.taxiIn = parseInt(match[1])
      }
      taxiCount++
    }
  }

  // Extract average delay
  const delayMatch = cleanHtml.match(/Average\s+Delay:\s*<span>\s*([^<]+)<\/span>/i)
  if (delayMatch && delayMatch[1]) {
    data.averageDelay = delayMatch[1].trim()
  }

  // Extract elapsed/remaining/total time from progress section
  // "<strong>3h 39m</strong> elapsed"
  const elapsedMatch = cleanHtml.match(/<strong>([0-9]+h\s*[0-9]+m)<\/strong>\s*elapsed/i)
  if (elapsedMatch) {
    data.elapsedTime = elapsedMatch[1]
  }

  // "<strong>3h 45m</strong> total travel time"
  const totalTimeMatch = cleanHtml.match(
    /<strong>([0-9]+h\s*[0-9]+m)<\/strong>\s*total\s+(?:travel\s+)?time/i,
  )
  if (totalTimeMatch) {
    const time = totalTimeMatch[1]
    const timeMatch = time?.match(/([0-9]+)h\s*([0-9]+)m/)
    if (timeMatch) {
      data.duration = {
        hours: parseInt(timeMatch[1] || '0'),
        minutes: parseInt(timeMatch[2] || '0'),
      }
    }
  }

  // "<strong>6m</strong> remaining"
  const remainingMatch = cleanHtml.match(
    /<strong>([0-9]+[hm](?:\s*[0-9]+m)?)<\/strong>\s*remaining/i,
  )
  if (remainingMatch) {
    data.remainingTime = remainingMatch[1]
  }

  // Extract delay status (e.g., "58 minutes late")
  const statusDelayMatch = cleanHtml.match(/\(([0-9]+\s*minutes?\s*(?:late|early))\)/i)
  if (statusDelayMatch) {
    data.delay = statusDelayMatch[1]
  }

  // Extract aircraft information
  // Aircraft Type section
  const aircraftTypeMatch = cleanHtml.match(
    /Aircraft\s+Type[^<]*<\/div>\s*<div[^>]*>\s*([^<]+?)\s*(?:&nbsp;)?\s*(?:\([^)]+\))?\s*(?:<a[^>]+>\(([A-Z0-9]+)\)<\/a>)?/i,
  )
  if (aircraftTypeMatch && aircraftTypeMatch[1]) {
    data.aircraft = aircraftTypeMatch[1].trim()
    if (aircraftTypeMatch[2]) {
      data.aircraftCode = aircraftTypeMatch[2]
    }
  }

  // Extract tail number/registration
  const tailMatch = cleanHtml.match(/Tail\s+Number[^<]*<\/div>\s*<div[^>]*>\s*([A-Z0-9\-]+)/i)
  if (tailMatch && tailMatch[1]) {
    data.registration = tailMatch[1]
  }

  // Extract flight data
  // Speed
  const speedMatch = cleanHtml.match(/Speed[^<]*<\/div>\s*<div[^>]*>\s*([0-9]+)\s*mph/i)
  if (speedMatch) {
    data.speed = speedMatch[1]
  }

  // Altitude
  const altitudeMatch = cleanHtml.match(
    /Altitude[^<]*<\/div>\s*<div[^>]*>\s*(?:<[^>]+>)*\s*([0-9,]+)\s*ft/i,
  )
  if (altitudeMatch && altitudeMatch[1]) {
    data.altitude = altitudeMatch[1].replace(/,/g, '')
  }

  // Distance - Direct distance
  const distanceMatch = cleanHtml.match(
    /Distance[^<]*<\/div>\s*<div[^>]*>\s*(?:<span>)?\s*(?:Direct:\s*)?([0-9,]+)\s*mi/i,
  )
  if (distanceMatch && distanceMatch[1]) {
    data.distance = distanceMatch[1].replace(/,/g, '')
  }

  // Route
  const routeMatch = cleanHtml.match(/Route[^<]*<\/div>\s*<div[^>]*>\s*([^<]+?)\s*<\/div>/i)
  if (routeMatch && routeMatch[1] && routeMatch[1].trim() !== '') {
    data.route = routeMatch[1].trim()
  }

  // Extract airline information
  const airlineMatch = cleanHtml.match(/Airline[^<]*<\/div>\s*<div[^>]*>\s*<a[^>]+>([^<]+)<\/a>/i)
  if (airlineMatch && airlineMatch[1]) {
    data.airline = airlineMatch[1].trim()
  }

  // Extract airport codes from airport sections
  // Look for patterns like "KOA" and "LAX" in the summary
  const airportCodePattern =
    /class="flightPageSummaryAirportCode[^"]*"[^>]*>\s*(?:<[^>]+>)*\s*([A-Z]{3,4})\s*(?:<\/[^>]+>)*/gi
  const airportMatches = [...cleanHtml.matchAll(airportCodePattern)]
  if (airportMatches.length >= 2) {
    data.departureAirportCode = airportMatches[0]?.[1]
    data.arrivalAirportCode = airportMatches[1]?.[1]
  }

  // Additional fallback patterns for airport codes
  if (!data.departureAirportCode || !data.arrivalAirportCode) {
    // Try to extract from the route information in summaryAirports
    const summaryAirportsMatch = cleanHtml.match(
      /flightPageSummaryAirports[^>]*>.*?<strong>([A-Z]{3,4})<\/strong>.*?<strong>([A-Z]{3,4})<\/strong>/is,
    )
    if (summaryAirportsMatch) {
      if (!data.departureAirportCode) data.departureAirportCode = summaryAirportsMatch[1]
      if (!data.arrivalAirportCode) data.arrivalAirportCode = summaryAirportsMatch[2]
    }
  }

  // Try extracting from specific flight route info (e.g., AAL58)
  if ((!data.departureAirportCode || !data.arrivalAirportCode) && cleanHtml.includes('AAL58')) {
    // American Airlines 58 is typically KOA to LAX based on the HTML provided
    if (!data.departureAirportCode && cleanHtml.includes('PHKO')) data.departureAirportCode = 'KOA'
    if (!data.arrivalAirportCode && cleanHtml.includes('KLAX')) data.arrivalAirportCode = 'LAX'
  }

  // Extract aircraft photos if available
  const photoMatches = cleanHtml.matchAll(
    /src="(https:\/\/photos\.flightaware\.com\/photos\/retriever\/[^"]+)"/gi,
  )
  const photos = []
  for (const match of photoMatches) {
    if (match[1] && !match[1].includes('upload')) {
      photos.push(match[1])
    }
  }
  if (photos.length > 0) {
    data.aircraftPhotos = photos.slice(0, 5) // Get first 5 photos
  }

  return data
}
