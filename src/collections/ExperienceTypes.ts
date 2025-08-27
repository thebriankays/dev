import type { CollectionConfig } from 'payload'
import { slugField } from '@/fields/slug'
import { colorPickerField } from '@/fields/ColorPicker/ColorPicker'

export const ExperienceTypes: CollectionConfig = {
  slug: 'experience-types',
  
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'icon', 'sortOrder'],
    group: 'Travel',
    components: {
      beforeListTable: ['@/components/admin/SeedExperienceTypesButton'],
    },
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        placeholder: 'e.g., Adventure, Cultural, Wildlife',
      },
    },
    
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            {
              name: 'description',
              type: 'textarea',
              admin: {
                placeholder: 'Brief description of this experience type',
              },
            },

            {
              name: 'icon',
              type: 'select',
              options: [
                { label: '🏔️ Mountain', value: 'mountain' },
                { label: '🏖️ Beach', value: 'beach' },
                { label: '🎭 Cultural', value: 'cultural' },
                { label: '🦁 Wildlife', value: 'wildlife' },
                { label: '🍷 Food & Wine', value: 'food-wine' },
                { label: '💆 Wellness', value: 'wellness' },
                { label: '💎 Luxury', value: 'luxury' },
                { label: '👨‍👩‍👧‍👦 Family', value: 'family' },
                { label: '💑 Romance', value: 'romance' },
                { label: '🏛️ Historical', value: 'historical' },
                { label: '🎯 Adventure', value: 'adventure' },
                { label: '🚶 Trekking', value: 'trekking' },
                { label: '🛶 Water Sports', value: 'water-sports' },
                { label: '🏌️ Golf', value: 'golf' },
                { label: '📸 Photography', value: 'photography' },
                { label: '🎨 Art & Design', value: 'art-design' },
                { label: '🎵 Music & Festivals', value: 'music-festivals' },
                { label: '🧘 Spiritual', value: 'spiritual' },
                { label: '🚂 Rail Journeys', value: 'rail' },
                { label: '🛳️ Cruises', value: 'cruises' },
              ],
              admin: {
                description: 'Icon to represent this experience type',
              },
            },

            colorPickerField({
              name: 'color',
              label: 'Theme Color',
              admin: {
                description: 'Color to represent this experience type',
              },
            }),

            {
              name: 'featured',
              type: 'checkbox',
              defaultValue: false,
              index: true,
              admin: {
                description: 'Show this prominently in filters and navigation',
              },
            },

            {
              name: 'sortOrder',
              type: 'number',
              defaultValue: 0,
              index: true,
              admin: {
                description: 'Order in which this type appears in lists (lower numbers first)',
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'seo',
              type: 'group',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  admin: {
                    placeholder: 'Adventure Travel Experiences | Your Company',
                    description: 'SEO title for the experience type category page',
                  },
                },
                {
                  name: 'description',
                  type: 'textarea',
                  maxLength: 160,
                  admin: {
                    placeholder: 'Discover our curated adventure travel experiences...',
                    description: 'Meta description for search engines',
                  },
                },
                {
                  name: 'keywords',
                  type: 'text',
                  admin: {
                    placeholder: 'adventure travel, outdoor experiences, hiking tours',
                    description: 'Comma-separated keywords for SEO',
                  },
                },
                {
                  name: 'ogImage',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Open Graph image for social media sharing',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    
    ...slugField('name'), // Auto-generate slug from the 'name' field
  ],

  indexes: [
    {
      fields: ['slug'],
      unique: true,
    },
    {
      fields: ['sortOrder'],
    },
    {
      fields: ['featured', 'sortOrder'],
    },
  ],
}

export default ExperienceTypes