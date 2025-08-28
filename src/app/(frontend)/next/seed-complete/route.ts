import { createLocalReq, getPayload } from 'payload'
import { seed } from '@/endpoints/seed'
import config from '@payload-config'
import { headers } from 'next/headers'

export const maxDuration = 300

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    payload.logger.info('Starting complete database reset and seed...')
    
    // First, use fast truncate for large tables
    const db = payload.db
    
    // List of tables to truncate (in dependency order)
    const tablesToClear = [
      // Clear dependent tables first
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
    
    payload.logger.info('— Fast clearing all tables...')
    
    // PostgreSQL specific fast truncate
    for (const table of tablesToClear) {
      try {
        // Check if table exists
        const tableExists = await db.drizzle.execute(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${table}'
          )
        `)
        
        if ((tableExists as any).rows[0]?.exists) {
          // Truncate with CASCADE to handle foreign keys
          await db.drizzle.execute(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`)
          payload.logger.info(`  ✓ Truncated ${table}`)
        }
      } catch (error) {
        // If truncate fails, try delete
        try {
          await db.drizzle.execute(`DELETE FROM ${table}`)
          payload.logger.info(`  ✓ Cleared ${table}`)
        } catch (e) {
          payload.logger.warn(`  ! Could not clear ${table}: ${(error as Error).message}`)
        }
      }
    }
    
    // Clear any _rels tables
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
    
    payload.logger.info('✓ Fast clear completed!')
    
    // Now run the normal seed
    const payloadReq = await createLocalReq({ user }, payload)
    await seed({ payload, req: payloadReq })
    
    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error in complete seed' })
    return Response.json({ 
      success: false, 
      error: (e as Error).message 
    }, { status: 500 })
  }
}
