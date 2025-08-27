import type { CollectionConfig } from 'payload'

export const ChatSessions: CollectionConfig = {
  slug: 'chat-sessions',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'member', 'createdAt', 'status'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Auto-generated based on conversation topic',
      },
    },
    {
      name: 'member',
      type: 'relationship',
      relationTo: 'club-members',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Ended', value: 'ended' },
      ],
      defaultValue: 'active',
    },
    {
      name: 'context',
      type: 'group',
      fields: [
        {
          name: 'upcomingBooking',
          type: 'relationship',
          relationTo: 'bookings',
        },
        {
          name: 'currentDestination',
          type: 'relationship',
          relationTo: 'destinations',
        },
        {
          name: 'interests',
          type: 'array',
          fields: [
            {
              name: 'interest',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'messages',
      type: 'array',
      fields: [
        {
          name: 'sender',
          type: 'select',
          options: [
            { label: 'User', value: 'user' },
            { label: 'AI Assistant', value: 'assistant' },
          ],
          required: true,
        },
        {
          name: 'content',
          type: 'textarea',
          required: true,
        },
        {
          name: 'timestamp',
          type: 'date',
          required: true,
          defaultValue: () => new Date().toISOString(),
        },
        {
          name: 'attachments',
          type: 'relationship',
          relationTo: 'media',
          hasMany: true,
        },
      ],
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        description: 'AI-generated summary of the conversation',
      },
    },
    {
      name: 'actionItems',
      type: 'array',
      fields: [
        {
          name: 'item',
          type: 'text',
        },
        {
          name: 'completed',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
}