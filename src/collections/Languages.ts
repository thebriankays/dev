import type { CollectionConfig } from 'payload'

export const Languages: CollectionConfig = {
  slug: 'languages',
  admin: {
    useAsTitle: 'name',
  },
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['name'] },
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'ISO 639-1 language code (e.g., en, fr, es)',
      },
    },
    {
      name: 'nativeName',
      type: 'text',
    },
    // Join field to show destinations where this language is spoken
    {
      name: 'destinations',
      type: 'join',
      collection: 'destinations',
      on: 'languagesRelation',
      label: 'Destinations',
      admin: {
        description: 'All destinations where this language is spoken',
      },
    },
  ],
}
