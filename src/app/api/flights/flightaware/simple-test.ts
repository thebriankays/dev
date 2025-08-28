// Simple test to check FlightAware scraping
// Run with: npx tsx src/app/api/flights/flightaware/simple-test.ts

import * as cheerio from 'cheerio'

async function testFlightAwareDirect() {
  const testFlight = 'DAL41'
  const url = `https://flightaware.com/live/flight/${testFlight}`
  
  console.log(`\n=== Testing FlightAware Direct ===`)
  console.log(`Flight: ${testFlight}`)
  console.log(`URL: ${url}`)
  console.log(`Time: ${new Date().toISOString()}\n`)
  
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
  
  try {
    const response = await fetch(url, { headers })
    
    console.log('Response Status:', response.status)
    console.log('Response Headers:')
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('content') || key.toLowerCase().includes('cache')) {
        console.log(`  ${key}: ${value}`)
      }
    })
    
    const html = await response.text()
    console.log('\nHTML Length:', html.length, 'characters')
    
    const $ = cheerio.load(html)
    
    // Check page title
    const title = $('title').text()
    console.log('\nPage Title:', title)
    
    // Check for CloudFlare
    if (html.includes('cloudflare') || html.includes('cf-browser-verification')) {
      console.error('\n❌ BLOCKED BY CLOUDFLARE!')
      return
    }
    
    // Check for 404
    if (html.includes('404') || html.includes('Page Not Found')) {
      console.error('\n❌ PAGE NOT FOUND!')
      return
    }
    
    // Look for key elements
    console.log('\n=== Checking Key Elements ===')
    const selectors = {
      'Airline Logo': '.flightPageAvatar img',
      'Friendly ID': '.flightPageFriendlyIdentLbl h1',
      'Flight Ident': '.flightPageIdent h1',
      'Status': '.flightPageSummaryStatus',
      'Origin': '.flightPageSummaryOrigin',
      'Destination': '.flightPageSummaryDestination',
      'Gates': '.flightPageAirportGate',
      'Progress': '.flightPageProgressContainer',
      'Data Tables': '.flightPageDataTable'
    }
    
    for (const [name, selector] of Object.entries(selectors)) {
      const count = $(selector).length
      console.log(`${name}: ${count} found`)
      if (count > 0 && name !== 'Data Tables') {
        const first = $(selector).first()
        const text = first.text().trim().substring(0, 100)
        console.log(`  → "${text}"`)
      }
    }
    
    // Check for any h1 tags
    console.log('\n=== All H1 Tags ===')
    $('h1').each((i, el) => {
      console.log(`h1[${i}]: "${$(el).text().trim()}"`)
    })
    
    // Check for JSON-LD
    console.log('\n=== JSON-LD Scripts ===')
    $('script[type="application/ld+json"]').each((i, script) => {
      try {
        const json = JSON.parse($(script).html() || '{}')
        console.log(`Script ${i}:`, JSON.stringify(json, null, 2).substring(0, 200))
      } catch (e) {
        console.log(`Script ${i}: Failed to parse`)
      }
    })
    
    // Look for flight code anywhere
    console.log('\n=== Elements containing flight code ===')
    const codeElements = $(`*:contains("${testFlight}")`)
    console.log(`Found ${codeElements.length} elements containing "${testFlight}"`)
    
    // Check meta tags
    console.log('\n=== Meta Tags ===')
    $('meta[name="description"], meta[property="og:title"], meta[property="og:description"]').each((i, meta) => {
      const name = $(meta).attr('name') || $(meta).attr('property')
      const content = $(meta).attr('content')
      console.log(`${name}: "${content}"`)
    })
    
  } catch (error) {
    console.error('\n❌ Error:', error)
  }
}

// Run the test
testFlightAwareDirect().catch(console.error)
