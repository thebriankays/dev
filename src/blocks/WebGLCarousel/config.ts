import type { Block } from 'payload'

export const WebGLCarousel: Block = {
  slug: 'webglCarousel',
  interfaceName: 'WebGLCarouselBlockType',
  labels: {
    singular: 'WebGL Carousel',
    plural: 'WebGL Carousels',
  },
  fields: [
    {
      name: 'slides',
      type: 'array',
      label: 'Carousel Slides',
      required: true,
      minRows: 2,
      maxRows: 10,
      fields: [
        {
          name: 'image',
          type: 'upload',
          label: 'Slide Image',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          admin: {
            rows: 3,
          },
        },
        {
          name: 'cta',
          type: 'group',
          label: 'Call to Action',
          fields: [
            {
              name: 'text',
              type: 'text',
              label: 'Button Text',
            },
            {
              name: 'href',
              type: 'text',
              label: 'Button Link',
            },
          ],
        },
      ],
    },
    {
      name: 'autoPlay',
      type: 'checkbox',
      label: 'Auto Play',
      defaultValue: true,
    },
    {
      name: 'autoPlayInterval',
      type: 'number',
      label: 'Auto Play Interval (ms)',
      defaultValue: 5000,
      min: 2000,
      max: 10000,
      admin: {
        condition: (data) => data?.autoPlay === true,
      },
    },
    {
      name: 'transitionEffect',
      type: 'select',
      label: 'Transition Effect',
      defaultValue: 'wave',
      options: [
        { label: 'Wave', value: 'wave' },
        { label: 'Dissolve', value: 'dissolve' },
        { label: 'Zoom', value: 'zoom' },
        { label: 'Distortion', value: 'distortion' },
        { label: 'Glitch', value: 'glitch' },
      ],
    },
    {
      name: 'enableSwipe',
      type: 'checkbox',
      label: 'Enable Touch/Swipe',
      defaultValue: true,
    },
    {
      name: 'enableKeyboard',
      type: 'checkbox',
      label: 'Enable Keyboard Navigation',
      defaultValue: true,
    },
    {
      name: 'showControls',
      type: 'checkbox',
      label: 'Show Navigation Arrows',
      defaultValue: true,
    },
    {
      name: 'showIndicators',
      type: 'checkbox',
      label: 'Show Slide Indicators',
      defaultValue: true,
    },
    {
      name: 'glassEffect',
      type: 'group',
      label: 'Glass Morphism Effect',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable Glass Effect',
          defaultValue: true,
        },
        {
          name: 'variant',
          type: 'select',
          label: 'Glass Variant',
          defaultValue: 'panel',
          options: [
            { label: 'Card', value: 'card' },
            { label: 'Panel', value: 'panel' },
            { label: 'Subtle', value: 'subtle' },
            { label: 'Frost', value: 'frost' },
            { label: 'Liquid', value: 'liquid' },
          ],
          admin: {
            condition: (data) => data?.glassEffect?.enabled === true,
          },
        },
        {
          name: 'intensity',
          type: 'number',
          label: 'Intensity',
          min: 0,
          max: 1,
          defaultValue: 0.5,
          admin: {
            condition: (data) => data?.glassEffect?.enabled === true,
            step: 0.1,
          },
        },
      ],
    },
    {
      name: 'fluidOverlay',
      type: 'group',
      label: 'Fluid Overlay Effect',
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
          defaultValue: 0.3,
          admin: {
            condition: (data) => data?.fluidOverlay?.enabled === true,
            step: 0.1,
          },
        },
        {
          name: 'color',
          type: 'text',
          label: 'Color (hex)',
          defaultValue: '#0066ff',
          admin: {
            condition: (data) => data?.fluidOverlay?.enabled === true,
          },
        },
      ],
    },
  ],
}