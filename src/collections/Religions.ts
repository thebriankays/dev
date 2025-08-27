import type { CollectionConfig } from 'payload'

export const Religions: CollectionConfig = {
  slug: 'religions',
  labels: {
    singular: 'Religion',
    plural: 'Religions',
  },
  admin: {
    useAsTitle: 'name',
    group: 'Data Source',
    defaultColumns: ['name', 'description'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Name of the religion',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Brief description of the religion',
      },
    },
    {
      name: 'parentReligion',
      type: 'relationship',
      relationTo: 'religions',
      admin: {
        description: 'Parent religion (e.g., Christianity for Catholic)',
      },
    },
  ],
  indexes: [
    {
      fields: ['name'],
      unique: true,
    },
  ],
}
