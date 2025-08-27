import type { CollectionAfterReadHook } from 'payload'
// import { validateCoordinates } from '@/fields/GooglePlaces/coordinates-helper'
// import type { Destination } from '@/payload-types'

// Simple coordinate validation function
const validateCoordinates = (coords: any) => {
  if (!coords || typeof coords !== 'object') return { lat: 0, lng: 0 }
  return {
    lat: typeof coords.lat === 'number' ? coords.lat : 0,
    lng: typeof coords.lng === 'number' ? coords.lng : 0,
  }
}

/**
 * Normalise `locationData.coordinates` after every read.
 */
export const ensureCoordinates: CollectionAfterReadHook = async ({
  doc,
}) => {
  if (!doc) return doc

  const next = { ...doc }

  if (!next.locationData) next.locationData = {}

  next.locationData.coordinates = validateCoordinates(
    next.locationData.coordinates,
  )

  return next
}