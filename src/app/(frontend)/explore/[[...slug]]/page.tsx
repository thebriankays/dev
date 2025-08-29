import React, { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { AreaExplorer } from '@/components/AreaExplorer'
import { notFound } from 'next/navigation'
import type { Destination } from '@/payload-types'

// Cache the data fetching function
const getDestinationBySlug = cache(async (slug: string): Promise<Destination | null> => {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'destinations',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  })

  return result.docs[0] || null
})

export default async function ExplorePage({ params }: { params: { slug?: string[] } }) {
  const slug = params.slug?.[0]
  let initialLocation = undefined

  if (slug) {
    const destination = await getDestinationBySlug(slug)

    if (!destination) {
      return notFound()
    }

    // Get location from destination
    if (destination.locationData && typeof destination.locationData === 'object' && 'coordinates' in destination.locationData) {
      const coords = destination.locationData.coordinates as any
      if (coords && 'lat' in coords && 'lng' in coords) {
        initialLocation = {
          lat: coords.lat as number,
          lng: coords.lng as number,
          name: destination.title,
        }
      }
    }
  }

  return <AreaExplorer initialLocation={initialLocation} />
}
