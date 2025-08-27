import type { CollectionConfig } from 'payload'

export const Timezones: CollectionConfig = {
  slug: 'timezones',
  admin: {
    useAsTitle: 'label',
    group: 'Location Data',
    description: 'Timezone data for countries and regions',
    defaultColumns: ['label', 'name', 'offset', 'isDST'],
  },
  indexes: [
    { fields: ['name'], unique: true },
    { fields: ['slug'], unique: true },
    { fields: ['offsetMinutes'] },
    { fields: ['isDST'] },
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'IANA timezone identifier (e.g., America/New_York)',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly slug (e.g., america-new-york)',
      },
    },
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: {
        description: 'Human-readable name (e.g., Eastern Time (US & Canada))',
      },
    },
    {
      name: 'offset',
      type: 'text',
      required: true,
      admin: {
        description: 'UTC offset in ±HH:MM format',
      },
    },
    {
      name: 'offsetMinutes',
      type: 'number',
      required: true,
      admin: {
        description: 'UTC offset in minutes (negative for west of UTC)',
      },
    },
    {
      name: 'isDST',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this timezone observes daylight saving time',
      },
    },
  ],
}
