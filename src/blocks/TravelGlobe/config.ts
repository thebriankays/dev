import type { Block } from 'payload'
import { allBlockOptions } from '../_shared/block-options'

export const TravelGlobe: Block = {
  slug: 'travelGlobe',
  interfaceName: 'TravelGlobeBlock',
  fields: [
    {
      name: 'destinations',
      type: 'array',
      label: 'Travel Destinations',
      fields: [
        {
          name: 'id',
          type: 'text',
          label: 'ID',
          required: true,
        },
        {
          name: 'name',
          type: 'text',
          label: 'Name',
          required: true,
        },
        {
          name: 'position',
          type: 'group',
          label: 'Coordinates',
          fields: [
            {
              name: 'lat',
              type: 'number',
              label: 'Latitude',
              required: true,
              min: -90,
              max: 90,
            },
            {
              name: 'lng',
              type: 'number',
              label: 'Longitude',
              required: true,
              min: -180,
              max: 180,
            },
          ],
        },
        {
          name: 'visitors',
          type: 'number',
          label: 'Annual Visitors',
          min: 0,
        },
        {
          name: 'category',
          type: 'select',
          label: 'Category',
          options: [
            { label: 'City', value: 'city' },
            { label: 'Beach', value: 'beach' },
            { label: 'Mountain', value: 'mountain' },
            { label: 'Historic', value: 'historic' },
            { label: 'Adventure', value: 'adventure' },
          ],
          defaultValue: 'city',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
        },
        {
          name: 'imageUrl',
          type: 'text',
          label: 'Image URL',
        },
      ],
    },
    {
      name: 'routes',
      type: 'array',
      label: 'Flight Routes',
      fields: [
        {
          name: 'id',
          type: 'text',
          label: 'ID',
          required: true,
        },
        {
          name: 'from',
          type: 'text',
          label: 'From (Destination ID)',
          required: true,
        },
        {
          name: 'to',
          type: 'text',
          label: 'To (Destination ID)',
          required: true,
        },
        {
          name: 'flights',
          type: 'number',
          label: 'Daily Flights',
          min: 0,
          defaultValue: 1,
        },
        {
          name: 'type',
          type: 'select',
          label: 'Route Type',
          options: [
            { label: 'Direct', value: 'direct' },
            { label: 'Popular', value: 'popular' },
            { label: 'Seasonal', value: 'seasonal' },
          ],
          defaultValue: 'direct',
        },
      ],
    },
    {
      name: 'globeSettings',
      type: 'group',
      label: 'Globe Settings',
      fields: [
        {
          name: 'interactive',
          type: 'checkbox',
          label: 'Enable Interactivity',
          defaultValue: true,
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
          defaultValue: 0.5,
          min: 0,
          max: 2,
          admin: {
            step: 0.1,
            condition: (_, data) => data?.globeSettings?.autoRotate,
          },
        },
        {
          name: 'showAtmosphere',
          type: 'checkbox',
          label: 'Show Atmosphere',
          defaultValue: true,
        },
        {
          name: 'showClouds',
          type: 'checkbox',
          label: 'Show Clouds',
          defaultValue: true,
        },
        {
          name: 'showNightLights',
          type: 'checkbox',
          label: 'Show Night Lights',
          defaultValue: true,
        },
        {
          name: 'enableFilters',
          type: 'checkbox',
          label: 'Enable Category Filters',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'appearance',
      type: 'group',
      label: 'Appearance',
      fields: [
        {
          name: 'globeColor',
          type: 'text',
          label: 'Globe Base Color',
          defaultValue: '#1e3a8a',
          admin: {
            description: 'Hex color code for the globe base',
          },
        },
        {
          name: 'landColor',
          type: 'text',
          label: 'Land Color',
          defaultValue: '#2563eb',
          admin: {
            description: 'Hex color code for land masses',
          },
        },
        {
          name: 'atmosphereColor',
          type: 'text',
          label: 'Atmosphere Color',
          defaultValue: '#60a5fa',
          admin: {
            description: 'Hex color code for the atmosphere glow',
          },
        },
        {
          name: 'markerColor',
          type: 'text',
          label: 'Default Marker Color',
          defaultValue: '#fbbf24',
          admin: {
            description: 'Hex color code for destination markers',
          },
        },
        {
          name: 'routeColor',
          type: 'text',
          label: 'Route Color',
          defaultValue: '#f59e0b',
          admin: {
            description: 'Hex color code for flight routes',
          },
        },
      ],
    },
    {
      name: 'customTextures',
      type: 'group',
      label: 'Custom Textures',
      fields: [
        {
          name: 'earthTexture',
          type: 'upload',
          label: 'Earth Texture',
          relationTo: 'media',
          filterOptions: {
            mimeType: {
              contains: 'image',
            },
          },
        },
        {
          name: 'bumpTexture',
          type: 'upload',
          label: 'Bump Map Texture',
          relationTo: 'media',
          filterOptions: {
            mimeType: {
              contains: 'image',
            },
          },
        },
        {
          name: 'specularTexture',
          type: 'upload',
          label: 'Specular Map',
          relationTo: 'media',
          filterOptions: {
            mimeType: {
              contains: 'image',
            },
          },
        },
        {
          name: 'cloudTexture',
          type: 'upload',
          label: 'Cloud Texture',
          relationTo: 'media',
          filterOptions: {
            mimeType: {
              contains: 'image',
            },
          },
        },
      ],
    },
    ...allBlockOptions,
  ],
}