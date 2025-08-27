import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'status', 'totalSpent'],
  },
  indexes: [
    // Single field indexes
    { fields: ['email'], unique: true },
    { fields: ['status'] },
    { fields: ['clubMember'] },
    { fields: ['totalSpent'] },
    // Compound indexes for name searches
    { fields: ['firstName', 'lastName'] },
    { fields: ['lastName', 'firstName'] },
    // Business queries
    { fields: ['status', 'totalSpent'] },
    { fields: ['travelStyle', 'status'] },
  ],
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      index: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'VIP', value: 'vip' },
        { label: 'Blacklisted', value: 'blacklisted' },
      ],
      defaultValue: 'active',
    },
    {
      name: 'clubMember',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'preferredDestinations',
      type: 'relationship',
      relationTo: 'destinations',
      hasMany: true,
    },
    {
      name: 'travelStyle',
      type: 'select',
      options: [
        { label: 'Ultra Luxury', value: 'ultra-luxury' },
        { label: 'Luxury', value: 'luxury' },
        { label: 'Premium', value: 'premium' },
        { label: 'Adventure Luxury', value: 'adventure-luxury' },
        { label: 'Cultural Luxury', value: 'cultural-luxury' },
      ],
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
        {
          name: 'currency',
          type: 'relationship',
          relationTo: 'currencies',
        },
      ],
    },
    {
      name: 'totalSpent',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'bookings',
      type: 'relationship',
      relationTo: 'bookings',
      hasMany: true,
    },
    {
      name: 'notes',
      type: 'richText',
    },
    {
      name: 'socialMedia',
      type: 'group',
      fields: [
        {
          name: 'instagram',
          type: 'text',
        },
        {
          name: 'facebook',
          type: 'text',
        },
        {
          name: 'twitter',
          type: 'text',
        },
      ],
    },
  ],
}