import { NextResponse } from 'next/server'

/**
 * API Route for IP-based Geolocation.
 * This version is updated to gracefully handle local development environments.
 */
export async function GET(request: Request) {
  // In production (e.g., Vercel), 'x-forwarded-for' contains the client's IP.
  let ip = request.headers.get('x-forwarded-for')

  // CORRECTED: This logic now correctly uses the logical OR (||) operator
  // to check for localhost addresses.
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    // The ip-api.com service cannot geolocate a local address.
    // Instead of making a failing API call, we use a default public IP for testing.
    ip = '8.8.8.8' // Google's public DNS
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch geolocation data. Status: ${response.status}`)
    }
    const data = await response.json()

    if (data.status === 'success') {
      return NextResponse.json({ lat: data.lat, lng: data.lon })
    } else {
      console.warn(`IP geolocation failed for IP ${ip}: ${data.message}`)
      return NextResponse.json({ lat: 40.7128, lng: -74.006 }, { status: 200 })
    }
  } catch (error) {
    console.error('Error in geolocation API route:', error)
    return NextResponse.json(
      { lat: 40.7128, lng: -74.006 },
      { status: 500, statusText: 'Internal Server Error' },
    )
  }
}
