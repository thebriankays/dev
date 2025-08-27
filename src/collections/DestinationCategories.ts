import { slugField } from '@/fields/slug'
import type { CollectionConfig } from 'payload'

export const DestinationCategories: CollectionConfig = {
  slug: 'destination-categories',
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
    ...slugField(),
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'icon',
      type: 'text',
      admin: {
        description: 'Lucide icon name for this category',
      },
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Hex color code for category display',
      },
    },
  ],
}