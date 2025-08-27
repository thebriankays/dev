import type { CollectionConfig } from 'payload'

export const TravelDiaries: CollectionConfig = {
  slug: 'travel-diaries',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'member', 'destination', 'status'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'member',
      type: 'relationship',
      relationTo: 'club-members',
      required: true,
    },
    {
      name: 'destination',
      type: 'relationship',
      relationTo: 'destinations',
      required: true,
    },
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'bookings',
    },
    {
      name: 'travelDates',
      type: 'group',
      fields: [
        {
          name: 'start',
          type: 'date',
          required: true,
        },
        {
          name: 'end',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Planning', value: 'planning' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Shared', value: 'shared' },
      ],
      defaultValue: 'planning',
    },
    {
      name: 'entries',
      type: 'array',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'richText',
          required: true,
        },
        {
          name: 'photos',
          type: 'relationship',
          relationTo: 'media',
          hasMany: true,
        },
        {
          name: 'location',
          type: 'group',
          fields: [
            {
              name: 'name',
              type: 'text',
            },
            {
              name: 'coordinates',
              type: 'group',
              fields: [
                {
                  name: 'latitude',
                  type: 'number',
                },
                {
                  name: 'longitude',
                  type: 'number',
                },
              ],
            },
          ],
        },
        {
          name: 'mood',
          type: 'select',
          options: [
            { label: '😍 Amazing', value: 'amazing' },
            { label: '😊 Great', value: 'great' },
            { label: '😌 Good', value: 'good' },
            { label: '😐 Okay', value: 'okay' },
            { label: '😞 Disappointing', value: 'disappointing' },
          ],
        },
        {
          name: 'weather',
          type: 'select',
          options: [
            { label: '☀️ Sunny', value: 'sunny' },
            { label: '⛅ Partly Cloudy', value: 'partly-cloudy' },
            { label: '☁️ Cloudy', value: 'cloudy' },
            { label: '🌧️ Rainy', value: 'rainy' },
            { label: '⛈️ Stormy', value: 'stormy' },
          ],
        },
      ],
    },
    {
      name: 'highlights',
      type: 'array',
      fields: [
        {
          name: 'highlight',
          type: 'text',
        },
      ],
    },
    {
      name: 'wouldRecommend',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'overallRating',
      type: 'number',
      min: 1,
      max: 5,
    },
    {
      name: 'publiclyVisible',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Allow this diary to be featured on the website',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}