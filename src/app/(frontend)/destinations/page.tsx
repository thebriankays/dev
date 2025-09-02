import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page() {
  const payload = await getPayload({ config: configPromise })

  const destinations = await payload.find({
    collection: 'destinations',
    depth: 1,
    limit: 12,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      country: true,
      city: true,
      continent: true,
      featuredImage: true,
      flagSvg: true,
      countryData: true,
    },
  })

  return (
    <div>
      <PageClient />
      
      <div className="pt-24 pb-24">
        <div className="container mb-16">
          <div className="prose dark:prose-invert max-w-none">
            <h1>Destinations</h1>
          </div>
        </div>

        <div className="container mb-8">
          <PageRange
            collection="destinations"
            currentPage={destinations.page}
            limit={12}
            totalDocs={destinations.totalDocs}
          />
        </div>

        <CollectionArchive posts={destinations.docs} relationTo="destinations" />

        <div className="container">
          {destinations.totalPages > 1 && destinations.page && (
            <Pagination page={destinations.page} totalPages={destinations.totalPages} />
          )}
        </div>
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Travel Destinations`,
  }
}