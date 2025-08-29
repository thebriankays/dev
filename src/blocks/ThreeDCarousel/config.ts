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
      label: 'Carousel Images',
      minRows: 8,
      maxRows: 8,
      admin: {
        description: 'Add exactly 8 images for the carousel',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Image',
        },
      ],
    },
    {
      name: 'showBanner',
      type: 'checkbox',
      label: 'Show Banner',
      defaultValue: true,
      admin: {
        description: 'Display the animated banner at the bottom',
      },
    },
    {
      name: 'bannerImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Banner Image',
      admin: {
        condition: (_, siblingData) => siblingData.showBanner,
        description: 'Image for the rotating banner (optional)',
      },
    },
    {
      name: 'radius',
      type: 'number',
      label: 'Carousel Radius',
      defaultValue: 1.4,
      min: 1,
      max: 3,
      admin: {
        step: 0.1,
        description: 'Distance of images from center',
      },
    },
    {
      name: 'enableFog',
      type: 'checkbox',
      label: 'Enable Fog Effect',
      defaultValue: true,
    },
    {
      name: 'scrollPages',
      type: 'number',
      label: 'Scroll Pages',
      defaultValue: 4,
      min: 1,
      max: 10,
      admin: {
        description: 'Number of scroll pages for infinite rotation',
      },
    },
    ...allBlockOptions,
  ],
}