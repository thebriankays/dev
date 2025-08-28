import type { Block } from 'payload'
import { allBlockOptions } from '../_shared/block-options'

export const DolphinBlock: Block = {
  slug: 'dolphinBlock',
  interfaceName: 'DolphinBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      defaultValue: 'Dolphins in the Sea',
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      defaultValue: 'An immersive underwater experience',
    },
    {
      name: 'sceneSettings',
      type: 'group',
      label: 'Scene Settings',
      fields: [
        {
          name: 'cameraDistance',
          type: 'number',
          label: 'Camera Distance',
          defaultValue: 162,
          min: 40,
          max: 200,
          admin: {
            step: 1,
            description: 'Distance from the camera to the scene center',
          },
        },
        {
          name: 'waterColor',
          type: 'text',
          label: 'Water Color',
          defaultValue: '#001e0f',
          admin: {
            description: 'Hex color code for the water',
          },
        },
        {
          name: 'skyTurbidity',
          type: 'number',
          label: 'Sky Turbidity',
          defaultValue: 10,
          min: 0,
          max: 20,
          admin: {
            step: 0.5,
            description: 'Haziness of the atmosphere',
          },
        },
        {
          name: 'sunElevation',
          type: 'number',
          label: 'Sun Elevation',
          defaultValue: 2,
          min: -90,
          max: 90,
          admin: {
            step: 1,
            description: 'Sun position in degrees above horizon',
          },
        },
      ],
    },
    {
      name: 'dolphins',
      type: 'group',
      label: 'Dolphin Settings',
      fields: [
        {
          name: 'count',
          type: 'select',
          label: 'Number of Dolphins',
          defaultValue: '3',
          options: [
            { label: '1 Dolphin', value: '1' },
            { label: '2 Dolphins', value: '2' },
            { label: '3 Dolphins', value: '3' },
          ],
        },
        {
          name: 'animationSpeed',
          type: 'number',
          label: 'Animation Speed',
          defaultValue: 3,
          min: 1,
          max: 10,
          admin: {
            step: 0.5,
            description: 'Speed of dolphin swimming animation',
          },
        },
        {
          name: 'pathVariation',
          type: 'select',
          label: 'Path Variation',
          defaultValue: 'default',
          options: [
            { label: 'Default Paths', value: 'default' },
            { label: 'Wide Paths', value: 'wide' },
            { label: 'Narrow Paths', value: 'narrow' },
          ],
        },
      ],
    },
    {
      name: 'interaction',
      type: 'group',
      label: 'Interaction Settings',
      fields: [
        {
          name: 'enableOrbitControls',
          type: 'checkbox',
          label: 'Enable Orbit Controls',
          defaultValue: true,
          admin: {
            description: 'Allow users to rotate and zoom the camera',
          },
        },
        {
          name: 'autoRotate',
          type: 'checkbox',
          label: 'Auto Rotate Camera',
          defaultValue: false,
        },
        {
          name: 'rotationSpeed',
          type: 'number',
          label: 'Rotation Speed',
          defaultValue: 0.5,
          min: 0.1,
          max: 2,
          admin: {
            step: 0.1,
            condition: (_, siblingData) => siblingData?.interaction?.autoRotate,
          },
        },
      ],
    },
    {
      name: 'height',
      type: 'select',
      label: 'Block Height',
      defaultValue: 'full',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
        { label: 'Full Screen', value: 'full' },
      ],
    },
    ...allBlockOptions,
  ],
}