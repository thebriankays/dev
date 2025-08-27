import type { CollectionConfig } from 'payload'

export const VisaRequirements: CollectionConfig = {
  slug: 'visa-requirements',
  admin: {
    useAsTitle: 'passportCountry',
    defaultColumns: ['passportCountry', 'destinationCountry', 'requirement'],
    group: 'Location Data',
  },
  indexes: [
    // Composite unique index for passport-destination pairs
    { fields: ['passportCountry', 'destinationCountry'], unique: true },
    // Single field indexes for queries
    { fields: ['passportCountry'] },
    { fields: ['destinationCountry'] },
    { fields: ['requirement'] },
  ],
  fields: [
    /* direction ---------------------------------------------------- */
    {
      name: 'passportCountry',
      type: 'relationship',
      relationTo: 'countries',
      required: true,
      index: true,
    },
    {
      name: 'destinationCountry',
      type: 'relationship',
      relationTo: 'countries',
      required: true,
      index: true,
    },

    /* rule --------------------------------------------------------- */
    {
      name: 'requirement',
      type: 'select',
      required: true,
      options: [
        { value: 'visa_free', label: 'Visa free' },
        { value: 'visa_on_arrival', label: 'Visa on arrival' },
        { value: 'evisa', label: 'eVisa' },
        { value: 'eta', label: 'eTA' },
        { value: 'visa_required', label: 'Visa required' },
        { label: 'No admission', value: 'no_admission' },
      ],
    },
    { name: 'days', type: 'number', min: 1 },
    { name: 'notes', type: 'textarea' },
  ],
}

export default VisaRequirements