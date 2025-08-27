import type { CollectionConfig } from 'payload'

export const MichelinRestaurants: CollectionConfig = {
  slug: 'michelin-restaurants',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'country', 'rating', 'award', 'type', 'greenStar'],
    group: 'Data Source',
  },
  
  indexes: [
    { fields: ['name'] },
    { fields: ['country'] },
    { fields: ['location.city'] },
    { fields: ['location.destination'] },
    { fields: ['rating'] },
    { fields: ['type'] },
    { fields: ['greenStar'] },
    { fields: ['isActive'] },
    // Compound indexes for common queries
    { fields: ['country', 'rating'] },
    { fields: ['country', 'type'] },
    { fields: ['location.city', 'rating'] },
    // Geospatial queries
    { fields: ['location.latitude', 'location.longitude'] },
  ],

  fields: [
    /* ---------- core ------------------------------------------------ */
    { name: 'name', type: 'text', required: true, index: true },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 3,
      admin: { description: 'Michelin stars (1 – 3)' },
    },
    { name: 'year', type: 'number' },

    /* ---------- links / contact ------------------------------------ */
    { name: 'link', type: 'text' },
    { name: 'website', type: 'text' },
    { name: 'phone', type: 'text' },

    /* ---------- NEW : media gallery -------------------------------- */
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'Images pulled from Michelin Guide' },
    },

    /* ---------- relations ------------------------------------------ */
    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      index: true,
      admin: { position: 'sidebar' },
    },

    /* ---------- location (lat/lon now required) -------------------- */
    {
      name: 'location',
      type: 'group',
      fields: [
        { name: 'latitude', type: 'number', required: false },
        { name: 'longitude', type: 'number', required: false },
        { name: 'address', type: 'textarea' },
        { name: 'city', type: 'text' },
        {
          name: 'destination',
          type: 'relationship',
          relationTo: 'destinations',
        },
      ],
    },

    /* ---------- classification ------------------------------------- */
    {
      name: 'type',
      type: 'select',
      defaultValue: 'restaurant',
      options: [
        { label: 'Restaurant', value: 'restaurant' },
        { label: 'Bib Gourmand', value: 'bib-gourmand' },
        { label: 'Green Star', value: 'green-star' },
        { label: 'Young Chef', value: 'young-chef' },
      ],
    },
    { name: 'award', type: 'text' },
    { name: 'cuisine', type: 'text' },
    {
      name: 'priceRange',
      type: 'select',
      options: [
        { label: '$', value: '1' },
        { label: '$$', value: '2' },
        { label: '$$$', value: '3' },
        { label: '$$$$', value: '4' },
      ],
    },

    /* ---------- NEW : Green-Star flag ------------------------------ */
    { name: 'greenStar', type: 'checkbox', label: 'Green Star' },

    /* ---------- narrative ------------------------------------------ */
    { name: 'description', type: 'textarea' },

    /* ---------- misc ----------------------------------------------- */
    { name: 'isActive', type: 'checkbox', defaultValue: true },
  ],

  /* existing hook to auto-link destination stays unchanged ---------- */
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (data.location?.city && !data.location?.destination) {
          const dest = await req.payload.find({
            collection: 'destinations',
            where: { city: { equals: data.location.city } },
            limit: 1,
          })
          if (dest.docs[0] && data.location) data.location.destination = dest.docs[0].id
        }
        return data
      },
    ],
  },
}

export default MichelinRestaurants