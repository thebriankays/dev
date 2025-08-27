# OpenFlights Data Integration

This directory contains utilities for integrating OpenFlights data into the FlightTracker component.

## Data Sources

The OpenFlights project provides three main datasets:

1. **airlines.dat** - Airline information
   - Columns: ID, Name, Alias, IATA, ICAO, Callsign, Country, Active
   - Example: `324,"All Nippon Airways",\N,"NH","ANA","ALL NIPPON","Japan","Y"`

2. **airports.dat** - Airport information
   - Columns: ID, Name, City, Country, IATA, ICAO, Latitude, Longitude, Altitude, Timezone, DST, Tz database timezone, Type, Source
   - Example: `507,"London Heathrow Airport","London","United Kingdom","LHR","EGLL",51.4706,-0.461941,83,0,"E","Europe/London","airport","OurAirports"`

3. **routes.dat** - Route information
   - Columns: Airline, Airline ID, Source airport, Source airport ID, Destination airport, Destination airport ID, Codeshare, Stops, Equipment
   - Example: `BA,1355,SIN,3316,LHR,507,,0,744 777`

## Data Format

- UTF-8 encoded CSV without headers
- Uses `\N` for NULL values
- Comma-separated with quotes for text fields

## Usage

1. Download the data files from https://github.com/jpatokal/openflights/tree/master/data
2. Place them in this directory
3. Run the loader scripts to process and optimize the data
4. The processed data will be used by the FlightTracker component

## Benefits

- **Instant airline identification** - Map callsigns to airline names without API calls
- **Complete airport database** - Get airport names, locations, and timezones instantly
- **Route prediction** - Show likely routes for flights based on historical data
- **Reduced API dependency** - Less reliance on external services
- **Better performance** - Local data lookups are much faster than API calls

## License

OpenFlights data is available under the Open Database License (ODbL).