import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

export const maxDuration = 300

// Enable streaming
export const dynamic = 'force-dynamic'

// Progress reporter that sends SSE events
class ProgressReporter {
  private encoder = new TextEncoder()
  
  constructor(private writer: WritableStreamDefaultWriter) {}
  
  async send(data: any) {
    const message = `data: ${JSON.stringify(data)}\n\n`
    await this.writer.write(this.encoder.encode(message))
  }
  
  async complete() {
    await this.send({ type: 'complete' })
    await this.writer.close()
  }
  
  async error(error: string) {
    await this.send({ type: 'error', error })
    await this.writer.close()
  }
}

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return new Response('Action forbidden.', { status: 403 })
  }

  // Create a stream for Server-Sent Events
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const progress = new ProgressReporter(writer)

  // Start the seeding process in the background
  ;(async () => {
    try {
      const startTime = Date.now()
      
      await progress.send({ 
        type: 'status', 
        message: 'Starting database reset and seed...',
        step: 'init',
        progress: 0
      })

      // Phase 1: Clear database
      await progress.send({ 
        type: 'status', 
        message: 'Clearing database tables...',
        step: 'clearing',
        progress: 5
      })

      const db = payload.db
      const tablesToClear = [
        // Dependent tables first
        'country_factbook',
        'crime_trends',
        'crime_index_scores',
        'visa_requirements',
        'michelin_restaurants', 
        'travel_advisories',
        'airports',
        'regions',
        'destinations',
        'countries',
        'destination_types',
        'destination_categories',
        'timezones',
        'languages',
        'currencies',
        'posts',
        'pages',
        'media',
        'categories',
        'forms',
        'form_submissions',
      ]
      
      let cleared = 0
      for (const table of tablesToClear) {
        try {
          const tableExists = await db.drizzle.execute(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = '${table}'
            )
          `)
          
          if ((tableExists as any).rows[0]?.exists) {
            await db.drizzle.execute(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`)
            cleared++
            
            const progress_pct = 5 + (cleared / tablesToClear.length) * 15
            await progress.send({ 
              type: 'status', 
              message: `Cleared ${table}`,
              step: 'clearing',
              progress: Math.round(progress_pct),
              details: `${cleared}/${tablesToClear.length} tables cleared`
            })
          }
        } catch (error) {
          payload.logger.warn(`Could not clear ${table}: ${(error as Error).message}`)
        }
      }

      // Clear _rels tables
      await progress.send({ 
        type: 'status', 
        message: 'Clearing relationship tables...',
        step: 'clearing',
        progress: 20
      })
      
      try {
        const relsTables = await db.drizzle.execute(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name LIKE '%_rels'
        `)
        
        for (const row of (relsTables as any).rows) {
          try {
            await db.drizzle.execute(`TRUNCATE TABLE ${row.table_name} CASCADE`)
          } catch (e) {
            // Ignore errors
          }
        }
      } catch (e) {
        // Ignore errors
      }

      // Phase 2: Seed database using the main seed function
      await progress.send({ 
        type: 'status', 
        message: 'Starting database seed...',
        step: 'seeding',
        progress: 25
      })

      // Import the main seed function
      const { seed } = await import('@/endpoints/seed')
      
      // Monitor seed progress by intercepting logger
      const originalInfo = payload.logger.info.bind(payload.logger)
      let lastProgress = 25
      
      ;(payload.logger as any).info = function(msg: string, ...args: any[]) {
        originalInfo.call(payload.logger, msg, ...args)
        
        const message = msg
        
        // Update progress based on key milestones
        if (message.includes('Seeding location data')) {
          lastProgress = 30
          progress.send({ 
            type: 'status', 
            message: 'Seeding location data...',
            step: 'seeding-location',
            progress: lastProgress
          }).catch(() => {})
        } else if (message.includes('✓ Seeded currencies')) {
          lastProgress = 35
        } else if (message.includes('✓ Seeded countries')) {
          lastProgress = 40
        } else if (message.includes('✓ Seeded regions')) {
          lastProgress = 45
        } else if (message.includes('Seeding Michelin restaurants')) {
          lastProgress = 50
          progress.send({ 
            type: 'status', 
            message: 'Seeding Michelin restaurants...',
            step: 'seeding-michelin',
            progress: lastProgress
          }).catch(() => {})
        } else if (message.includes('✓ Seeded') && message.includes('Michelin')) {
          lastProgress = 55
        } else if (message.includes('Seeding travel advisories')) {
          lastProgress = 60
          progress.send({ 
            type: 'status', 
            message: 'Seeding travel advisories...',
            step: 'seeding-advisories',
            progress: lastProgress
          }).catch(() => {})
        } else if (message.includes('✓ Seeded') && message.includes('travel advisories')) {
          lastProgress = 65
        } else if (message.includes('Consolidating country data')) {
          lastProgress = 70
          progress.send({ 
            type: 'status', 
            message: 'Consolidating country data...',
            step: 'seeding-country-data',
            progress: lastProgress
          }).catch(() => {})
        } else if (message.includes('Starting OpenFlights data')) {
          lastProgress = 75
          progress.send({ 
            type: 'status', 
            message: 'Seeding airlines and routes...',
            step: 'seeding-flights',
            progress: lastProgress
          }).catch(() => {})
        } else if (message.includes('✓ Imported') && message.includes('airlines')) {
          lastProgress = 80
        } else if (message.includes('✓ Imported') && message.includes('routes')) {
          lastProgress = 85
        } else if (message.includes('Seeding demo author')) {
          lastProgress = 90
          progress.send({ 
            type: 'status', 
            message: 'Creating demo content...',
            step: 'seeding-content',
            progress: lastProgress
          }).catch(() => {})
        } else if (message.includes('Seeding posts')) {
          lastProgress = 92
        } else if (message.includes('Seeding pages')) {
          lastProgress = 94
        } else if (message.includes('Seeding globals')) {
          lastProgress = 96
        } else if (message.includes('Seeded database successfully!')) {
          lastProgress = 98
        }
        
        // Send log messages with progress
        if (message.includes('✓')) {
          const match = message.match(/✓.*?(\d+)/)
          if (match) {
            progress.send({ 
              type: 'log', 
              message,
              count: parseInt(match[1]),
              progress: lastProgress
            }).catch(() => {})
          }
        } else {
          progress.send({ 
            type: 'log', 
            message,
            progress: lastProgress
          }).catch(() => {})
        }
      }
      
      // Create the request object for the seed function
      const req = await createLocalReq({ user }, payload)
      
      // Run the main seed function which includes all seeding steps
      await seed({ payload, req })
      
      await progress.send({ 
        type: 'status', 
        message: 'Seed completed!',
        step: 'complete',
        progress: 100,
        duration: Date.now() - startTime
      })
      
      await progress.complete()
      
    } catch (e) {
      await progress.error((e as Error).message)
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}