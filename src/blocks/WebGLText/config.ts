import type { Block } from 'payload'
import { allBlockOptions } from '../_shared/block-options'

export const WebGLText: Block = {
  slug: 'webGLText',
  interfaceName: 'WebGLTextBlock',
  fields: [
    {
      name: 'text',
      type: 'text',
      label: 'Text',
      required: true,
    },
    {
      name: 'fontSize',
      type: 'select',
      label: 'Font Size',
      defaultValue: 'large',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
        { label: 'Extra Large', value: 'xlarge' },
      ],
    },
    {
      name: 'textAlign',
      type: 'select',
      label: 'Text Alignment',
      defaultValue: 'center',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    },
    {
      name: 'effect',
      type: 'select',
      label: 'Text Effect',
      defaultValue: 'distortion',
      options: [
        { label: 'Distortion', value: 'distortion' },
        { label: 'Wave', value: 'wave' },
        { label: 'Particles', value: 'particles' },
      ],
    },
    ...allBlockOptions,
  ],
}