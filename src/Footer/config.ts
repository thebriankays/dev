import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { colorPickerField } from '@/fields/ColorPicker/ColorPicker'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
    {
      name: 'backgroundStyle',
      type: 'radio',
      required: true,
      defaultValue: 'gradient',
      options: [
        {
          label: 'Gradient',
          value: 'gradient',
        },
        {
          label: 'Solid Color',
          value: 'solid',
        },
      ],
    },
    {
      name: 'enableNoise',
      type: 'checkbox',
      label: 'Enable Noise Effect',
      defaultValue: true,
    },
    colorPickerField({
      name: 'backgroundColor',
      label: 'Background Color',
      admin: {
        condition: (data: { backgroundStyle?: string }) => data.backgroundStyle === 'solid',
        defaultValue: '#000000',
      },
    }),
    colorPickerField({
      name: 'gradientStartColor',
      label: 'Gradient Start Color',
      admin: {
        condition: (data: { backgroundStyle?: string }) => data.backgroundStyle === 'gradient',
        defaultValue: '#fec5fb',
      },
    }),
    colorPickerField({
      name: 'gradientEndColor',
      label: 'Gradient End Color',
      admin: {
        condition: (data: { backgroundStyle?: string }) => data.backgroundStyle === 'gradient',
        defaultValue: '#00bae2',
      },
    }),
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
