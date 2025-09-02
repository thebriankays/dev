import type { Block } from 'payload'

export const DestinationDetailBlock: Block = {
  slug: 'destinationDetailBlock',
  interfaceName: 'DestinationDetailBlock',
  labels: {
    singular: 'Destination Detail Block',
    plural: 'Destination Detail Blocks',
  },
  fields: [
    {
      name: 'destination',
      type: 'relationship',
      relationTo: 'destinations',
      required: true,
    },
    {
      name: 'background',
      type: 'group',
      fields: [
        {
          name: 'backgroundType',
          type: 'select',
          options: [
            {
              label: 'Transparent',
              value: 'transparent',
            },
            {
              label: 'Color',
              value: 'color',
            },
          ],
          defaultValue: 'transparent',
        },
        {
          name: 'backgroundColor',
          type: 'text',
          admin: {
            condition: (data, siblingData) => siblingData?.backgroundType === 'color',
          },
        },
      ],
    },
    {
      name: 'separatorLinesColor',
      type: 'text',
      defaultValue: '#ffd074',
    },
    {
      name: 'showWeatherCard',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showAnimatedFlag',
      type: 'checkbox', 
      defaultValue: true,
    },
    {
      name: 'useMockData',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Use mock weather data instead of real API calls',
      },
    },
  ],
}