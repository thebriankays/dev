import type { CollectionConfig } from 'payload'

export const Routes: CollectionConfig = {
  slug: 'routes',
  admin: {
    useAsTitle: 'routeCode',
    group: 'Data Source',
    description: 'Flight routes between airports',
    defaultColumns: ['airline', 'sourceAirport', 'destinationAirport', 'codeshare', 'stops'],
  },
  fields: [
    {
      name: 'routeCode',
      type: 'text',
      admin: {
        description: 'Auto-generated route code (e.g., AA-LAX-JFK)',
        readOnly: true,
      },
    },
    {
      name: 'airline',
      type: 'relationship',
      relationTo: 'airlines' as any,
      admin: {
        description: 'Airline operating this route',
      },
    },
    {
      name: 'airline_code',
      type: 'text',
      admin: {
        description: 'Airline code (IATA or ICAO)',
      },
      index: true,
    },
    {
      name: 'sourceAirport',
      type: 'relationship',
      relationTo: 'airports',
      admin: {
        description: 'Departure airport',
      },
    },
    {
      name: 'source_airport_code',
      type: 'text',
      admin: {
        description: 'Source airport code (IATA or ICAO)',
      },
      index: true,
    },
    {
      name: 'destinationAirport',
      type: 'relationship',
      relationTo: 'airports',
      admin: {
        description: 'Arrival airport',
      },
    },
    {
      name: 'destination_airport_code',
      type: 'text',
      admin: {
        description: 'Destination airport code (IATA or ICAO)',
      },
      index: true,
    },
    {
      name: 'codeshare',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this is a codeshare flight',
      },
    },
    {
      name: 'stops',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of stops (0 for direct flights)',
      },
    },
    {
      name: 'equipment',
      type: 'array',
      fields: [
        {
          name: 'aircraft',
          type: 'text',
          admin: {
            description: 'Aircraft type code (e.g., 737, A320)',
          },
        },
      ],
      admin: {
        description: 'Aircraft types used on this route',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-generate route code
        if (data.airline_code && data.source_airport_code && data.destination_airport_code) {
          data.routeCode = `${data.airline_code}-${data.source_airport_code}-${data.destination_airport_code}`
        }
        return data
      },
    ],
  },
  indexes: [
    {
      fields: ['airline_code', 'source_airport_code', 'destination_airport_code'],
    },
    {
      fields: ['source_airport_code'],
    },
    {
      fields: ['destination_airport_code'],
    },
  ],
}