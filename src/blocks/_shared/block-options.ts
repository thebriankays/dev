import type { Field } from 'payload'

export const glassEffectFields: Field[] = [
  {
    type: 'group',
    name: 'glassEffect',
    label: 'Glass Effect',
    fields: [
      {
        name: 'enabled',
        type: 'checkbox',
        label: 'Enable Glass Effect',
        defaultValue: false,
      },
      {
        name: 'variant',
        type: 'select',
        label: 'Glass Variant',
        defaultValue: 'card',
        options: [
          { label: 'Card', value: 'card' },
          { label: 'Panel', value: 'panel' },
          { label: 'Subtle', value: 'subtle' },
          { label: 'Frost', value: 'frost' },
          { label: 'Liquid', value: 'liquid' },
        ],
        admin: {
          condition: (_, siblingData) => siblingData?.glassEffect?.enabled,
        },
      },
      {
        name: 'intensity',
        type: 'number',
        label: 'Intensity',
        min: 0,
        max: 1,
        defaultValue: 0.8,
        admin: {
          step: 0.1,
          condition: (_, siblingData) => siblingData?.glassEffect?.enabled,
        },
      },
    ],
  },
]

export const fluidOverlayFields: Field[] = [
  {
    type: 'group',
    name: 'fluidOverlay',
    label: 'Fluid Overlay',
    fields: [
      {
        name: 'enabled',
        type: 'checkbox',
        label: 'Enable Fluid Overlay',
        defaultValue: false,
      },
      {
        name: 'intensity',
        type: 'number',
        label: 'Intensity',
        min: 0,
        max: 1,
        defaultValue: 0.5,
        admin: {
          step: 0.1,
          condition: (_, siblingData) => siblingData?.fluidOverlay?.enabled,
        },
      },
      {
        name: 'color',
        type: 'text',
        label: 'Color',
        defaultValue: '#ffffff',
        admin: {
          condition: (_, siblingData) => siblingData?.fluidOverlay?.enabled,
        },
      },
    ],
  },
]

export const webglEffectFields: Field[] = [
  {
    type: 'group',
    name: 'webglEffects',
    label: 'WebGL Effects',
    fields: [
      {
        name: 'distortion',
        type: 'number',
        label: 'Distortion Amount',
        min: 0,
        max: 1,
        defaultValue: 0,
        admin: {
          step: 0.1,
        },
      },
      {
        name: 'parallax',
        type: 'number',
        label: 'Parallax Amount',
        min: 0,
        max: 1,
        defaultValue: 0.1,
        admin: {
          step: 0.1,
        },
      },
      {
        name: 'hover',
        type: 'checkbox',
        label: 'Enable Hover Effects',
        defaultValue: true,
      },
      {
        name: 'transition',
        type: 'select',
        label: 'Transition Type',
        defaultValue: 'fade',
        options: [
          { label: 'Fade', value: 'fade' },
          { label: 'Slide', value: 'slide' },
          { label: 'Morph', value: 'morph' },
        ],
      },
    ],
  },
]

export const allBlockOptions = [
  ...glassEffectFields,
  ...fluidOverlayFields,
  ...webglEffectFields,
]