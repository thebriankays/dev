import type { CollectionConfig } from 'payload'

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: {
    useAsTitle: 'bookingNumber',
    defaultColumns: ['bookingNumber', 'customer', 'destination', 'status', 'totalAmount'],
  },
  indexes: [
    // Single field indexes
    { fields: ['bookingNumber'], unique: true },
    { fields: ['customer'] },
    { fields: ['destination'] },
    { fields: ['status'] },
    // Compound indexes for common queries
    { fields: ['customer', 'status'] },
    { fields: ['status', 'createdAt'] },
    { fields: ['travelDates.departure'] },
    { fields: ['travelDates.return'] },
  ],
  fields: [
    {
      name: 'bookingNumber',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Auto-generated unique booking reference',
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      index: true,
    },
    {
      name: 'destination',
      type: 'relationship',
      relationTo: 'destinations',
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      index: true,
      options: [
        { label: 'Inquiry', value: 'inquiry' },
        { label: 'Quote Sent', value: 'quote-sent' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Paid', value: 'paid' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'inquiry',
    },
    {
      name: 'travelDates',
      type: 'group',
      fields: [
        {
          name: 'departure',
          type: 'date',
          required: true,
        },
        {
          name: 'return',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      name: 'travelers',
      type: 'array',
      fields: [
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
          name: 'dateOfBirth',
          type: 'date',
        },
        {
          name: 'passportNumber',
          type: 'text',
        },
        {
          name: 'specialRequests',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'itinerary',
      type: 'richText',
    },
    {
      name: 'accommodations',
      type: 'array',
      fields: [
        {
          name: 'hotel',
          type: 'text',
        },
        {
          name: 'checkIn',
          type: 'date',
        },
        {
          name: 'checkOut',
          type: 'date',
        },
        {
          name: 'roomType',
          type: 'text',
        },
        {
          name: 'cost',
          type: 'number',
        },
      ],
    },
    {
      name: 'flights',
      type: 'array',
      fields: [
        {
          name: 'airline',
          type: 'text',
        },
        {
          name: 'flightNumber',
          type: 'text',
        },
        {
          name: 'departure',
          type: 'group',
          fields: [
            {
              name: 'airport',
              type: 'text',
            },
            {
              name: 'date',
              type: 'date',
            },
            {
              name: 'time',
              type: 'text',
            },
          ],
        },
        {
          name: 'arrival',
          type: 'group',
          fields: [
            {
              name: 'airport',
              type: 'text',
            },
            {
              name: 'date',
              type: 'date',
            },
            {
              name: 'time',
              type: 'text',
            },
          ],
        },
        {
          name: 'cost',
          type: 'number',
        },
      ],
    },
    {
      name: 'pricing',
      type: 'group',
      fields: [
        {
          name: 'subtotal',
          type: 'number',
        },
        {
          name: 'taxes',
          type: 'number',
        },
        {
          name: 'fees',
          type: 'number',
        },
        {
          name: 'discount',
          type: 'number',
        },
        {
          name: 'totalAmount',
          type: 'number',
          required: true,
        },
        {
          name: 'currency',
          type: 'relationship',
          relationTo: 'currencies',
          required: true,
        },
      ],
    },
    {
      name: 'payments',
      type: 'array',
      fields: [
        {
          name: 'amount',
          type: 'number',
          required: true,
        },
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'method',
          type: 'select',
          options: [
            { label: 'Credit Card', value: 'credit-card' },
            { label: 'Bank Transfer', value: 'bank-transfer' },
            { label: 'Check', value: 'check' },
            { label: 'Cash', value: 'cash' },
          ],
        },
        {
          name: 'reference',
          type: 'text',
        },
      ],
    },
  ],
}