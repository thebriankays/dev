import type { Block } from 'payload'

export const TravelDataGlobeBlock: Block = {
  slug: 'travelDataGlobeBlock',
  labels: {
    singular: 'Travel Data Globe',
    plural: 'Travel Data Globes',
  },
  fields: [
    {
      name: 'blockConfig',
      type: 'group',
      fields: [
        {
          name: 'globeImageUrl',
          type: 'text',
          label: 'Globe Texture URL',
          defaultValue: '/earth-blue-marble.jpg',
          admin: {
            description: 'URL of the image used to wrap the globe (equirectangular projection)',
          },
        },
        {
          name: 'bumpImageUrl',
          type: 'text',
          label: 'Bump Map URL',
          defaultValue: '/earth-topology.png',
          admin: {
            description: 'URL of the bump map for terrain representation',
          },
        },
        {
          name: 'autoRotateSpeed',
          type: 'number',
          label: 'Auto Rotate Speed',
          defaultValue: 0.5,
          admin: {
            description: 'Speed of automatic rotation (0 = no rotation)',
          },
        },
        {
          name: 'atmosphereColor',
          type: 'text',
          label: 'Atmosphere Color',
          defaultValue: '#3a7ca5',
          admin: {
            description: 'Color of the atmosphere glow',
          },
        },
        {
          name: 'atmosphereAltitude',
          type: 'number',
          label: 'Atmosphere Altitude',
          defaultValue: 0.15,
          admin: {
            description: 'Height of atmosphere in globe radius units',
          },
        },
        {
          name: 'enableGlassEffect',
          type: 'checkbox',
          label: 'Enable Glass Effect',
          defaultValue: true,
          admin: {
            description: 'Apply glass morphism effect to UI panels',
          },
        },
        {
          name: 'showTravelAdvisories',
          type: 'checkbox',
          label: 'Show Travel Advisories',
          defaultValue: true,
        },
        {
          name: 'showVisaRequirements',
          type: 'checkbox',
          label: 'Show Visa Requirements',
          defaultValue: true,
        },
        {
          name: 'showAirports',
          type: 'checkbox',
          label: 'Show Airports',
          defaultValue: true,
        },
        {
          name: 'showMichelinRestaurants',
          type: 'checkbox',
          label: 'Show Michelin Restaurants',
          defaultValue: true,
        },
      ],
    },
  ],
}