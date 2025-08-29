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
      name: 'images',
      type: 'array',
      label: 'Images',
      required: true,
      minRows: 3,
      maxRows: 20,
      fields: [
        {
          name: 'image',
          type: 'upload',
          label: 'Image',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'enablePostProcessing',
      type: 'checkbox',
      label: 'Enable Glass Effect',
      defaultValue: true,
    },
    {
      name: 'planeSettings',
      type: 'group',
      label: 'Plane Settings',
      fields: [
        {
          name: 'width',
          type: 'number',
          label: 'Width',
          defaultValue: 1,
          min: 0.5,
          max: 3,
          admin: {
            step: 0.1,
          },
        },
        {
          name: 'height',
          type: 'number',
          label: 'Height',
          defaultValue: 2.5,
          min: 1,
          max: 4,
          admin: {
            step: 0.1,
          },
        },
        {
          name: 'gap',
          type: 'number',
          label: 'Gap',
          defaultValue: 0.1,
          min: 0,
          max: 0.5,
          admin: {
            step: 0.05,
          },
        },
      ],
    },
  ],
}