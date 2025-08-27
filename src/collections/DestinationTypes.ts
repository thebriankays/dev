import type { CollectionConfig } from 'payload'

export const DestinationTypes: CollectionConfig = {
  slug: 'destination-types',
  admin: {
    useAsTitle: 'name',
    group: 'Destinations',
  },
  indexes: [
    { fields: ['name'] },
    { fields: ['slug'], unique: true },
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'characteristics',
      type: 'array',
      fields: [
        {
          name: 'characteristic',
          type: 'text',
        },
      ],
      admin: {
        description: 'Key characteristics of this destination type',
      },
    },
    {
      name: 'typicalActivities',
      type: 'array',
      fields: [
        {
          name: 'activity',
          type: 'text',
        },
      ],
    },
    {
      name: 'averageBudgetRange',
      type: 'group',
      fields: [
        {
          name: 'min',
          type: 'number',
        },
        {
          name: 'max',
          type: 'number',
        },
        {
          name: 'currency',
          type: 'relationship',
          relationTo: 'currencies',
        },
        {
          name: 'period',
          type: 'select',
          options: [
            { label: 'Per Day', value: 'per-day' },
            { label: 'Per Week', value: 'per-week' },
            { label: 'Per Trip', value: 'per-trip' },
          ],
        },
      ],
    },
  ],
}