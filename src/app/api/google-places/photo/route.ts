import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@/payload.config'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const photoReference = searchParams.get('photo_reference')
    const maxWidth = searchParams.get('maxwidth') || '800'
    const maxHeight = searchParams.get('maxheight') || '600'

    if (!photoReference) {
      return NextResponse.json({ error: 'Missing photo_reference parameter' }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
    }

    // Fetch photo from Google Places API
    const googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&maxheight=${maxHeight}&photo_reference=${photoReference}&key=${apiKey}`
    
    const photoResponse = await fetch(googlePhotoUrl)
    
    if (!photoResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch photo from Google' }, { status: photoResponse.status })
    }

    // Get the image as a buffer
    const imageBuffer = await photoResponse.arrayBuffer()
    const buffer = Buffer.from(imageBuffer)

    // Create a File object from the buffer
    const file = new File([new Uint8Array(buffer)], `google-place-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    })

    // Upload to Payload Media collection
    const payload = await getPayloadHMR({ config })
    
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: 'Google Places Photo',
      },
      file: {
        data: buffer,
        name: file.name,
        mimetype: 'image/jpeg',
        size: buffer.length,
      },
    })

    return NextResponse.json({
      success: true,
      id: media.id,
      url: media.url,
    })
  } catch (error) {
    console.error('Error downloading Google Places photo:', error)
    return NextResponse.json(
      { error: 'Failed to download and save photo' },
      { status: 500 }
    )
  }
}