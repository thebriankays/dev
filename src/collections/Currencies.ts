import type { CollectionConfig } from 'payload'
import React from 'react'

export const Currencies: CollectionConfig = {
  slug: 'currencies',
  admin: {
    useAsTitle: 'name',
    components: {
      beforeList: [
        {
          path: '@/components/CurrencyAdmin',
          exportName: 'CurrencyAdmin',
        },
      ],
    },
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
        description: 'ISO 4217 currency code (e.g., USD, EUR, GBP)',
      },
    },
    {
      name: 'symbol',
      type: 'text',
      required: true,
    },
    {
      name: 'exchangeRate',
      type: 'number',
      admin: {
        description: 'Exchange rate to USD (updated via API)',
      },
    },
    {
      name: 'exchangeRateUpdatedAt',
      type: 'date',
      admin: {
        description: 'Last time the exchange rate was updated',
        readOnly: true,
      },
    },
    // Join field to show destinations using this currency
    {
      name: 'destinations',
      type: 'join',
      collection: 'destinations',
      on: 'currencyRelation',
      label: 'Destinations',
      admin: {
        description: 'All destinations using this currency',
      },
    },
  ],
}
