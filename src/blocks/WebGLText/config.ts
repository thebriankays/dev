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
    {
      name: 'webglEffects',
      type: 'group',
      label: 'WebGL Effect Settings',
      fields: [
        {
          name: 'distortion',
          type: 'number',
          label: 'Distortion Amount',
          defaultValue: 0.5,
          min: 0,
          max: 2,
          admin: {
            condition: (_, data) => data?.effect === 'distortion',
          },
        },
        {
          name: 'glitchAmount',
          type: 'number',
          label: 'Glitch Intensity',
          defaultValue: 0.5,
          min: 0,
          max: 1,
          admin: {
            condition: (_, data) => data?.effect === 'glitch',
          },
        },
        {
          name: 'waveFrequency',
          type: 'number',
          label: 'Wave Frequency',
          defaultValue: 10,
          min: 1,
          max: 50,
          admin: {
            condition: (_, data) => data?.effect === 'wave',
          },
        },
        {
          name: 'waveAmplitude',
          type: 'number',
          label: 'Wave Amplitude',
          defaultValue: 0.1,
          min: 0,
          max: 1,
          admin: {
            condition: (_, data) => data?.effect === 'wave',
          },
        },
        {
          name: 'particleCount',
          type: 'number',
          label: 'Particle Dispersion',
          defaultValue: 50,
          min: 10,
          max: 200,
          admin: {
            condition: (_, data) => data?.effect === 'particles',
          },
        },
        {
          name: 'morphDuration',
          type: 'number',
          label: 'Morph Duration (seconds)',
          defaultValue: 2,
          min: 0.5,
          max: 5,
          admin: {
            condition: (_, data) => data?.effect === 'morph',
          },
        },
        {
          name: 'outlineWidth',
          type: 'number',
          label: 'Outline Width',
          defaultValue: 0.1,
          min: 0.01,
          max: 0.5,
          admin: {
            condition: (_, data) => data?.effect === 'outline',
          },
        },
        {
          name: 'hover',
          type: 'checkbox',
          label: 'Enable Hover Interactions',
          defaultValue: true,
        },
        {
          name: 'parallax',
          type: 'number',
          label: 'Parallax Amount',
          defaultValue: 0.5,
          min: 0,
          max: 2,
        },
      ],
    },
    ...allBlockOptions,
  ],
}