# Setting Up OpenFlights Data

To enable the OpenFlights data integration for instant airline and airport lookups:

## Quick Setup

1. Navigate to the OpenFlights data directory:
```bash
cd src/data/openflights
```

2. Download the data files:
```bash
node download-data.js
```

3. Process the data to create optimized lookup tables:
```bash
npx tsx loader.ts
```

This will create:
- `openflights-lookup.json` - Complete data with all fields
- `openflights-runtime.json` - Optimized runtime data (smaller file)

## Manual Setup

If the automatic download doesn't work, you can manually download the files from:
- https://github.com/jpatokal/openflights/blob/master/data/airlines.dat
- https://github.com/jpatokal/openflights/blob/master/data/airports.dat  
- https://github.com/jpatokal/openflights/blob/master/data/routes.dat

Save them in `src/data/openflights/` and run `npx tsx loader.ts`.

## Using the Data

Once set up, the FlightTracker component will automatically use this data for:

1. **Instant Airline Identification** - Maps flight callsigns to airline names without API calls
2. **Airport Information** - Provides airport names, cities, countries, and timezones
3. **Route Prediction** - Can show typical routes between airports

## Benefits

- **Performance**: Local lookups are instant (no API latency)
- **Reliability**: No dependency on external services
- **Coverage**: 6,000+ airlines and 10,000+ airports
- **Offline Support**: Works without internet connection

## Updating the Data

OpenFlights data is updated periodically. To get the latest data, simply re-run the download and processing steps.

## Troubleshooting

If you get import errors, make sure the JSON import is properly configured in your TypeScript config:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

For the service to work without the data files, it will gracefully fall back to the existing HexDB API.