import type { CollectionConfig } from 'payload'

export const CountryReligions: CollectionConfig = {
  slug: 'country-religions',
  labels: {
    singular: 'Country Religion',
    plural: 'Country Religions',
  },
  admin: {
    useAsTitle: 'religion',
    group: 'Location Data',
    defaultColumns: ['country', 'religion', 'percentage'],
  },
  fields: [
    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      required: true,
      admin: {
        description: 'Country',
      },
    },
    {
      name: 'religion',
      type: 'relationship',
      relationTo: 'religions',
      required: true,
      admin: {
        description: 'Religion',
      },
    },
    {
      name: 'percentage',
      type: 'number',
      required: true,
      admin: {
        description: 'Percentage of population',
        step: 0.1,
      },
    },
    {
      name: 'year',
      type: 'number',
      admin: {
        description: 'Census/survey year',
      },
    },
    {
      name: 'notes',
      type: 'text',
      admin: {
        description: 'Additional notes',
      },
    },
  ],
  indexes: [
    {
      fields: ['country', 'religion'],
      unique: true,
    },
  ],
}