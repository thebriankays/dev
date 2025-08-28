import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayloadHMR({ config })
    
    // Fetch all currencies
    const { docs: currencies } = await payload.find({
      collection: 'currencies',
      limit: 1000,
    })
    
    let updated = 0
    
    // For demo purposes, we'll use a simple mock update
    // In production, you'd integrate with a real exchange rate API
    // like exchangerate-api.com, fixer.io, or openexchangerates.org
    
    for (const currency of currencies) {
      if (currency.code !== 'USD') {
        // Generate mock exchange rate (in production, fetch from API)
        const mockRate = currency.code === 'EUR' ? 0.85 : 
                        currency.code === 'GBP' ? 0.73 :
                        currency.code === 'JPY' ? 110.5 :
                        currency.code === 'AUD' ? 1.35 :
                        currency.code === 'CAD' ? 1.25 :
                        Math.random() * 100 + 1
        
        await payload.update({
          collection: 'currencies',
          id: currency.id,
          data: {
            exchangeRate: mockRate,
            exchangeRateUpdatedAt: new Date().toISOString(),
          },
        })
        
        updated++
      }
    }
    
    return NextResponse.json({
      success: true,
      updated,
      message: `Updated ${updated} currency exchange rates`,
    })
  } catch (error) {
    console.error('Error updating exchange rates:', error)
    return NextResponse.json(
      { error: 'Failed to update exchange rates' },
      { status: 500 }
    )
  }
}