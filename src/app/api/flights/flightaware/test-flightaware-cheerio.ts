// Test script for FlightAware scraper with Cheerio
// Run with: npx tsx src/app/api/flights/flightaware/test-flightaware-cheerio.ts

async function testFlightAware() {
  const testFlights = [
    'DAL41',    // Delta LAX to Sydney
    'AA100',    // American Airlines
    'UA456',    // United Airlines
    'WN1234',   // Southwest (WN instead of SW)
    'BA747',    // British Airways
  ]
  
  console.log('Testing FlightAware scraper with Cheerio...\n')
  
  // Test locally or adjust URL for your dev server
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000'
  
  for (const flight of testFlights) {
    console.log(`\n========== Testing flight: ${flight} ==========`)
    
    try {
      const response = await fetch(`${baseUrl}/api/flights/flightaware?callsign=${flight}`)
      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Success!')
        console.log('Flight Info:')
        console.log(`  - Flight Code: ${data.flight || 'N/A'}`)
        console.log(`  - Airline: ${data.airline || 'N/A'}`)
        console.log(`  - Friendly Name: ${data.friendlyFlightIdentifier || 'N/A'}`)
        console.log(`  - Aircraft: ${data.aircraft || 'N/A'}`)
        console.log(`  - Registration: ${data.registration || 'N/A'}`)
        
        console.log('\nRoute:')
        console.log(`  - From: ${data.departureAirport || 'N/A'} (${data.departureAirportCode || 'N/A'})`)
        console.log(`  - To: ${data.destinationAirport || 'N/A'} (${data.arrivalAirportCode || 'N/A'})`)
        console.log(`  - Distance: ${data.distance || 'N/A'} miles`)
        
        console.log('\nGates:')
        console.log(`  - Departure Gate: ${data.departureGate || 'N/A'}`)
        console.log(`  - Arrival Gate: ${data.arrivalGate || 'N/A'}`)
        
        console.log('\nTimes:')
        console.log(`  - Status: ${data.status || 'N/A'}`)
        console.log(`  - Gate Departure: ${data.gateDepartureTime || 'N/A'}`)
        console.log(`  - Takeoff: ${data.takeoffTime || 'N/A'}`)
        console.log(`  - Landing: ${data.landingTime || 'N/A'}`)
        console.log(`  - Gate Arrival: ${data.gateArrivalTime || 'N/A'}`)
        
        console.log('\nFlight Progress:')
        console.log(`  - Elapsed: ${data.elapsedTime || 'N/A'}`)
        console.log(`  - Remaining: ${data.remainingTime || 'N/A'}`)
        console.log(`  - Total Travel Time: ${data.totalTravelTime || 'N/A'}`)
        console.log(`  - Flown: ${data.flownDistance || 'N/A'} miles`)
        console.log(`  - To Go: ${data.remainingDistance || 'N/A'} miles`)
        
        console.log('\nCurrent Position:')
        console.log(`  - Altitude: ${data.altitude || 'N/A'} ft`)
        console.log(`  - Speed: ${data.speed || 'N/A'} mph`)
        
        console.log('\nCallsigns:')
        console.log(`  - ICAO: ${data.callsign || 'N/A'}`)
        console.log(`  - IATA: ${data.iataCode || 'N/A'}`)
        
      } else {
        console.log(`❌ Error: ${data.error}`)
        if (data.details) {
          console.log(`   Details: ${data.details}`)
        }
      }
    } catch (error) {
      console.log(`❌ Exception: ${error}`)
    }
    
    // Wait a bit between requests to be polite
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log('\n\nTest complete!')
}

// Run the test
testFlightAware().catch(console.error)
