import type { CollectionConfig } from 'payload'

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'status', 'source'],
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
    },
    {
      name: 'lastName',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Lost', value: 'lost' },
        { label: 'Converted', value: 'converted' },
      ],
      defaultValue: 'new',
    },
    {
      name: 'source',
      type: 'select',
      options: [
        { label: 'Website', value: 'website' },
        { label: 'Social Media', value: 'social-media' },
        { label: 'Referral', value: 'referral' },
        { label: 'Email Campaign', value: 'email-campaign' },
        { label: 'Google Ads', value: 'google-ads' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'interestedDestinations',
      type: 'relationship',
      relationTo: 'destinations',
      hasMany: true,
    },
    {
      name: 'budget',
      type: 'group',
      fields: [
        {
          name: 'min',
          type: 'number',
        },
        {
          name: 'max',
          type: 'number',
        },
      ],
    },
    {
      name: 'travelDates',
      type: 'group',
      fields: [
        {
          name: 'start',
          type: 'date',
        },
        {
          name: 'end',
          type: 'date',
        },
        {
          name: 'flexible',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'notes',
      type: 'richText',
    },
    {
      name: 'lastContact',
      type: 'date',
    },
    {
      name: 'nextFollowUp',
      type: 'date',
    },
  ],
}