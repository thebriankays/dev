import type { CollectionConfig } from 'payload'

export const FlightCache: CollectionConfig = {
  slug: 'flight-cache',
  admin: {
    useAsTitle: 'flightCode',
    group: 'System',
    description: 'Cache for flight data from various sources',
    defaultColumns: ['flightCode', 'source', 'airline', 'aircraft', 'lastUpdated'],
    hidden: true, // Hide from admin UI as it's system-managed
  },
  indexes: [
    {
      fields: ['flightCode', 'source'],
      unique: true,
    },
  ],
  fields: [
    {
      name: 'flightCode',
      type: 'text',
      required: true,
      admin: {
        description: 'Flight code/callsign',
      },
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'flightaware',
      options: [
        { label: 'FlightAware', value: 'flightaware' },
        { label: 'FlightStats', value: 'flightstats' },
      ],
      admin: {
        description: 'Data source',
      },
    },
    {
      name: 'airline',
      type: 'text',
      admin: {
        description: 'Airline name',
      },
    },
    {
      name: 'aircraft',
      type: 'text',
      admin: {
        description: 'Aircraft type',
      },
    },
    {
      name: 'registration',
      type: 'text',
      admin: {
        description: 'Aircraft registration',
      },
    },
    {
      name: 'departureAirport',
      type: 'text',
      admin: {
        description: 'Departure airport',
      },
    },
    {
      name: 'departureAirportCode',
      type: 'text',
      admin: {
        description: 'Departure airport IATA/ICAO code',
      },
    },
    {
      name: 'arrivalAirport',
      type: 'text',
      admin: {
        description: 'Arrival airport',
      },
    },
    {
      name: 'arrivalAirportCode',
      type: 'text',
      admin: {
        description: 'Arrival airport IATA/ICAO code',
      },
    },
    {
      name: 'departureGate',
      type: 'text',
      admin: {
        description: 'Departure gate',
      },
    },
    {
      name: 'arrivalGate',
      type: 'text',
      admin: {
        description: 'Arrival gate',
      },
    },
    {
      name: 'departureTerminal',
      type: 'text',
      admin: {
        description: 'Departure terminal',
      },
    },
    {
      name: 'arrivalTerminal',
      type: 'text',
      admin: {
        description: 'Arrival terminal',
      },
    },
    {
      name: 'baggage',
      type: 'text',
      admin: {
        description: 'Baggage claim',
      },
    },
    {
      name: 'status',
      type: 'text',
      admin: {
        description: 'Flight status',
      },
    },
    {
      name: 'distance',
      type: 'number',
      admin: {
        description: 'Flight distance in miles',
      },
    },
    {
      name: 'duration',
      type: 'json',
      admin: {
        description: 'Flight duration',
      },
    },
    {
      name: 'route',
      type: 'text',
      admin: {
        description: 'Flight route',
      },
    },
    {
      name: 'altitude',
      type: 'number',
      admin: {
        description: 'Flight altitude',
      },
    },
    {
      name: 'speed',
      type: 'number',
      admin: {
        description: 'Flight speed',
      },
    },
    {
      name: 'elapsedTime',
      type: 'text',
      admin: {
        description: 'Time elapsed',
      },
    },
    {
      name: 'remainingTime',
      type: 'text',
      admin: {
        description: 'Time remaining',
      },
    },
    {
      name: 'gateDepartureTime',
      type: 'text',
      admin: {
        description: 'Gate departure time',
      },
    },
    {
      name: 'gateArrivalTime',
      type: 'text',
      admin: {
        description: 'Gate arrival time',
      },
    },
    {
      name: 'takeoffTime',
      type: 'text',
      admin: {
        description: 'Takeoff time',
      },
    },
    {
      name: 'landingTime',
      type: 'text',
      admin: {
        description: 'Landing time',
      },
    },
    {
      name: 'scheduledDepartureTime',
      type: 'text',
      admin: {
        description: 'Scheduled departure time',
      },
    },
    {
      name: 'scheduledArrivalTime',
      type: 'text',
      admin: {
        description: 'Scheduled arrival time',
      },
    },
    {
      name: 'taxiOut',
      type: 'text',
      admin: {
        description: 'Taxi out time',
      },
    },
    {
      name: 'taxiIn',
      type: 'text',
      admin: {
        description: 'Taxi in time',
      },
    },
    {
      name: 'averageDelay',
      type: 'text',
      admin: {
        description: 'Average delay',
      },
    },
    {
      name: 'airlineLogoUrl',
      type: 'text',
      admin: {
        description: 'Airline logo URL',
      },
    },
    {
      name: 'friendlyFlightIdentifier',
      type: 'text',
      admin: {
        description: 'Friendly flight identifier',
      },
    },
    {
      name: 'callsign',
      type: 'text',
      admin: {
        description: 'Flight callsign',
      },
    },
    {
      name: 'iataCode',
      type: 'text',
      admin: {
        description: 'IATA code',
      },
    },
    {
      name: 'departureCity',
      type: 'text',
      admin: {
        description: 'Departure city',
      },
    },
    {
      name: 'departureState',
      type: 'text',
      admin: {
        description: 'Departure state',
      },
    },
    {
      name: 'arrivalCity',
      type: 'text',
      admin: {
        description: 'Arrival city',
      },
    },
    {
      name: 'arrivalState',
      type: 'text',
      admin: {
        description: 'Arrival state',
      },
    },
    {
      name: 'flightProgressStatus',
      type: 'text',
      admin: {
        description: 'Flight progress status',
      },
    },
    {
      name: 'flightProgressTimeRemaining',
      type: 'text',
      admin: {
        description: 'Flight progress time remaining',
      },
    },
    {
      name: 'totalTravelTime',
      type: 'text',
      admin: {
        description: 'Total travel time',
      },
    },
    {
      name: 'flownDistance',
      type: 'number',
      admin: {
        description: 'Distance flown',
      },
    },
    {
      name: 'remainingDistanceScraped',
      type: 'number',
      admin: {
        description: 'Remaining distance',
      },
    },
    {
      name: 'plannedSpeed',
      type: 'number',
      admin: {
        description: 'Planned speed',
      },
    },
    {
      name: 'plannedAltitude',
      type: 'number',
      admin: {
        description: 'Planned altitude',
      },
    },
    {
      name: 'airlineIata',
      type: 'text',
      admin: {
        description: 'Airline IATA code',
      },
    },
    {
      name: 'airlineIcao',
      type: 'text',
      admin: {
        description: 'Airline ICAO code',
      },
    },
    {
      name: 'departureCountry',
      type: 'text',
      admin: {
        description: 'Departure country',
      },
    },
    {
      name: 'arrivalCountry',
      type: 'text',
      admin: {
        description: 'Arrival country',
      },
    },
    {
      name: 'statusCode',
      type: 'text',
      admin: {
        description: 'Status code',
      },
    },
    {
      name: 'aircraftIata',
      type: 'text',
      admin: {
        description: 'Aircraft IATA code',
      },
    },
    // Smart calculation fields
    {
      name: 'calculatedDistance',
      type: 'number',
      admin: {
        description: 'Calculated great circle distance in miles',
      },
    },
    {
      name: 'calculatedDuration',
      type: 'text',
      admin: {
        description: 'Calculated flight duration (e.g., 2h 30m)',
      },
    },
    {
      name: 'flightPath',
      type: 'json',
      admin: {
        description: 'Calculated great circle flight path coordinates',
      },
    },
    {
      name: 'calculatedHeading',
      type: 'number',
      admin: {
        description: 'Calculated initial heading in degrees',
      },
    },
    {
      name: 'estimatedCruiseAltitude',
      type: 'number',
      admin: {
        description: 'Estimated cruise altitude based on distance and direction',
      },
    },
    {
      name: 'rawData',
      type: 'json',
      required: true,
      admin: {
        description: 'Complete flight data from source',
      },
    },
    {
      name: 'lastUpdated',
      type: 'date',
      admin: {
        description: 'Last update timestamp',
      },
    },
    {
      name: 'cacheExpiry',
      type: 'date',
      required: true,
      admin: {
        description: 'Cache expiration time',
      },
    },
  ],
}