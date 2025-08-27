import type { CollectionConfig } from 'payload'

export const TravelAdvisories: CollectionConfig = {
  slug: 'travel-advisories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'threatLevel', 'pubDate', 'countryTag'],
    group: 'Travel Safety',
  },
  indexes: [
    { fields: ['country'] },
    { fields: ['countryTag'] },
    { fields: ['threatLevel'] },
    { fields: ['category'] },
    { fields: ['isActive'] },
    { fields: ['pubDate'] },
    // Compound indexes for common queries
    { fields: ['country', 'isActive'] },
    { fields: ['threatLevel', 'isActive'] },
    { fields: ['pubDate', 'isActive'] },
  ],
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'pubDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'link',
      type: 'text',
      admin: {
        description: 'Link to official advisory source',
      },
    },
    {
      name: 'threatLevel',
      type: 'select',
      options: [
        { label: 'Exercise Normal Precautions', value: '1' },
        { label: 'Exercise Increased Caution', value: '2' },
        { label: 'Reconsider Travel', value: '3' },
        { label: 'Do Not Travel', value: '4' },
      ],
      required: true,
    },
    {
      name: 'countryTag',
      type: 'text',
      index: true,
      admin: {
        description: 'Country name extracted from the advisory',
      },
    },
    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      index: true,
      admin: {
        description: 'Link to country in our system',
      },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Advisory', value: 'advisory' },
        { label: 'Alert', value: 'alert' },
        { label: 'Warning', value: 'warning' },
      ],
      defaultValue: 'advisory',
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Summary of the advisory',
      },
    },
    {
      name: 'regions',
      type: 'array',
      fields: [
        {
          name: 'region',
          type: 'text',
        },
        {
          name: 'level',
          type: 'select',
          options: [
            { label: 'Exercise Normal Precautions', value: '1' },
            { label: 'Exercise Increased Caution', value: '2' },
            { label: 'Reconsider Travel', value: '3' },
            { label: 'Do Not Travel', value: '4' },
          ],
        },
      ],
      admin: {
        description: 'Regional threat levels within the country',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this advisory is currently active',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Try to match countryTag to a country in our system
        if (data.countryTag && !data.country) {
          const payload = req.payload
          const countries = await payload.find({
            collection: 'countries',
            where: {
              name: {
                equals: data.countryTag,
              },
            },
            limit: 1,
          })
          if (countries.docs.length > 0 && countries.docs[0]) {
            data.country = countries.docs[0].id
          }
        }
        return data
      },
    ],
  },
}