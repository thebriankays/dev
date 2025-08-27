import type { CollectionConfig } from 'payload'

export const Airlines: CollectionConfig = {
  slug: 'airlines',
  admin: {
    useAsTitle: 'name',
    group: 'Data Source',
    description: 'Airline data with IATA/ICAO codes and callsigns',
    defaultColumns: ['name', 'iata', 'icao', 'callsign', 'country', 'active'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the airline',
      },
    },
    {
      name: 'alias',
      type: 'text',
      admin: {
        description: 'Alternative name or alias',
      },
    },
    {
      name: 'iata',
      type: 'text',
      maxLength: 2,
      admin: {
        description: 'IATA code (2-letter code)',
      },
      index: true,
    },
    {
      name: 'icao',
      type: 'text',
      maxLength: 3,
      admin: {
        description: 'ICAO code (3-letter code)',
      },
      index: true,
    },
    {
      name: 'callsign',
      type: 'text',
      admin: {
        description: 'Radio callsign used by pilots',
      },
      index: true,
    },
    {
      name: 'country',
      type: 'text',
      required: true,
      admin: {
        description: 'Country where the airline is based',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether the airline is currently active',
      },
    },
    {
      name: 'openflights_id',
      type: 'number',
      admin: {
        description: 'OpenFlights database ID',
        readOnly: true,
      },
      index: true,
    },
  ],
  indexes: [
    {
      fields: ['iata'],
    },
    {
      fields: ['icao'],
    },
    {
      fields: ['callsign'],
    },
  ],
}