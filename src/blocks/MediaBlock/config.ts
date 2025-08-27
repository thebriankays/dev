import type { Block } from 'payload'
import { allBlockOptions } from '../_shared/block-options'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'webglEnabled',
      type: 'checkbox',
      label: 'Enable WebGL Effects',
      defaultValue: false,
    },
    {
      name: 'webglSettings',
      type: 'group',
      label: 'WebGL Settings',
      admin: {
        condition: (_, siblingData) => siblingData.webglEnabled,
      },
      fields: [
        {
          name: 'distortion',
          type: 'number',
          label: 'Distortion Amount',
          defaultValue: 0,
          min: 0,
          max: 1,
          admin: {
            step: 0.1,
          },
        },
        {
          name: 'parallax',
          type: 'number',
          label: 'Parallax Effect',
          defaultValue: 0.1,
          min: 0,
          max: 1,
          admin: {
            step: 0.05,
          },
        },
        {
          name: 'hover',
          type: 'checkbox',
          label: 'Enable Hover Effects',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
    },
    {
      name: 'aspectRatio',
      type: 'select',
      label: 'Aspect Ratio',
      defaultValue: 'original',
      options: [
        {
          label: '16:9',
          value: '16:9',
        },
        {
          label: '4:3',
          value: '4:3',
        },
        {
          label: '1:1',
          value: '1:1',
        },
        {
          label: '9:16',
          value: '9:16',
        },
        {
          label: 'Original',
          value: 'original',
        },
      ],
    },
    ...allBlockOptions,
  ],
}
