// Test script for FlightAware scraper
// Run with: npx tsx src/app/api/flights/flightaware/test-flightaware.ts

async function testFlightAware() {
  const testFlights = ['AA100', 'DL123', 'UA456', 'SW1234', 'BA747']
  
  console.log('Testing FlightAware scraper...\n')
  
  for (const flight of testFlights) {
    console.log(`Testing flight: ${flight}`)
    
    try {
      const response = await fetch(`http://localhost:3000/api/flights/flightaware?callsign=${flight}`)
      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Success:')
        console.log(`  - Airline: ${data.airline || 'N/A'}`)
        console.log(`  - Aircraft: ${data.aircraft || 'N/A'}`)
        console.log(`  - From: ${data.departureAirport || 'N/A'}`)
        console.log(`  - To: ${data.destinationAirport || 'N/A'}`)
        console.log(`  - Status: ${data.status || 'N/A'}`)
      } else {
        console.log(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.log(`❌ Exception: ${error}`)
    }
    
    console.log('---\n')
    
    // Wait a bit between requests to be polite
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}

// Run the test
testFlightAware().catch(console.error)
