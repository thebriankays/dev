import type { CollectionConfig } from 'payload'

export const Countries: CollectionConfig = {
  slug: 'countries',
  admin: {
    useAsTitle: 'name',
    group: 'Location Data',
    defaultColumns: ['name', 'code', 'continent', 'region'],
    listSearchableFields: ['name', 'code', 'code3', 'region', 'subregion'],
  },
  fields: [
    // Basic Identity
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true, // Add index for name lookups
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true, // Add index for code lookups
      admin: { description: 'ISO-3166-1 alpha-2 (US, FR, etc.)' },
    },
    {
      name: 'code3',
      type: 'text',
      unique: true,
      admin: { description: 'ISO-3166-1 alpha-3 (USA, FRA, etc.)' },
    },
    {
      name: 'isoCode',
      type: 'text',
      admin: { description: 'ISO-3166-1 numeric (840, etc.)' },
    },

    // Geography
    {
      name: 'continent',
      type: 'select',
      required: true,
      options: [
        { label: 'Africa', value: 'africa' },
        { label: 'Antarctica', value: 'antarctica' },
        { label: 'Asia', value: 'asia' },
        { label: 'Europe', value: 'europe' },
        { label: 'North America', value: 'north-america' },
        { label: 'Oceania / Australia', value: 'oceania-australia' },
        { label: 'South America', value: 'south-america' },
      ],
    },
    {
      name: 'region',
      type: 'text',
      admin: { description: 'Geographic region within continent' },
    },
    {
      name: 'subregion',
      type: 'text',
    },
    {
      name: 'capital',
      type: 'text',
    },

    // Flag & Web
    {
      name: 'flag',
      type: 'text',
      admin: { description: 'Filename in /public/flags (auto-set from code)' },
      hooks: {
        beforeChange: [
          ({ value, data }) => (!value && data?.code ? `${data.code.toLowerCase()}.svg` : value),
        ],
      },
    },
    {
      name: 'webDomain',
      type: 'text',
      admin: { description: 'Primary country-code domain (.fr, .us, etc.)' },
    },

    // Communication
    {
      name: 'dialingCode',
      type: 'text',
      admin: { description: 'International dialing code (+1, +33, etc.)' },
    },
    {
      name: 'demonym',
      type: 'text',
      admin: { description: 'What to call people from this country (American, French, etc.)' },
    },

    // Relations
    {
      name: 'languages',
      type: 'relationship',
      relationTo: 'languages',
      hasMany: true,
      admin: {
        description: 'Official and commonly spoken languages',
      },
    },
    {
      name: 'religions',
      type: 'array',
      fields: [
        {
          name: 'religion',
          type: 'relationship',
          relationTo: 'religions',
          required: true,
        },
        {
          name: 'percentage',
          type: 'number',
          admin: {
            description: 'Percentage of population',
            step: 0.1,
          },
        },
      ],
      admin: {
        description: 'Religions practiced in the country with percentages',
      },
    },
    {
      name: 'timezones',
      type: 'relationship',
      relationTo: 'timezones',
      hasMany: true,
    },
    {
      name: 'currencies',
      type: 'relationship',
      relationTo: 'currencies',
      hasMany: true,
    },
    {
      name: 'neighboringCountries',
      type: 'relationship',
      relationTo: 'countries',
      hasMany: true,
      admin: {
        description: 'Countries that share a land border',
      },
    },
  ],
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['code3'], unique: true },
    { fields: ['name'], unique: true },
    { fields: ['continent'] },
    { fields: ['region'] },
    { fields: ['capital'] },
    { fields: ['subregion'] },
  ],
  hooks: {
    afterRead: [
      async ({ doc, req }) => {
        // Add computed fields for related data counts
        if (doc && doc.id) {
          try {
            const [airports, restaurants, advisories, crime] = await Promise.all([
              req.payload.count({
                collection: 'airports',
                where: { country: { equals: doc.id } },
              }),
              req.payload.count({
                collection: 'michelin-restaurants',
                where: { country: { equals: doc.id } },
              }),
              req.payload.count({
                collection: 'travel-advisories',
                where: { country: { equals: doc.id } },
              }),
              req.payload.count({
                collection: 'crime-index-scores',
                where: { country: { equals: doc.id } },
              }),
            ])

            return {
              ...doc,
              relatedCounts: {
                airports: airports.totalDocs,
                restaurants: restaurants.totalDocs,
                advisories: advisories.totalDocs,
                crimeData: crime.totalDocs,
                media: 0, // Will be updated when collection is available
                hasDetails: false, // Will be updated when collection is available
              },
            }
          } catch (error) {
            // If any collection doesn't exist yet, just return the doc
            return doc
          }
        }
        return doc
      },
    ],
  },
}