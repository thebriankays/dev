import type { CollectionConfig } from 'payload'
// import { glassCollectionComponents } from '@/components/admin/collectionOverrides'

import { slugField } from '@/fields/slug'
import { revalidateDestination, revalidateDelete } from './hooks/revalidateDestination'
import { ensureCoordinates } from './hooks/ensureCoordinates'
import { populateAuthors } from '../Posts/hooks/populateAuthors'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { googlePlaces } from '@/fields/GooglePlaces/GooglePlaces'
import { populateVirtualFields } from './hooks/populateVirtualFields'
import { optimizedDestinationHooks } from './hooks/optimizedHooks'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { populateMissingLocationData } from './hooks/populateMissingLocationData'
//import { splashHero } from '@/heros/splash/config'

export const Destinations: CollectionConfig = {
  slug: 'destinations',

  access: { create: () => true, read: () => true, update: () => true, delete: () => true },

  // Ensure relationships are populated in queries
  defaultSort: '-createdAt',

  // Database indexes for performance
  indexes: [
    // Single field indexes are defined on fields directly
    // Compound indexes for common query patterns
    {
      fields: ['countryRelation', 'city'],
    },
    {
      fields: ['continent', 'createdAt'],
    },
  ],

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'flagSvg', 'country', 'continent', 'updatedAt'],
    // Force population of relationships in list view
    listSearchableFields: ['title', 'city', 'countryRelation.name'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: typeof data?.slug === 'string' ? data.slug : '',
          collection: 'destinations',
          req,
        }),
    },
    components: {
      // ...glassCollectionComponents,
      beforeListTable: ['@/components/BulkAddButton/BulkAddButton'],
      views: {
        edit: {
          exploreMap: {
            Component: '@/components/admin/ExploreView',
            path: '/explore',
            tab: {
              label: 'Explore 3D Map',
              order: 200,
            },
          },
        },
      },
    },
  },
  defaultPopulate: {
    slug: true,
    featuredVideo: true,
    featuredImage: true,
    title: true,
    flagSvg: true,
    // Populate country relationship with its fields but avoid deep nesting
    countryRelation: {
      name: true,
      code: true,
      code3: true,
      capital: true,
      flag: true,
      continent: true,
      // Don't populate nested relationships to avoid circular refs
      // currencies, languages, and neighboringCountries are excluded
    },
    // Populate currency relationship
    currencyRelation: {
      name: true,
      code: true,
      symbol: true,
    },
    // Populate languages relationship
    languagesRelation: {
      name: true,
      code: true,
      nativeName: true,
    },
  },
  fields: [
    {
      name: 'flag',
      type: 'ui',
      admin: {
        disableListColumn: true,
        components: {
          Cell: '@/components/BulkAddButton/FlagCell',
        },
      },
    },
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        // {
        //   fields: [splashHero],
        //   label: 'Hero',
        // },
        {
          fields: [
            googlePlaces({
              name: 'locationData',
              label: 'Location',
              admin: {
                description: 'Search for a location using Google Places',
                hidden: true,
                disableListColumn: true,
              },
              useExtended: true, // Ensure Extended Component Library is used
            }),
            {
              name: 'lat',
              type: 'number',
              admin: { readOnly: true, position: 'sidebar' },
              hooks: {
                afterRead: [
                  ({ siblingData }) => siblingData?.locationData?.coordinates?.lat ?? null,
                ],
              },
            },
            {
              name: 'lng',
              type: 'number',
              admin: { readOnly: true, position: 'sidebar' },
              hooks: {
                afterRead: [
                  ({ siblingData }) => siblingData?.locationData?.coordinates?.lng ?? null,
                ],
              },
            },

            {
              name: 'continent',
              type: 'select',
              required: true,
              index: true, // Add index for continent filtering
              options: [
                'Africa',
                'Asia',
                'Europe',
                'North America',
                'Oceania',
                'South America',
                'Antarctica',
              ],
            },

            { name: 'city', type: 'text', label: 'City', index: true },
            { name: 'state', type: 'text', label: 'State/Province', index: true },
            {
              name: 'googleMapsUri',
              type: 'text',
              label: 'Google Maps URL',
              admin: { readOnly: true },
            },

            // New relationship fields
            {
              name: 'countryRelation',
              type: 'relationship',
              relationTo: 'countries',
              label: 'Country',
              index: true, // Add index for country queries
              admin: {
                position: 'sidebar',
              },
            },

            {
              name: 'currencyRelation',
              type: 'relationship',
              relationTo: 'currencies',
              label: 'Currency',
              admin: {
                position: 'sidebar',
              },
            },

            {
              name: 'languagesRelation',
              type: 'relationship',
              relationTo: 'languages',
              hasMany: true,
              label: 'Languages',
              admin: {
                position: 'sidebar',
              },
            },

            {
              name: 'regionRelation',
              type: 'relationship',
              relationTo: 'regions',
              label: 'Region/State',
              admin: {
                position: 'sidebar',
              },
              filterOptions: (props) => {
                const { siblingData } = props
                // Filter regions based on selected country
                if ((siblingData as any)?.countryRelation) {
                  return {
                    country: { equals: (siblingData as any).countryRelation },
                  }
                }
                return false // Hide all regions if no country selected
              },
            },

            // Virtual fields for backward compatibility
            {
              name: 'country',
              type: 'text',
              label: 'Country',
              admin: {
                readOnly: true,
                hidden: true, // Hide this field since we show countryRelation
                components: {
                  Cell: '@/components/BulkAddButton/CountryCell',
                },
              },
              hooks: {
                afterRead: [
                  ({ data }) => {
                    // Return the country name from the relationship
                    const docData = data as any
                    if (docData?.countryRelation && typeof docData.countryRelation === 'object') {
                      return docData.countryRelation.name || ''
                    }
                    // Fallback to countryData if relationship not populated
                    if (docData?.countryData?.label) {
                      return docData.countryData.label
                    }
                    return ''
                  },
                ],
              },
            },

            {
              name: 'flagSvg',
              type: 'text',
              label: '',
              admin: {
                description: 'Country flag SVG file',
                placeholder: 'us',
                components: {
                  Cell: '@/components/BulkAddButton/FlagCell',
                },
              },
              hooks: {
                afterRead: [
                  ({ data }) => {
                    // Return the flag from the country relationship
                    const docData = data as any
                    if (docData?.countryRelation && typeof docData.countryRelation === 'object') {
                      return docData.countryRelation.flag || ''
                    }
                    // Fallback to countryData if relationship not populated
                    if (docData?.countryData?.flag) {
                      return docData.countryData.flag
                    }
                    return ''
                  },
                ],
              },
            },

            // Virtual field for languages display
            {
              name: 'languages',
              type: 'text',
              label: 'Languages',
              admin: {
                readOnly: true,
                hidden: true, // Hide this since we have languagesRelation
                components: {
                  Cell: '@/components/BulkAddButton/LanguagesCell',
                },
              },
              hooks: {
                afterRead: [
                  ({ data }) => {
                    // Return languages as a comma-separated string
                    if (data?.languagesRelation && Array.isArray(data.languagesRelation)) {
                      const langs = data.languagesRelation
                        .map((lang) => (typeof lang === 'object' ? lang.name : ''))
                        .filter(Boolean)
                      return langs.join(', ')
                    }
                    return ''
                  },
                ],
              },
            },

            // Legacy countryData group - now virtual fields linking to relationships
            {
              name: 'countryData',
              type: 'group',
              virtual: true,
              admin: {
                hidden: true, // Hide from admin UI since it's now virtual
              },
              fields: [
                { name: 'label', type: 'text', virtual: 'countryRelation.name' },
                { name: 'code', type: 'text', virtual: 'countryRelation.code' },
                { name: 'capital', type: 'text', virtual: 'countryRelation.capital' },
                { name: 'region', type: 'text', virtual: 'countryRelation.continent' },
                {
                  name: 'currency',
                  type: 'group',
                  fields: [
                    { name: 'code', type: 'text', virtual: 'currencyRelation.code' },
                    { name: 'label', type: 'text', virtual: 'currencyRelation.name' },
                    { name: 'symbol', type: 'text', virtual: 'currencyRelation.symbol' },
                  ],
                },
                {
                  name: 'language',
                  type: 'group',
                  fields: [
                    { name: 'code', type: 'text', virtual: 'languagesRelation.0.code' },
                    { name: 'label', type: 'text', virtual: 'languagesRelation.0.name' },
                    { name: 'nativeName', type: 'text', virtual: 'languagesRelation.0.nativeName' },
                  ],
                },
                { name: 'flag', type: 'text', virtual: 'countryRelation.flag' },
              ],
            },

            { name: 'isGoodForChildren', type: 'checkbox', label: 'Good For Children' },
            { name: 'isGoodForGroups', type: 'checkbox', label: 'Good For Groups' },
            { name: 'priceLevel', type: 'number', label: 'Price Level' },
            { name: 'rating', type: 'number', label: 'Rating' },
            { name: 'user_ratings_total', type: 'number', label: 'Ratings Count' },

            {
              name: 'reviews',
              type: 'array',
              fields: [
                { name: 'author_name', type: 'text', label: 'Author Name' },
                { name: 'rating', type: 'number', label: 'Rating' },
                { name: 'text', type: 'textarea', label: 'Review Text' },
              ],
            },

            { name: 'featuredImage', type: 'upload', relationTo: 'media' },
            { name: 'featuredVideo', type: 'upload', relationTo: 'media' },
            { name: 'mediaGallery', type: 'upload', relationTo: 'media', hasMany: true },
            {
              name: 'content',
              type: 'richText',
              required: true,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => [
                  ...rootFeatures,
                  HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  BlocksFeature({
                    blocks: [Banner, Code, MediaBlock],
                  }),
                  FixedToolbarFeature(),
                  InlineToolbarFeature(),
                  HorizontalRuleFeature(),
                ],
              }),
            },
            {
              name: 'relatedDestinations',
              type: 'relationship',
              relationTo: 'destinations',
              hasMany: true,
              admin: { position: 'sidebar' },
              filterOptions: ({ id }) => ({ id: { not_in: [id] } }),
            },
            {
              name: 'authors',
              type: 'relationship',
              relationTo: 'users',
              hasMany: true,
              admin: { position: 'sidebar' },
            },
            {
              name: 'populatedAuthors',
              type: 'array',
              access: { update: () => false },
              admin: { disabled: true, readOnly: true },
              fields: [
                { name: 'id', type: 'text' },
                { name: 'name', type: 'text' },
              ],
            },
            // 3D Map Configuration
            {
              name: 'enable3DMap',
              type: 'checkbox',
              label: 'Enable 3D Area Explorer',
              defaultValue: false,
              admin: {
                position: 'sidebar',
                description: 'Show photorealistic 3D map view',
              },
            },

            {
              name: 'areaExplorerConfig',
              type: 'group',
              label: '3D Map Configuration',
              admin: {
                condition: (data, siblingData) => siblingData?.enable3DMap,
              },
              fields: [
                {
                  name: 'showPOIs',
                  type: 'checkbox',
                  label: 'Show Nearby Points of Interest',
                  defaultValue: true,
                },
                {
                  name: 'poiTypes',
                  type: 'select',
                  label: 'POI Types to Display',
                  hasMany: true,
                  defaultValue: [
                    'restaurant',
                    'bar',
                    'cafe',
                    'tourist_attraction',
                    'lodging',
                    'airport',
                    'train_station',
                    'bus_station',
                    'park',
                  ],
                  options: [
                    { label: 'Restaurant', value: 'restaurant' },
                    { label: 'Bar', value: 'bar' },
                    { label: 'Cafe', value: 'cafe' },
                    { label: 'Store', value: 'store' },
                    { label: 'Supermarket', value: 'supermarket' },
                    { label: 'Park', value: 'park' },
                    { label: 'Bank', value: 'bank' },
                    { label: 'School', value: 'school' },
                    { label: 'Bus Station', value: 'bus_station' },
                    { label: 'Train Station', value: 'train_station' },
                    { label: 'Airport', value: 'airport' },
                    { label: 'Parking', value: 'parking' },
                    { label: 'Lodging', value: 'lodging' },
                    { label: 'Tourist Attraction', value: 'tourist_attraction' },
                  ],
                  admin: {
                    condition: (data, siblingData) => siblingData?.showPOIs,
                  },
                },
                {
                  name: 'poiDensity',
                  type: 'number',
                  label: 'POI Density',
                  defaultValue: 30,
                  min: 10,
                  max: 50,
                  admin: {
                    description: 'Maximum number of POIs to display',
                    condition: (data, siblingData) => siblingData?.showPOIs,
                  },
                },
                {
                  name: 'searchRadius',
                  type: 'number',
                  label: 'Search Radius (meters)',
                  defaultValue: 2000,
                  min: 100,
                  max: 50000,
                  admin: {
                    step: 100,
                    condition: (data, siblingData) => siblingData?.showPOIs,
                    description: 'Search radius for POIs (100m - 50km)',
                  },
                },
                {
                  name: 'autoOrbit',
                  type: 'checkbox',
                  label: 'Auto Orbit',
                  defaultValue: false,
                  admin: {
                    description: 'Automatically rotate the camera around the destination',
                  },
                },
                {
                  name: 'theme',
                  type: 'radio',
                  label: 'Theme',
                  defaultValue: 'dark',
                  options: [
                    { label: 'Dark', value: 'dark' },
                    { label: 'Light', value: 'light' },
                  ],
                },
                {
                  name: 'customCenter',
                  type: 'group',
                  label: 'Custom Center Point',
                  admin: {
                    description:
                      'Override the default center point to focus on a specific landmark or area',
                  },
                  fields: [
                    {
                      name: 'enabled',
                      type: 'checkbox',
                      label: 'Use Custom Center',
                      defaultValue: false,
                    },
                    {
                      name: 'lat',
                      type: 'number',
                      label: 'Latitude',
                      required: true,
                      admin: {
                        condition: (data, siblingData) => siblingData?.enabled,
                        description: 'Latitude of the landmark/area to center on',
                      },
                    },
                    {
                      name: 'lng',
                      type: 'number',
                      label: 'Longitude',
                      required: true,
                      admin: {
                        condition: (data, siblingData) => siblingData?.enabled,
                        description: 'Longitude of the landmark/area to center on',
                      },
                    },
                    {
                      name: 'description',
                      type: 'text',
                      label: 'Description',
                      admin: {
                        condition: (data, siblingData) => siblingData?.enabled,
                        description: 'E.g., "Eiffel Tower area", "Downtown district"',
                      },
                    },
                    {
                      name: 'landmarkSearch',
                      type: 'ui',
                      admin: {
                        components: {
                          Field: '@/components/MapCenterPicker/MapCenterPicker',
                        },
                      },
                    },
                  ],
                },
              ],
            },

            // POI Cache Status (automatic)
            {
              name: 'poiDataCachedAt',
              type: 'date',
              label: 'POI Data Cached',
              admin: {
                readOnly: true,
                position: 'sidebar',
                description: 'Points of Interest are automatically cached when coordinates change',
              },
            },

            ...slugField(),
          ],
          label: 'Content',
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [populateMissingLocationData, ...(optimizedDestinationHooks?.beforeChange ?? [])],
    afterChange: [revalidateDestination],
    afterRead: [
      // Use optimized hook with caching instead of ensureCountryPopulated
      ...(optimizedDestinationHooks?.afterRead ?? []),
      populateAuthors,
      ensureCoordinates,
      populateVirtualFields,
    ],
    afterDelete: [revalidateDelete],
  },

  versions: {
    drafts: { autosave: { interval: 100 } },
  },
}

export default Destinations
