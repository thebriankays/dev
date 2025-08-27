import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Destination } from '../../../payload-types'

export const revalidateDestination: CollectionAfterChangeHook<Destination> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate && typeof window === 'undefined' && payload) {
    if (doc._status === 'published') {
      const path = doc.slug === 'home' ? '/' : `/${doc.slug}`

      payload.logger.info(`Revalidating destination at path: ${path}`)

      // Dynamic import to avoid client-side issues
      import('next/cache').then(({ revalidatePath, revalidateTag }) => {
        revalidatePath(path)
        revalidateTag('destinations-sitemap')
      }).catch(err => {
        payload.logger.error('Failed to revalidate destination:', err)
      })
    }

    // If the page was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPath = previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`

      payload.logger.info(`Revalidating old page at path: ${oldPath}`)

      // Dynamic import to avoid client-side issues
      import('next/cache').then(({ revalidatePath, revalidateTag }) => {
        revalidatePath(oldPath)
        revalidateTag('destinations-sitemap')
      }).catch(err => {
        payload.logger.error('Failed to revalidate old destination:', err)
      })
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Destination> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate && typeof window === 'undefined' && payload) {
    const path = doc?.slug === 'home' ? '/' : `/${doc?.slug}`
    
    payload.logger.info(`Revalidating deleted destination at path: ${path}`)
    
    // Dynamic import to avoid client-side issues
    import('next/cache').then(({ revalidatePath, revalidateTag }) => {
      revalidatePath(path)
      revalidateTag('destinations-sitemap')
    }).catch(err => {
      payload.logger.error('Failed to revalidate deleted destination:', err)
    })
  }

  return doc
}