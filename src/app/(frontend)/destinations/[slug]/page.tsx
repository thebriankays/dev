import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { RenderBlocks } from '@/blocks/RenderBlocks'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const destinations = await payload.find({
    collection: 'destinations',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = destinations.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function DestinationPage({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  const url = '/destinations/' + slug
  const destination = await queryDestinationBySlug({ slug })

  if (!destination) return <PayloadRedirects url={url} />

  // Create blocks dynamically for the destination template
  // These match the structure that RenderBlocks expects
  const blocks = [
    {
      blockType: 'destinationDetailBlock' as const,
      destination: destination,
      background: { backgroundType: 'transparent' as const },
      separatorLinesColor: '#ffd074',
      quickLookColor: '#ffffff',
      destinationTitleColor: '#ffffff',
      textColor: '#ffffff',
      fieldLabelsColor: '#ffffff',
      flagSettings: {
        animationSpeed: 6,
        wireframe: false,
        segments: 64,
        frequencyX: 5,
        frequencyY: 3,
        strength: 0.2,
        showControls: false,
      },
    } as const,
    {
      blockType: 'weatherCardBlock' as const,
      title: 'Weather Forecast',
      location: destination.title,
      lat: destination.locationData?.coordinates?.lat || destination.lat || null,
      lng: destination.locationData?.coordinates?.lng || destination.lng || null,
      useMockData: false,
    } as const,
  ]

  return (
    <article>
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <div className="pt-16 pb-16">
        <div className="container mb-8">
          <h1 className="text-4xl font-bold">{destination.title}</h1>
        </div>

        {/* Render blocks using the same system as pages */}
        <RenderBlocks blocks={blocks} />
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const destination = await queryDestinationBySlug({ slug })

  return generateMeta({ doc: destination })
}

const queryDestinationBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'destinations',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})