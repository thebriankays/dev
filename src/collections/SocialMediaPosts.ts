import type { CollectionConfig } from 'payload'

export const SocialMediaPosts: CollectionConfig = {
  slug: 'social-media-posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'platforms', 'status', 'scheduledDate'],
  },
  indexes: [
    { fields: ['status'] },
    { fields: ['scheduledDate'] },
    // Compound indexes for common queries
    { fields: ['status', 'scheduledDate'] },
    { fields: ['relatedContent.post'] },
    { fields: ['relatedContent.destination'] },
  ],
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal title for organization',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'platforms',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Facebook', value: 'facebook' },
        { label: 'Instagram', value: 'instagram' },
        { label: 'Twitter/X', value: 'twitter' },
        { label: 'YouTube', value: 'youtube' },
        { label: 'LinkedIn', value: 'linkedin' },
        { label: 'TikTok', value: 'tiktok' },
      ],
      required: true,
    },
    {
      name: 'media',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'status',
      type: 'select',
      index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Published', value: 'published' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'draft',
    },
    {
      name: 'scheduledDate',
      type: 'date',
      index: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'publishedDate',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'errors',
      type: 'array',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'platform',
          type: 'text',
        },
        {
          name: 'error',
          type: 'text',
        },
      ],
    },
    {
      name: 'relatedContent',
      type: 'group',
      fields: [
        {
          name: 'post',
          type: 'relationship',
          relationTo: 'posts',
        },
        {
          name: 'destination',
          type: 'relationship',
          relationTo: 'destinations',
        },
      ],
    },
    {
      name: 'hashtags',
      type: 'array',
      fields: [
        {
          name: 'hashtag',
          type: 'text',
        },
      ],
    },
    {
      name: 'analytics',
      type: 'group',
      fields: [
        {
          name: 'impressions',
          type: 'number',
        },
        {
          name: 'engagements',
          type: 'number',
        },
        {
          name: 'clicks',
          type: 'number',
        },
        {
          name: 'shares',
          type: 'number',
        },
      ],
    },
  ],
}