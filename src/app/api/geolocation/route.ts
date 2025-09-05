import { NextResponse } from 'next/server'

/**
 * API Route for IP-based Geolocation.
 * This endpoint determines the user's approximate location based on their IP address
 * using the free ip-api.com service. This provides a better user experience than
 * requesting browser location permissions on page load.
 */
export async function GET(request: Request) {
  // In production (e.g., Vercel), 'x-forwarded-for' contains the client's IP.
  // For local development, we fall back to a default IP (Google's DNS) for testing.
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0] : '8.8.8.8'

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch geolocation data. Status: ${response.status}`)
    }
    const data = await response.json()

    if (data.status === 'success') {
      return NextResponse.json({ 
        lat: data.lat, 
        lng: data.lon,
        city: data.city,
        country: data.country
      })
    } else {
      // If the API call fails, return a default location (New York City).
      console.warn(`IP geolocation failed for IP ${ip}: ${data.message}`)
      return NextResponse.json({ lat: 40.7128, lng: -74.006 }, { status: 200 })
    }
  } catch (error) {
    console.error('Error in geolocation API route:', error)
    // Return a default location on any exception.
    return NextResponse.json(
      { lat: 40.7128, lng: -74.006 },
      { status: 500, statusText: 'Internal Server Error' },
    )
  }
}
