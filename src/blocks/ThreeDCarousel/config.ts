import type { Block } from 'payload'
import { allBlockOptions } from '../_shared/block-options'

export const ThreeDCarousel: Block = {
  slug: 'threeDCarousel',
  interfaceName: 'ThreeDCarouselBlock',
  labels: {
    singular: '3D Carousel',
    plural: '3D Carousels',
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Carousel Items',
      minRows: 1,
      maxRows: 20,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Image',
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Title',
        },
        {
          name: 'subtitle',
          type: 'text',
          label: 'Subtitle',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
        },
        {
          name: 'link',
          type: 'text',
          label: 'Link URL',
        },
        {
          name: 'metadata',
          type: 'group',
          label: 'Metadata',
          fields: [
            {
              name: 'rating',
              type: 'number',
              label: 'Rating',
              min: 0,
              max: 5,
              admin: {
                step: 0.1,
              },
            },
            {
              name: 'price',
              type: 'text',
              label: 'Price',
            },
            {
              name: 'location',
              type: 'text',
              label: 'Location',
            },
            {
              name: 'date',
              type: 'date',
              label: 'Date',
            },
          ],
        },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      label: 'Carousel Layout',
      defaultValue: 'circular',
      options: [
        {
          label: 'Circular',
          value: 'circular',
        },
        {
          label: 'Helix',
          value: 'helix',
        },
        {
          label: 'Wave',
          value: 'wave',
        },
        {
          label: 'Cylinder',
          value: 'cylinder',
        },
      ],
    },
    {
      name: 'autoRotate',
      type: 'checkbox',
      label: 'Auto Rotate',
      defaultValue: true,
    },
    {
      name: 'rotationSpeed',
      type: 'number',
      label: 'Rotation Speed',
      defaultValue: 1,
      min: 0,
      max: 5,
      admin: {
        step: 0.1,
        condition: (_, siblingData) => siblingData.autoRotate,
      },
    },
    {
      name: 'enableReflections',
      type: 'checkbox',
      label: 'Enable Reflections',
      defaultValue: true,
    },
    {
      name: 'enableParticles',
      type: 'checkbox',
      label: 'Enable Particles',
      defaultValue: false,
    },
    {
      name: 'enableDepthFade',
      type: 'checkbox',
      label: 'Enable Depth Fade',
      defaultValue: true,
    },
    {
      name: 'radius',
      type: 'number',
      label: 'Radius',
      defaultValue: 3,
      min: 1,
      max: 10,
      admin: {
        step: 0.1,
      },
    },
    {
      name: 'spacing',
      type: 'number',
      label: 'Spacing',
      defaultValue: 1,
      min: 0.5,
      max: 3,
      admin: {
        step: 0.1,
      },
    },
    {
      name: 'itemsVisible',
      type: 'number',
      label: 'Items Visible',
      defaultValue: 5,
      min: 3,
      max: 12,
    },
    {
      name: 'showControls',
      type: 'checkbox',
      label: 'Show Controls',
      defaultValue: true,
    },
    {
      name: 'showIndicators',
      type: 'checkbox',
      label: 'Show Indicators',
      defaultValue: true,
    },
    ...allBlockOptions,
  ],
}