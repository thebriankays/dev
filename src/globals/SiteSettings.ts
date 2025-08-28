import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  typescript: {
    interface: 'SiteSettings',
  },
  access: {
    read: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'background',
      type: 'group',
      fields: [
        {
          name: 'type',
          type: 'select',
          label: 'Background Type',
          defaultValue: 'whatamesh',
          options: [
            {
              label: 'None',
              value: 'none',
            },
            {
              label: 'Whatamesh Gradient',
              value: 'whatamesh',
            },
            {
              label: 'Static Gradient',
              value: 'gradient',
            },
            {
              label: 'Particles',
              value: 'particles',
            },
          ],
        },
        {
          name: 'whatamesh',
          type: 'group',
          label: 'Whatamesh Settings',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'whatamesh',
            components: {
              Field: '@/components/admin/WhatameshPreview',
            },
          },
          fields: [
            {
              name: 'seed',
              type: 'number',
              label: 'Random Seed',
              defaultValue: 5,
              min: 1,
              max: 10,
            },
            {
              name: 'animate',
              type: 'checkbox',
              label: 'Enable Animation',
              defaultValue: true,
            },
            {
              name: 'colors',
              type: 'array',
              label: 'Gradient Colors',
              minRows: 4,
              maxRows: 4,
              defaultValue: [
                { color: '#dca8d8' },
                { color: '#a3d3f9' },
                { color: '#fcd6d6' },
                { color: '#eae2ff' },
              ],
              fields: [
                {
                  name: 'color',
                  type: 'text',
                  label: 'Color (Hex)',
                  required: true,
                  admin: {
                    placeholder: '#000000',
                  },
                },
              ],
            },
            {
              name: 'speed',
              type: 'number',
              label: 'Animation Speed',
              defaultValue: 0.5,
              min: 0.1,
              max: 2,
              admin: {
                condition: (_, siblingData) => siblingData?.animate === true,
                step: 0.1,
              },
            },
            {
              name: 'intensity',
              type: 'number',
              label: 'Effect Intensity',
              defaultValue: 0.5,
              min: 0,
              max: 1,
              admin: {
                step: 0.1,
              },
            },
          ],
        },
      ],
    },
    {
      name: 'analytics',
      type: 'group',
      fields: [
        {
          name: 'googleAnalyticsId',
          type: 'text',
          label: 'Google Analytics ID',
        },
        {
          name: 'facebookPixelId',
          type: 'text',
          label: 'Facebook Pixel ID',
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'defaultTitle',
          type: 'text',
          label: 'Default Page Title',
        },
        {
          name: 'titleTemplate',
          type: 'text',
          label: 'Title Template',
          defaultValue: '%s | Your Site Name',
          admin: {
            description: 'Use %s where the page title should be inserted',
          },
        },
        {
          name: 'defaultDescription',
          type: 'textarea',
          label: 'Default Meta Description',
        },
        {
          name: 'defaultImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Default OG Image',
        },
      ],
    },
    {
      name: 'social',
      type: 'group',
      fields: [
        {
          name: 'twitter',
          type: 'text',
          label: 'Twitter Handle',
        },
        {
          name: 'facebook',
          type: 'text',
          label: 'Facebook URL',
        },
        {
          name: 'instagram',
          type: 'text',
          label: 'Instagram Handle',
        },
        {
          name: 'linkedin',
          type: 'text',
          label: 'LinkedIn URL',
        },
      ],
    },
  ],
}