# FlightAware Integration - Enhanced with Cheerio

The FlightTracker component now includes an enhanced FlightAware integration using Cheerio for reliable HTML parsing.

## Recent Improvements (January 2025)

### 1. **Cheerio-based HTML Parsing**
- Replaced regex-based parsing with Cheerio for more reliable data extraction
- Better handling of complex HTML structures
- More maintainable and readable code

### 2. **Fixed Flight Search**
- Exact match priority: searching for "DAL41" no longer returns "DAL417"
- Fallback to prefix matching if no exact match found
- Improved search algorithm in `/api/flights/search`

### 3. **Enhanced Data Extraction**
Based on the actual FlightAware HTML structure:
- **Flight Identification**: Airline name, flight number, callsign, IATA code
- **Airport Information**: City, state/country, airport codes
- **Gate Information**: Departure and arrival gates
- **Times**: Scheduled vs actual times, taxi times, delays
- **Flight Progress**: Elapsed time, remaining time, distances
- **Aircraft Details**: Type, altitude, speed, route
- **Status Updates**: Real-time flight status and ETA

## How it Works

1. When a user searches for a flight in the FlightTracker component:
   - First checks OpenSky Network for real-time position data
   - Then calls the FlightAware API endpoint to get additional details
   - Prioritizes exact callsign matches over partial matches

2. The FlightAware endpoint (`/api/flights/flightaware`) uses Cheerio to:
   - Parse the public flight page HTML
   - Extract structured data from various sections
   - Cache results for 5 minutes to reduce requests

## API Endpoint

```
GET /api/flights/flightaware?callsign=DAL41
GET /api/flights/flightaware?flightCode=AA100
```

### Response Format

```json
{
  "flight": "DAL41",
  "airline": "Delta Air Lines",
  "friendlyFlightIdentifier": "Delta Air Lines 41",
  "callsign": "DAL41",
  "iataCode": "DL41",
  "flightNumber": "41",
  
  "departureAirport": "Los Angeles, CA",
  "departureAirportCode": "LAX",
  "departureCity": "Los Angeles",
  "departureState": "CA",
  "departureGate": "30A",
  
  "destinationAirport": "Sydney, Australia",
  "arrivalAirportCode": "SYD",
  "arrivalCity": "Sydney",
  "arrivalState": "Australia",
  "arrivalGate": "59",
  
  "status": "En route and on time",
  "flightProgressStatus": "En route and on time",
  "flightProgressTimeRemaining": "Arriving in over 12 hours",
  
  "gateDepartureTime": "10:43PM PDT",
  "takeoffTime": "11:10PM PDT",
  "landingTime": "05:48AM AEST (+2)",
  "gateArrivalTime": "05:58AM AEST (+2)",
  
  "elapsedTime": "2h 6m",
  "remainingTime": "12h 9m",
  "totalTravelTime": "14h 15m",
  "duration": {
    "hours": 14,
    "minutes": 15
  },
  
  "flownDistance": 818,
  "remainingDistance": 6686,
  "distance": "7504",
  
  "altitude": "35000",
  "speed": "545",
  "plannedAltitude": "34000",
  "plannedSpeed": "578",
  
  "aircraft": "Airbus A350-900",
  "registration": "N/A",
  
  "taxiOut": "27 minutes",
  "taxiIn": "10 minutes",
  "averageDelay": "Less than 10 minutes",
  
  "route": "SUMMR2 FICKY 3000N/12500W...",
  "airlineLogoUrl": "https://www.flightaware.com/images/airline_logos/180px/DAL.png"
}
```

## Features

- **Reliable Parsing**: Cheerio handles complex HTML structures better than regex
- **Comprehensive Data**: Extracts all available public flight information
- **Smart Caching**: 5-minute cache to reduce server load
- **Error Handling**: Graceful fallbacks for missing data
- **Exact Match Priority**: Prevents incorrect flight matches

## Usage in FlightTracker

The FlightTracker component automatically:
1. Searches for exact flight matches first
2. Falls back to prefix matching if needed
3. Fetches FlightAware data when a flight is selected
4. Displays comprehensive flight information in the FlightCard

## Testing

Run the enhanced test script to verify the integration:

```bash
# Test with Cheerio parsing
npx tsx src/app/api/flights/flightaware/test-flightaware-cheerio.ts

# Test with specific flight
curl http://localhost:3000/api/flights/flightaware?callsign=DAL41
```

## Troubleshooting

### Common Issues

1. **"Flight not found"**
   - Verify the flight is currently active
   - Check the exact callsign format (e.g., DAL41 not DL41)
   - Some flights may not have public data available

2. **Incomplete data**
   - Normal - not all fields are always available
   - Gates may not be assigned yet
   - Some data only appears closer to departure/arrival

3. **Search returning wrong flight**
   - Fixed in latest version
   - Now prioritizes exact matches
   - Use full callsign for best results

## Data Reliability

- **Real-time Data**: Updated as FlightAware receives it
- **Gate Information**: May change, especially far from departure
- **Times**: Estimates that become more accurate closer to event
- **Aircraft Type**: Generally reliable
- **Registration**: Often hidden for privacy

## Future Enhancements

- WebSocket integration for real-time updates
- Historical flight data analysis
- Multi-flight tracking
- Weather overlay integration
- NOTAM integration

## Credits

- **FlightAware**: Public flight tracking data
- **Cheerio**: Fast, flexible HTML parsing
- **OpenSky Network**: Real-time position data
