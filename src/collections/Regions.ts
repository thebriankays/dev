import type { CollectionConfig } from 'payload'

export const Regions: CollectionConfig = {
  slug: 'regions',

  admin: {
    useAsTitle: 'name',
    group: 'Location Data',
  },

  indexes: [
    { fields: ['name'] },
    { fields: ['code'] },
    { fields: ['country'] },
    { fields: ['type'] },
    // Compound indexes
    { fields: ['country', 'name'] },
    { fields: ['country', 'code'] },
    { fields: ['country', 'type'] },
  ],

  fields: [
    /* ─────────── Core ─────────── */
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
      admin: { placeholder: 'California' },
    },

    {
      /* e.g. "CA", "NSW", "NIR", "QC" … */
      name: 'code',
      type: 'text',
      index: true,
      admin: {
        description: 'Short region / state code (optional)',
        placeholder: 'CA',
      },
    },

    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      required: true,
      index: true,
    },

    {
      /* broad category – adjust / extend as you need */
      name: 'type',
      type: 'select',
      required: true,
      index: true,
      admin: { description: 'Administrative level' },
      options: [
        { label: 'State', value: 'state' },
        { label: 'Province', value: 'province' },
        { label: 'Region', value: 'region' },
        { label: 'Territory', value: 'territory' },
        { label: 'District', value: 'district' },
      ],
    },

    {
      name: 'capital',
      type: 'text',
      admin: { placeholder: 'Sacramento' },
    },

    /* ─────────── Reverse join helpers ─────────── */
    {
      /* show all Destinations inside this region */
      name: 'destinations',
      type: 'join',
      collection: 'destinations',
      on: 'regionRelation',
      label: 'Destinations',
      admin: {
        description: 'All destinations in this region',
      },
    },
  ],
}

export default Regions
