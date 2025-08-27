import type { CollectionConfig } from 'payload'

export const CountryMedia: CollectionConfig = {
  slug: 'country-media',
  labels: {
    singular: 'Country Media',
    plural: 'Country Media',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Location Data',
    defaultColumns: ['title', 'country', 'mediaType', 'source'],
  },
  fields: [
    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'mediaType',
      type: 'select',
      required: true,
      options: [
        { label: 'Map - Physical', value: 'map-physical' },
        { label: 'Map - Political', value: 'map-political' },
        { label: 'Map - Administrative', value: 'map-administrative' },
        { label: 'Map - Location', value: 'map-location' },
        { label: 'Map - Relief', value: 'map-relief' },
        { label: 'Map - Transportation', value: 'map-transportation' },
        { label: 'Map - Population', value: 'map-population' },
        { label: 'Photo - Landscape', value: 'photo-landscape' },
        { label: 'Photo - City', value: 'photo-city' },
        { label: 'Photo - Culture', value: 'photo-culture' },
        { label: 'Photo - Historical', value: 'photo-historical' },
        { label: 'Infographic', value: 'infographic' },
        { label: 'Chart', value: 'chart' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Upload media file or reference existing',
      },
    },
    {
      name: 'externalUrl',
      type: 'text',
      admin: {
        description: 'External URL if media is hosted elsewhere (e.g., CIA Factbook)',
      },
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'cia-factbook',
      options: [
        { label: 'CIA World Factbook', value: 'cia-factbook' },
        { label: 'User Upload', value: 'user-upload' },
        { label: 'Other Government', value: 'government' },
        { label: 'Licensed Stock', value: 'stock' },
        { label: 'Public Domain', value: 'public-domain' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: {
        description: 'Original source URL',
      },
    },
    {
      name: 'copyright',
      type: 'text',
      admin: {
        description: 'Copyright information if applicable',
      },
    },
    {
      name: 'year',
      type: 'number',
      admin: {
        description: 'Year the media was created/published',
      },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'geoLocation',
      type: 'group',
      admin: {
        description: 'Geographic location if this media represents a specific place',
      },
      fields: [
        {
          name: 'latitude',
          type: 'number',
          admin: {
            step: 0.000001,
          },
        },
        {
          name: 'longitude',
          type: 'number',
          admin: {
            step: 0.000001,
          },
        },
        {
          name: 'placeName',
          type: 'text',
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Feature this media item prominently',
        position: 'sidebar',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Order for displaying media items',
        position: 'sidebar',
      },
    },
  ],
  indexes: [
    { fields: ['country'] },
    { fields: ['mediaType'] },
    { fields: ['featured'] },
  ],
}