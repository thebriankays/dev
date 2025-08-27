import type { CollectionConfig } from 'payload'

export const Airports: CollectionConfig = {
  slug: 'airports',
  admin: {
    useAsTitle: 'name',
    group: 'Data Source',
    description: 'Airport data with IATA/ICAO codes and location information',
    defaultColumns: ['name', 'iata', 'icao', 'city', 'country', 'type'],
  },
  indexes: [
    // Single field indexes for common lookups
    { fields: ['iata'], unique: true },
    { fields: ['icao'], unique: true },
    { fields: ['city'] },
    { fields: ['country'] },
    { fields: ['type'] },
    // Compound indexes for common query patterns
    { fields: ['country', 'city'] },
    { fields: ['country', 'type'] },
    // Geospatial queries
    { fields: ['latitude', 'longitude'] },
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the airport',
      },
    },
    {
      name: 'iata',
      type: 'text',
      required: false,
      unique: true,
      maxLength: 3,
      index: true,
      admin: {
        description: 'IATA code (3-letter code)',
      },
    },
    {
      name: 'icao',
      type: 'text',
      required: false,
      unique: true,
      maxLength: 4,
      index: true,
      admin: {
        description: 'ICAO code (4-letter code)',
      },
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'City served by the airport',
      },
    },
    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      required: true,
      index: true,
      admin: {
        description: 'Country where the airport is located',
      },
    },
    {
      name: 'region',
      type: 'relationship',
      relationTo: 'regions',
      admin: {
        description: 'State/Province/Region where the airport is located',
      },
    },
    {
      name: 'latitude',
      type: 'number',
      required: true,
      admin: {
        description: 'Latitude coordinate',
      },
    },
    {
      name: 'longitude',
      type: 'number',
      required: true,
      admin: {
        description: 'Longitude coordinate',
      },
    },
    {
      name: 'elevation',
      type: 'number',
      admin: {
        description: 'Elevation in feet above sea level',
      },
    },
    {
      name: 'timezone',
      type: 'relationship',
      relationTo: 'timezones',
      required: false,
      admin: {
        description: 'Timezone of the airport',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Large Airport', value: 'large' },
        { label: 'Medium Airport', value: 'medium' },
        { label: 'Small Airport', value: 'small' },
        { label: 'Heliport', value: 'heliport' },
        { label: 'Seaplane Base', value: 'seaplane' },
        { label: 'Closed', value: 'closed' },
      ],
      defaultValue: 'medium',
      admin: {
        description: 'Type/size of the airport',
      },
    },
    {
      name: 'openflights_id',
      type: 'number',
      admin: {
        description: 'OpenFlights database ID for data mapping',
        hidden: true,
      },
    },
  ],
}