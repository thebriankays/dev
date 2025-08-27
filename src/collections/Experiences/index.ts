import type { CollectionConfig } from 'payload'
import { slugField } from '@/fields/slug'
// import { glassCollectionComponents } from '@/components/admin/collectionOverrides'
import { populateChapterCoordinates } from './hooks/storyChapterHooks'

export const Experiences: CollectionConfig = {
  slug: 'experiences',
  
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'experienceType', 'destinations', 'status', 'createdAt'],
    // components: glassCollectionComponents,
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'e.g., Amazon Adventure, European Grand Tour',
      },
    },
    
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },

    {
      name: 'featured',
      type: 'checkbox',
      label: 'Featured Experience',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Show this experience prominently on the website',
      },
    },

    // Enable 3D Views
    {
      name: 'enable3DExplorer',
      type: 'checkbox',
      label: 'Enable 3D Area Explorer',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show 3D photorealistic map view for this experience',
      },
    },

    {
      name: 'enable3DStorytelling',
      type: 'checkbox',
      label: 'Enable 3D Storytelling',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Create a narrative journey through the destinations',
      },
    },

    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            {
              name: 'description',
              type: 'richText',
              required: true,
              admin: {
                description: 'Detailed description of the experience',
              },
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              required: true,
              maxLength: 200,
              admin: {
                description: 'Brief description for cards and previews',
              },
            },
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: {
                description: 'Main image for the experience',
              },
            },
            {
              name: 'gallery',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: {
                description: 'Additional images showcasing the experience',
              },
            },
            {
              name: 'experienceType',
              type: 'relationship',
              relationTo: 'experience-types',
              required: true,
              index: true,
              admin: {
                description: 'Select the type of experience',
              },
            },
            {
              name: 'duration',
              type: 'group',
              fields: [
                {
                  name: 'days',
                  type: 'number',
                  required: true,
                  min: 1,
                  admin: {
                    placeholder: '7',
                  },
                },
                {
                  name: 'nights',
                  type: 'number',
                  required: true,
                  min: 0,
                  admin: {
                    placeholder: '6',
                  },
                },
              ],
            },
            {
              name: 'priceRange',
              type: 'group',
              fields: [
                {
                  name: 'currency',
                  type: 'select',
                  defaultValue: 'USD',
                  options: [
                    { label: 'USD', value: 'USD' },
                    { label: 'EUR', value: 'EUR' },
                    { label: 'GBP', value: 'GBP' },
                  ],
                },
                {
                  name: 'startingFrom',
                  type: 'number',
                  required: true,
                  admin: {
                    placeholder: '2500',
                    description: 'Starting price per person',
                  },
                },
                {
                  name: 'pricingNote',
                  type: 'text',
                  admin: {
                    placeholder: 'Price varies by season and group size',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Destinations',
          fields: [
            {
              name: 'destinations',
              type: 'array',
              required: true,
              minRows: 1,
              labels: {
                singular: 'Destination',
                plural: 'Destinations',
              },
              admin: {
                description: 'Add destinations in the order they will be visited',
              },
              fields: [
                {
                  name: 'destination',
                  type: 'relationship',
                  relationTo: 'destinations',
                  admin: {
                    description: 'Select from existing destinations',
                  },
                },
                {
                  name: 'customLocation',
                  type: 'group',
                  admin: {
                    condition: (data, siblingData) => !siblingData?.destination,
                    description: 'Or add a custom location not in destinations',
                  },
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                      required: true,
                      admin: {
                        placeholder: 'e.g., Hidden Waterfall',
                      },
                    },
                    {
                      name: 'coordinates',
                      type: 'group',
                      fields: [
                        {
                          name: 'lat',
                          type: 'number',
                          required: true,
                          admin: {
                            step: 0.000001,
                          },
                        },
                        {
                          name: 'lng',
                          type: 'number',
                          required: true,
                          admin: {
                            step: 0.000001,
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  name: 'days',
                  type: 'number',
                  required: true,
                  min: 1,
                  admin: {
                    description: 'Number of days at this destination',
                  },
                },
                {
                  name: 'description',
                  type: 'textarea',
                  admin: {
                    description: 'What makes this destination special in this experience',
                  },
                },
                {
                  name: 'highlights',
                  type: 'array',
                  fields: [
                    {
                      name: 'activity',
                      type: 'text',
                      required: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: '3D Explorer Settings',
          admin: {
            condition: (data) => data?.enable3DExplorer,
          },
          fields: [
            {
              name: 'explorerConfig',
              type: 'group',
              fields: [
                {
                  name: 'centerLocation',
                  type: 'select',
                  label: 'Center Map On',
                  defaultValue: 'auto',
                  options: [
                    { label: 'Auto (Center of all destinations)', value: 'auto' },
                    { label: 'First Destination', value: 'first' },
                    { label: 'Custom Coordinates', value: 'custom' },
                  ],
                },
                {
                  name: 'customCenter',
                  type: 'group',
                  admin: {
                    condition: (data, siblingData) => siblingData?.centerLocation === 'custom',
                  },
                  fields: [
                    {
                      name: 'lat',
                      type: 'number',
                      required: true,
                      admin: {
                        step: 0.000001,
                      },
                    },
                    {
                      name: 'lng',
                      type: 'number',
                      required: true,
                      admin: {
                        step: 0.000001,
                      },
                    },
                  ],
                },
                {
                  name: 'showPOIs',
                  type: 'checkbox',
                  label: 'Show Points of Interest',
                  defaultValue: true,
                },
                {
                  name: 'poiTypes',
                  type: 'select',
                  hasMany: true,
                  defaultValue: ['tourist_attraction', 'restaurant', 'lodging'],
                  options: [
                    { label: 'Restaurants', value: 'restaurant' },
                    { label: 'Tourist Attractions', value: 'tourist_attraction' },
                    { label: 'Hotels/Lodging', value: 'lodging' },
                    { label: 'Museums', value: 'museum' },
                    { label: 'Parks', value: 'park' },
                    { label: 'Shopping', value: 'shopping_mall' },
                    { label: 'Cafes', value: 'cafe' },
                    { label: 'Bars', value: 'bar' },
                  ],
                  admin: {
                    condition: (data, siblingData) => siblingData?.showPOIs,
                  },
                },
                {
                  name: 'showDestinationMarkers',
                  type: 'checkbox',
                  label: 'Show Destination Markers',
                  defaultValue: true,
                },
                {
                  name: 'theme',
                  type: 'radio',
                  defaultValue: 'dark',
                  options: [
                    { label: 'Dark', value: 'dark' },
                    { label: 'Light', value: 'light' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: '3D Story',
          admin: {
            condition: (data) => data?.enable3DStorytelling,
          },
          fields: [
            {
              name: 'generateChaptersUI',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/fields/StoryChapterField/GenerateChaptersButton',
                },
              },
            },
            {
              name: 'storyChapters',
              type: 'array',
              label: 'Story Chapters',
              labels: {
                singular: 'Chapter',
                plural: 'Chapters',
              },
              admin: {
                description: 'Chapters are automatically linked to your destinations',
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'content',
                  type: 'textarea',
                  required: true,
                  admin: {
                    rows: 4,
                  },
                },
                {
                  name: 'useDestination',
                  type: 'checkbox',
                  label: 'Use Destination from List',
                  defaultValue: true,
                  admin: {
                    description: 'Link this chapter to a destination from your list',
                  },
                },
                {
                  name: 'destinationIndex',
                  type: 'number',
                  label: 'Destination',
                  min: 0,
                  admin: {
                    condition: (data, siblingData) => siblingData?.useDestination,
                    components: {
                      Field: '@/components/admin/fields/StoryChapterField/DestinationSelect',
                    },
                  },
                },
                {
                  name: 'customLocation',
                  type: 'group',
                  admin: {
                    condition: (data, siblingData) => !siblingData?.useDestination,
                    description: 'Or specify custom coordinates not in your destinations',
                  },
                  fields: [
                    {
                      name: 'lat',
                      type: 'number',
                      required: true,
                      admin: {
                        step: 0.000001,
                      },
                    },
                    {
                      name: 'lng',
                      type: 'number',
                      required: true,
                      admin: {
                        step: 0.000001,
                      },
                    },
                  ],
                },
                {
                  name: 'media',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Optional image or video for this chapter',
                  },
                },
                {
                  name: 'duration',
                  type: 'number',
                  defaultValue: 15,
                  min: 5,
                  max: 30,
                  admin: {
                    description: 'Seconds to display this chapter',
                  },
                },
                {
                  name: 'cameraOptions',
                  type: 'group',
                  label: 'Camera Settings (Optional)',
                  admin: {
                    condition: (data, siblingData) => siblingData?.useDestination || siblingData?.customLocation,
                  },
                  fields: [
                    {
                      name: 'heading',
                      type: 'number',
                      min: -180,
                      max: 180,
                      admin: {
                        description: 'Camera compass heading (-180 to 180)',
                        step: 1,
                      },
                    },
                    {
                      name: 'pitch',
                      type: 'number',
                      min: -90,
                      max: 0,
                      admin: {
                        description: 'Camera tilt angle (-90 to 0)',
                        step: 1,
                      },
                    },
                    {
                      name: 'range',
                      type: 'number',
                      min: 100,
                      max: 5000,
                      admin: {
                        description: 'Distance from location in meters',
                        step: 100,
                      },
                    },
                  ],
                },
              ],
            },
            {
              name: 'storytellingConfig',
              type: 'group',
              fields: [
                {
                  name: 'autoPlay',
                  type: 'checkbox',
                  defaultValue: true,
                },
                {
                  name: 'showNavigation',
                  type: 'checkbox',
                  defaultValue: true,
                },
                {
                  name: 'theme',
                  type: 'radio',
                  defaultValue: 'dark',
                  options: [
                    { label: 'Dark', value: 'dark' },
                    { label: 'Light', value: 'light' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Details',
          fields: [
            {
              name: 'whatsIncluded',
              type: 'array',
              label: "What's Included",
              fields: [
                {
                  name: 'item',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'whatsNotIncluded',
              type: 'array',
              label: "What's Not Included",
              fields: [
                {
                  name: 'item',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'highlights',
              type: 'array',
              label: 'Experience Highlights',
              fields: [
                {
                  name: 'highlight',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'bestTimeToVisit',
              type: 'textarea',
              label: 'Best Time to Visit',
              admin: {
                placeholder: 'Describe the ideal seasons or months for this experience',
              },
            },
            {
              name: 'difficulty',
              type: 'select',
              options: [
                { label: 'Easy', value: 'easy' },
                { label: 'Moderate', value: 'moderate' },
                { label: 'Challenging', value: 'challenging' },
                { label: 'Varies', value: 'varies' },
              ],
            },
            {
              name: 'groupSize',
              type: 'group',
              fields: [
                {
                  name: 'min',
                  type: 'number',
                  defaultValue: 1,
                },
                {
                  name: 'max',
                  type: 'number',
                  defaultValue: 12,
                },
              ],
            },
          ],
        },
      ],
    },

    // SEO
    {
      name: 'seo',
      type: 'group',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          maxLength: 160,
        },
      ],
    },

    ...slugField(),
  ],

  indexes: [
    // Unique slug
    {
      fields: ['slug'],
      unique: true,
    },
    // For filtering by status
    {
      fields: ['status'],
    },
    // For featured experiences
    {
      fields: ['featured', 'status'],
    },
    // For filtering by experience type
    {
      fields: ['experienceType', 'status'],
    },
    // For sorting by creation date
    {
      fields: ['createdAt'],
    },
    // Compound index for common queries
    {
      fields: ['status', 'featured', 'experienceType'],
    },
    // For 3D features
    {
      fields: ['enable3DExplorer'],
    },
    {
      fields: ['enable3DStorytelling'],
    },
  ],

  hooks: {
    beforeChange: [
      populateChapterCoordinates,
    ],
  },
}

export default Experiences