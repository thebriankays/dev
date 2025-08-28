// Debug script to fetch and save FlightAware HTML
// Run with: npx tsx src/app/api/flights/flightaware/debug-html.ts

import * as fs from 'fs'
import * as path from 'path'

async function debugFlightAware() {
  const testFlight = 'DAL41' // You can change this to test different flights
  const url = `https://flightaware.com/live/flight/${testFlight}`
  
  console.log(`Fetching ${url}...`)
  
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
    
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    
    const html = await response.text()
    console.log('HTML Length:', html.length, 'characters')
    
    // Save the HTML to a file for inspection
    const outputPath = path.join(__dirname, `flightaware-${testFlight}.html`)
    fs.writeFileSync(outputPath, html)
    console.log(`\nHTML saved to: ${outputPath}`)
    
    // Check for common issues
    if (html.includes('404') || html.includes('Page Not Found')) {
      console.log('\n⚠️  WARNING: Page might be a 404')
    }
    
    if (html.includes('Access Denied') || html.includes('CloudFlare')) {
      console.log('\n⚠️  WARNING: Might be blocked by CloudFlare or similar')
    }
    
    if (html.length < 5000) {
      console.log('\n⚠️  WARNING: HTML seems too short, might be an error page')
    }
    
    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i)
    if (titleMatch) {
      console.log('\nPage Title:', titleMatch[1])
    }
    
    // Look for flight identifier patterns
    console.log('\n--- Looking for flight identifiers ---')
    const flightPatterns = [
      /class="flightPageFriendlyIdentLbl"[^>]*>([^<]+)</gi,
      /class="flightPageIdent"[^>]*>([^<]+)</gi,
      /<h1[^>]*>([^<]*(?:Delta|American|United|Southwest|British)[^<]*)<\/h1>/gi,
      new RegExp(testFlight, 'gi')
    ]
    
    flightPatterns.forEach((pattern, i) => {
      const matches = html.match(pattern)
      if (matches) {
        console.log(`Pattern ${i + 1} matches:`, matches.slice(0, 3))
      }
    })
    
    // Check for key CSS classes
    console.log('\n--- Checking for key CSS classes ---')
    const cssClasses = [
      'flightPageAvatar',
      'flightPageFriendlyIdentLbl',
      'flightPageIdent',
      'flightPageSummaryStatus',
      'flightPageSummaryOrigin',
      'flightPageSummaryDestination',
      'flightPageAirportGate',
      'flightPageProgressContainer',
      'flightPageDataTable'
    ]
    
    cssClasses.forEach(cls => {
      const count = (html.match(new RegExp(cls, 'g')) || []).length
      console.log(`  ${cls}: ${count} occurrences`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the debug script
debugFlightAware().catch(console.error)
