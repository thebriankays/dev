import type { Field } from 'payload'

export const googlePlaces = ({
  name = 'locationData',
  label = 'Location',
  admin = {},
  useExtended = true, // Use Extended Component Library by default
} = {}): Field => {
  return {
    name,
    label,
    type: 'group',
    fields: [
      { name: 'address', type: 'text' },
      {
        name: 'coordinates',
        type: 'group',
        fields: [
          { name: 'lat', type: 'number' },
          { name: 'lng', type: 'number' },
        ],
      },
      { name: 'placeID', type: 'text' },
      { name: 'country', type: 'text' },
      { name: 'continent', type: 'text' },
      { name: 'city', type: 'text' },
      { name: 'state', type: 'text' },
      { name: 'googleMapsUri', type: 'text' },
      { name: 'isGoodForChildren', type: 'checkbox' },
      { name: 'isGoodForGroups', type: 'checkbox' },
      { name: 'priceLevel', type: 'number' },
      { name: 'rating', type: 'number' },
      { name: 'user_ratings_total', type: 'number' },
      {
        name: 'reviews',
        type: 'array',
        fields: [
          { name: 'author_name', type: 'text', label: 'Author Name' },
          { name: 'rating', type: 'number', label: 'Rating' },
          { name: 'text', type: 'textarea', label: 'Review Text' },
        ],
      },
      {
        name: 'photos',
        type: 'array',
        fields: [
          { name: 'photo_reference', type: 'text', label: 'Photo Reference' },
          { name: 'height', type: 'number', label: 'Height' },
          { name: 'width', type: 'number', label: 'Width' },
        ],
      },
      // Store temporary country data that will be used to find/create relationships
      {
        name: 'tempCountryData',
        type: 'group',
        admin: {
          hidden: true, // This is just temporary storage for the hook to process
        },
        fields: [
          { name: 'countryName', type: 'text' },
          { name: 'countryCode', type: 'text' },
          { name: 'currencyCode', type: 'text' },
          { name: 'languageCode', type: 'text' },
          { name: 'region', type: 'text' },
        ],
      },
    ],
    admin: {
      components: {
        Field: useExtended 
          ? '@/fields/GooglePlaces/GooglePlacesFieldExtended' 
          : '@/fields/GooglePlaces/GooglePlacesField',
      },
      ...admin,
    },
  }
}