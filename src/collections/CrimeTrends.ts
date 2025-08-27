import type { CollectionConfig } from 'payload'

export const CrimeTrends: CollectionConfig = {
  slug: 'crime-trends',
  labels: {
    singular: 'Crime Trend',
    plural: 'Crime Trends',
  },
  admin: {
    useAsTitle: 'indicator',
    defaultColumns: ['country', 'indicator', 'changePercent', 'trend'],
    group: 'Data Source',
  },
  fields: [
    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      required: true,
    },
    {
      name: 'indicator',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Criminal Markets', value: 'markets' },
        { label: 'Criminal Actors', value: 'actors' },
        { label: 'Resilience', value: 'resilience' },
      ],
    },
    {
      name: 'previousScore',
      type: 'number',
      required: true,
      min: 0,
      max: 10,
      admin: {
        step: 0.01,
      },
    },
    {
      name: 'currentScore',
      type: 'number',
      required: true,
      min: 0,
      max: 10,
      admin: {
        step: 0.01,
      },
    },
    {
      name: 'changePercent',
      type: 'number',
      required: true,
      admin: {
        step: 0.01,
      },
    },
    {
      name: 'trend',
      type: 'select',
      required: true,
      options: [
        { label: 'Increasing', value: 'increasing' },
        { label: 'Decreasing', value: 'decreasing' },
        { label: 'Stable', value: 'stable' },
      ],
    },
    {
      name: 'year',
      type: 'number',
      required: true,
    },
  ],
  indexes: [
    {
      fields: ['country', 'indicator', 'year'],
      unique: true,
    },
  ],
}