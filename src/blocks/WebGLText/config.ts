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
        { label: 'None', value: 'none' },
        { label: 'Distortion', value: 'distortion' },
        { label: 'Glitch', value: 'glitch' },
        { label: 'Wave', value: 'wave' },
        { label: 'Particles', value: 'particles' },
        { label: 'Morph', value: 'morph' },
        { label: 'Outline', value: 'outline' },
      ],
    },
    {
      name: 'color',
      type: 'text',
      label: 'Text Color',
      defaultValue: '#ffffff',
      admin: {
        description: 'Hex color code for the text',
      },
    },
    {
      name: 'font',
      type: 'text',
      label: 'Font Path',
      defaultValue: '/fonts/Humane-Bold.ttf',
      admin: {
        description: 'Path to the font file',
      },
    },
    {
      name: 'animationTrigger',
      type: 'select',
      label: 'Animation Trigger',
      defaultValue: 'onLoad',
      options: [
        { label: 'On Load', value: 'onLoad' },
        { label: 'On Hover', value: 'onHover' },
        { label: 'On Scroll', value: 'onScroll' },
        { label: 'Continuous', value: 'continuous' },
      ],
    },
    {
      name: 'secondaryText',
      type: 'text',
      label: 'Secondary Text (for Morph effect)',
      admin: {
        condition: (_, data) => data?.effect === 'morph',
      },
    },
    ...allBlockOptions,
  ],
}