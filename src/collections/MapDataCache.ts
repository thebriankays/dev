import type { CollectionConfig } from 'payload'

export interface MapDataCacheItem {
  id: string
  destinationId: string
  cacheKey: string
  dataType: 'cesium-tiles' | 'places-nearby' | 'place-details'
  coordinates: {
    lat: number
    lng: number
  }
  searchParams?: {
    radius?: number
    types?: string[]
  }
  data: any // The cached response data
  expiresAt: Date
  createdAt?: Date
  updatedAt?: Date
}

export const MapDataCache: CollectionConfig = {
  slug: 'map-data-cache',
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },
  admin: {
    group: 'System',
    hidden: true, // Hide from admin UI as it's system-managed
    useAsTitle: 'cacheKey',
    defaultColumns: ['cacheKey', 'dataType', 'destinationId', 'expiresAt'],
  },
  fields: [
    {
      name: 'destinationId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'ID of the destination this cache belongs to',
      },
    },
    {
      name: 'cacheKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique cache key for this data',
      },
    },
    {
      name: 'dataType',
      type: 'select',
      required: true,
      options: [
        { label: 'Cesium 3D Tiles', value: 'cesium-tiles' },
        { label: 'Places Nearby Search', value: 'places-nearby' },
        { label: 'Place Details', value: 'place-details' },
      ],
    },
    {
      name: 'coordinates',
      type: 'group',
      fields: [
        {
          name: 'lat',
          type: 'number',
          required: true,
        },
        {
          name: 'lng',
          type: 'number',
          required: true,
        },
      ],
    },
    {
      name: 'searchParams',
      type: 'group',
      admin: {
        condition: (data, siblingData) => siblingData?.dataType === 'places-nearby',
      },
      fields: [
        {
          name: 'radius',
          type: 'number',
        },
        {
          name: 'types',
          type: 'json',
          admin: {
            description: 'Array of place types that were searched',
          },
        },
      ],
    },
    {
      name: 'data',
      type: 'json',
      required: true,
      admin: {
        description: 'The cached response data',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
      admin: {
        description: 'When this cache entry expires',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Generate cache key if not provided
        if (!data.cacheKey) {
          const { dataType, coordinates, searchParams } = data
          let key = `${dataType}-${coordinates.lat.toFixed(6)}-${coordinates.lng.toFixed(6)}`
          
          if (dataType === 'places-nearby' && searchParams) {
            key += `-r${searchParams.radius || 1000}`
            if (searchParams.types?.length) {
              key += `-t${searchParams.types.sort().join(',')}`
            }
          }
          
          data.cacheKey = key
        }
        
        // Set expiration if not provided (default 7 days)
        if (!data.expiresAt) {
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 7)
          data.expiresAt = expiresAt
        }
        
        return data
      },
    ],
  },
  indexes: [
    {
      fields: ['destinationId', 'dataType'],
    },
    {
      fields: ['cacheKey', 'expiresAt'],
    },
  ],
}

export default MapDataCache