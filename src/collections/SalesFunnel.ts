import type { CollectionConfig } from 'payload'

export const SalesFunnel: CollectionConfig = {
  slug: 'sales-funnel',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'stage',
      type: 'select',
      options: [
        { label: 'Awareness', value: 'awareness' },
        { label: 'Interest', value: 'interest' },
        { label: 'Consideration', value: 'consideration' },
        { label: 'Intent', value: 'intent' },
        { label: 'Purchase', value: 'purchase' },
        { label: 'Retention', value: 'retention' },
      ],
      required: true,
    },
    {
      name: 'lead',
      type: 'relationship',
      relationTo: 'leads',
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
    },
    {
      name: 'estimatedValue',
      type: 'number',
    },
    {
      name: 'probability',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Percentage probability of closing',
      },
    },
    {
      name: 'expectedCloseDate',
      type: 'date',
    },
    {
      name: 'activities',
      type: 'array',
      fields: [
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Call', value: 'call' },
            { label: 'Email', value: 'email' },
            { label: 'Meeting', value: 'meeting' },
            { label: 'Proposal', value: 'proposal' },
            { label: 'Follow-up', value: 'follow-up' },
          ],
        },
        {
          name: 'date',
          type: 'date',
        },
        {
          name: 'notes',
          type: 'textarea',
        },
        {
          name: 'outcome',
          type: 'select',
          options: [
            { label: 'Positive', value: 'positive' },
            { label: 'Neutral', value: 'neutral' },
            { label: 'Negative', value: 'negative' },
          ],
        },
      ],
    },
  ],
}