import type { CollectionConfig } from 'payload'

export const ClubMembers: CollectionConfig = {
  slug: 'club-members',
  dbName: 'cm',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'membershipLevel', 'status'],
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      unique: true,
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'membershipLevel',
      type: 'select',
      options: [
        { label: 'Silver Explorer', value: 'silver' },
        { label: 'Gold Adventurer', value: 'gold' },
        { label: 'Platinum Connoisseur', value: 'platinum' },
        { label: 'Diamond Elite', value: 'diamond' },
      ],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Expired', value: 'expired' },
      ],
      defaultValue: 'active',
    },
    {
      name: 'joinDate',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'renewalDate',
      type: 'date',
      required: true,
    },
    {
      name: 'preferences',
      type: 'group',
      fields: [
        {
          name: 'preferredDestinationTypes',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Beach & Islands', value: 'beach-islands' },
            { label: 'Cultural & Historical', value: 'cultural-historical' },
            { label: 'Adventure & Nature', value: 'adventure-nature' },
            { label: 'Urban & Metropolitan', value: 'urban-metropolitan' },
            { label: 'Wine & Culinary', value: 'wine-culinary' },
            { label: 'Wellness & Spa', value: 'wellness-spa' },
          ],
        },
        {
          name: 'accommodationPreferences',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Luxury Hotels', value: 'luxury-hotels' },
            { label: 'Boutique Properties', value: 'boutique-properties' },
            { label: 'Private Villas', value: 'private-villas' },
            { label: 'Exclusive Resorts', value: 'exclusive-resorts' },
            { label: 'Historic Properties', value: 'historic-properties' },
          ],
        },
        {
          name: 'communicationPreferences',
          type: 'group',
          fields: [
            {
              name: 'emailUpdates',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'smsNotifications',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'frequency',
              type: 'select',
              options: [
                { label: 'Weekly', value: 'weekly' },
                { label: 'Bi-weekly', value: 'bi-weekly' },
                { label: 'Monthly', value: 'monthly' },
                { label: 'Quarterly', value: 'quarterly' },
              ],
              defaultValue: 'monthly',
            },
          ],
        },
      ],
    },
    {
      name: 'benefits',
      type: 'group',
      fields: [
        {
          name: 'conciergeAccess',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'exclusiveDeals',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'priorityBooking',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'customItinerary',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'aiChatbotAccess',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
  ],
}