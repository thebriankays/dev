import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'

import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageHero1 } from './image-hero-1'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'
import { seedLocationData } from './location-data-complete'
import { seedMichelinRestaurants } from './michelin-restaurants'
import { seedTravelAdvisories } from './travel-advisories'
import { seedCrimeIndexData } from './crime-index'
import { seedCountryDetails, seedCountryMedia } from './country-details'
import { seedConsolidatedCountryData } from './country-consolidation'
import seedOpenFlightsData from './openflights-data'

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'posts',
  'forms',
  'form-submissions',
  'search',
  'currencies',
  'languages',
  'timezones',
  'countries',
  'regions',
  'airports',
  'airlines',
  'routes',
  'destination-categories',
  'destination-types',
  'visa-requirements',
  'michelin-restaurants',
  'travel-advisories',
  'crime-index-scores',
  'crime-trends',
  'country-details',
  'country-media',
  'users',
  'leads',
  'sales-funnel',
  'social-media-posts',
  'categories',
]
const globals: GlobalSlug[] = ['header', 'footer', 'site-settings']

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // Test database connection
  try {
    const testCount = await payload.count({ collection: 'users' })
    payload.logger.info(`Database connected - found ${testCount.totalDocs} users`)
  } catch (error) {
    payload.logger.error('Database connection error:', error)
    throw new Error('Cannot connect to database')
  }

  // Clear all collections first to ensure a fresh start
  payload.logger.info('— Clearing all collections...')

  // Clear collections in reverse dependency order
  const collectionsToClean = [
    // Skip very large collections for now - we'll handle them differently
    // 'visa-requirements', // 48k+ records
    // 'michelin-restaurants', // 6k+ records
    // 'airports', // 6k+ records
    // 'regions', // 4k+ records

    // Clear smaller collections first
    'social-media-posts',
    'sales-funnels',
    'leads',
    'categories',
    'posts',
    'pages',
    'form-submissions',
    'forms',
    'search',
    'media',
    'categories',
    'travel-advisories',
    'crime-trends',
    'crime-index-scores',
    'country-details',
    'country-media',
    'destination-types',
    'destination-categories',
    'countries', // 250 records
    'timezones',
    'languages',
    'currencies',
  ]

  for (const collection of collectionsToClean) {
    try {
      // Skip collections that don't exist
      if (collection === 'sales-funnels' || collection === 'social-media-posts') {
        continue
      }

      payload.logger.info(`  Clearing ${collection}...`)
      const count = await payload.count({ collection: collection as any })

      if (count.totalDocs > 0) {
        try {
          // Try to delete all at once first
          await payload.delete({
            collection: collection as any,
            where: {
              id: {
                exists: true,
              },
            },
            depth: 0,
          })
          payload.logger.info(`  ✓ Cleared ${count.totalDocs} ${collection}`)
        } catch (bulkError) {
          // If bulk delete fails, try smaller batches
          payload.logger.info(`  Bulk delete failed for ${collection}, trying batches...`)
          const batchSize = 100
          let deleted = 0
          let attempts = 0
          const maxAttempts = Math.ceil(count.totalDocs / batchSize) + 5

          while (deleted < count.totalDocs && attempts < maxAttempts) {
            attempts++
            try {
              const docs = await payload.find({
                collection: collection as any,
                limit: batchSize,
                depth: 0,
                pagination: false,
              })

              if (!docs.docs || docs.docs.length === 0) break

              // Delete in parallel for speed
              const deletePromises = docs.docs.map(
                (doc) =>
                  payload
                    .delete({
                      collection: collection as any,
                      id: doc.id,
                      depth: 0,
                    })
                    .catch(() => null), // Ignore individual failures
              )

              const results = await Promise.all(deletePromises)
              deleted += results.filter((r) => r !== null).length

              if (deleted > 0 && deleted % 200 === 0) {
                payload.logger.info(`    ... deleted ${deleted}/${count.totalDocs} ${collection}`)
              }
            } catch (e) {
              payload.logger.warn(
                `    Error in batch ${attempts} for ${collection}: ${(e as Error).message}`,
              )
            }
          }

          payload.logger.info(`  ✓ Cleared ${deleted} ${collection}`)
        }
      } else {
        payload.logger.info(`  ✓ ${collection} is already empty`)
      }
    } catch (error) {
      payload.logger.warn(`  ! Could not clear ${collection}: ${(error as Error).message}`)
    }
  }

  // Clear users except the current user
  const currentUser = req.user
  if (currentUser) {
    await payload.delete({
      collection: 'users',
      where: {
        id: {
          not_equals: currentUser.id,
        },
      },
    })
  } else {
    // If no current user (CLI seeding), clear all users
    await payload.delete({
      collection: 'users',
      where: {
        id: {
          exists: true,
        },
      },
    })
  }

  // Create the default admin user
  payload.logger.info('— Creating default admin user...')
  try {
    await payload.create({
      collection: 'users',
      data: {
        email: 'brian.kays@gmail.com',
        name: 'Brian Kays',
        password: '!Carlos2500',
      },
    })
    payload.logger.info('✓ Created admin user: brian.kays@gmail.com')
  } catch (error) {
    payload.logger.warn('Could not create admin user - may already exist')
  }

  // Handle large collections separately with raw SQL for speed
  payload.logger.info('— Clearing large collections...')
  const largeCollections = [
    { name: 'visa-requirements', table: 'visa_requirements' },
    { name: 'michelin-restaurants', table: 'michelin_restaurants' },
    { name: 'airports', table: 'airports' },
    { name: 'airlines', table: 'airlines' },
    { name: 'routes', table: 'routes' },
    { name: 'regions', table: 'regions' },
  ]

  for (const { name, table } of largeCollections) {
    try {
      const count = await payload.count({ collection: name as any })
      if (count.totalDocs > 0) {
        payload.logger.info(`  Clearing ${count.totalDocs} ${name}...`)

        // Try bulk delete with better approach
        try {
          // Delete all documents at once using deleteMany
          const deleteResult = await payload.delete({
            collection: name as any,
            where: {
              id: {
                exists: true,
              },
            },
            depth: 0,
          })
          payload.logger.info(`  ✓ Bulk deleted ${name}`)
        } catch (bulkError) {
          // Fall back to batch deletion if TRUNCATE fails
          payload.logger.info(`  Truncate failed, using batch delete for ${name}...`)

          let deleted = 0
          const batchSize = 500 // Larger batches for these collections

          while (deleted < count.totalDocs) {
            const docs = await payload.find({
              collection: name as any,
              limit: batchSize,
              depth: 0,
              pagination: false,
            })

            if (!docs.docs || docs.docs.length === 0) break

            // Delete in parallel
            const deletePromises = docs.docs.map((doc) =>
              payload
                .delete({
                  collection: name as any,
                  id: doc.id,
                  depth: 0,
                })
                .catch(() => null),
            )

            const results = await Promise.all(deletePromises)
            deleted += results.filter((r) => r !== null).length

            if (deleted % 1000 === 0) {
              payload.logger.info(`    ... deleted ${deleted}/${count.totalDocs} ${name}`)
            }
          }

          payload.logger.info(`  ✓ Cleared ${deleted} ${name}`)
        }
      } else {
        payload.logger.info(`  ✓ ${name} is already empty`)
      }
    } catch (error) {
      payload.logger.warn(`  ! Could not clear ${name}: ${(error as Error).message}`)
    }
  }

  // Seed location data first (countries, currencies, languages, regions)
  await seedLocationData(payload)

  // Seed Michelin restaurants from CSV
  await seedMichelinRestaurants(payload)

  // Seed travel advisories
  await seedTravelAdvisories(payload)

  // Consolidate all country data and download media
  await seedConsolidatedCountryData(payload)

  // Seed OpenFlights data (airlines, enhanced airports, routes)
  await seedOpenFlightsData(payload)

  // Clear globals
  payload.logger.info(`— Clearing globals...`)
  await Promise.all(
    globals.map(async (global) => {
      if (global === 'header' || global === 'footer') {
        return payload.updateGlobal({
          slug: global,
          data: {
            navItems: [],
          },
          depth: 0,
          context: {
            disableRevalidate: true,
          },
        })
      }
      // For other globals, just update with empty object
      return payload.updateGlobal({
        slug: global,
        data: {},
        depth: 0,
        context: {
          disableRevalidate: true,
        },
      })
    }),
  )

  payload.logger.info(`— Seeding demo author and user...`)

  payload.logger.info(`— Seeding media...`)

  const [image1Buffer, image2Buffer, image3Buffer, hero1Buffer] = await Promise.all([
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post1.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post2.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post3.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-hero1.webp',
    ),
  ])

  const [demoAuthor, image1Doc, image2Doc, image3Doc, imageHomeDoc] = await Promise.all([
    payload.create({
      collection: 'users',
      data: {
        name: 'Demo Author',
        email: 'demo-author@example.com',
        password: 'password',
      },
    }),
    payload.create({
      collection: 'media',
      data: image1,
      file: image1Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image2Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image3Buffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero1,
      file: hero1Buffer,
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Technology',
        breadcrumbs: [
          {
            label: 'Technology',
            url: '/technology',
          },
        ],
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'News',
        breadcrumbs: [
          {
            label: 'News',
            url: '/news',
          },
        ],
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Finance',
        breadcrumbs: [
          {
            label: 'Finance',
            url: '/finance',
          },
        ],
      },
    }),
    payload.create({
      collection: 'categories',
      data: {
        title: 'Design',
        breadcrumbs: [
          {
            label: 'Design',
            url: '/design',
          },
        ],
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Software',
        breadcrumbs: [
          {
            label: 'Software',
            url: '/software',
          },
        ],
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Engineering',
        breadcrumbs: [
          {
            label: 'Engineering',
            url: '/engineering',
          },
        ],
      },
    }),
  ])

  payload.logger.info(`— Seeding posts...`)

  // Do not create posts with `Promise.all` because we want the posts to be created in order
  // This way we can sort them by `createdAt` or `publishedAt` and they will be in the expected order
  const post1Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post1({ heroImage: image1Doc, blockImage: image2Doc, author: demoAuthor }),
  })

  const post2Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post2({ heroImage: image2Doc, blockImage: image3Doc, author: demoAuthor }),
  })

  const post3Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post3({ heroImage: image3Doc, blockImage: image1Doc, author: demoAuthor }),
  })

  // update each post with related posts - sequential to avoid deadlock
  await payload.update({
    id: post1Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post2Doc.id, post3Doc.id],
    },
  })

  await payload.update({
    id: post2Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post1Doc.id, post3Doc.id],
    },
  })

  await payload.update({
    id: post3Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post1Doc.id, post2Doc.id],
    },
  })

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: contactFormData,
  })

  payload.logger.info(`— Seeding pages...`)

  const [_, contactPage] = await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      data: home({ heroImage: imageHomeDoc, metaImage: image2Doc }),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      data: contactPageData({ contactForm: contactForm }),
    }),
  ])

  payload.logger.info(`— Seeding globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Posts',
              url: '/posts',
            },
          },
          {
            link: {
              type: 'reference',
              label: 'Contact',
              reference: {
                relationTo: 'pages',
                value: contactPage.id,
              },
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Admin',
              url: '/admin',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Source Code',
              newTab: true,
              url: 'https://github.com/payloadcms/payload/tree/main/templates/website',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Payload',
              newTab: true,
              url: 'https://payloadcms.com/',
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'site-settings',
      data: {
        backgroundGradient: {
          // Set the Fusion preset colors
          color1: '#E1785D',
          color2: '#A87CEF',
          color3: '#5BC8E2',
          color4: '#4447EC',
        },
      },
    }),
  ])

  payload.logger.info('✓ Updated site settings with Fusion background gradient')

  payload.logger.info('Seeded database successfully!')
}

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}

// Export for CLI usage
export const seedDatabase = async ({ payload }: { payload: Payload }): Promise<void> => {
  // Create a mock request object for the seed function
  const req = {
    user: null,
    payload,
  } as PayloadRequest

  await seed({ payload, req })
}

// Export for partial seeding
export const seedSpecificData = async ({
  payload,
  type,
}: {
  payload: Payload
  type: string
}): Promise<void> => {
  switch (type) {
    case 'locations':
      await seedLocationData(payload)
      break
    case 'destinations':
      // Add destination-specific seeding if needed
      break
    case 'travel':
      await seedTravelAdvisories(payload)
      await seedCrimeIndexData(payload)
      break
    case 'media':
      await seedCountryMedia(payload)
      break
    case 'all':
      await seedDatabase({ payload })
      break
    default:
      throw new Error(`Unknown seed type: ${type}`)
  }
}
