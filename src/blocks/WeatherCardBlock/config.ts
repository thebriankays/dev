import type { Block } from 'payload'

export const WeatherCardBlock: Block = {
  slug: 'weatherCardBlock',
  labels: {
    singular: 'Weather Card Block',
    plural: 'Weather Card Blocks',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      defaultValue: 'Weather Forecast',
    },
    {
      name: 'location',
      type: 'text',
      label: 'Location Name',
      admin: {
        description: 'Display name for the location (e.g., "New York, NY")',
      },
    },
    {
      name: 'city',
      type: 'text',
      label: 'City',
      admin: {
        description: 'City name for weather data',
      },
    },
    {
      name: 'lat',
      type: 'number',
      label: 'Latitude',
      admin: {
        description: 'Latitude for weather data (leave empty to use mock data)',
      },
    },
    {
      name: 'lng',
      type: 'number', 
      label: 'Longitude',
      admin: {
        description: 'Longitude for weather data (leave empty to use mock data)',
      },
    },
    {
      name: 'useMockData',
      type: 'checkbox',
      label: 'Use Mock Data',
      defaultValue: false,
      admin: {
        description: 'Use mock weather data instead of API (for testing)',
      },
    },
  ],
}