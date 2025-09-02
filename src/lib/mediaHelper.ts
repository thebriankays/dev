// Use global fetch (Node.js v18+) or uncomment below to use node-fetch for older Node.js versions
// import fetch from 'node-fetch'
import path from 'path'
import fs from 'fs/promises'
import { createReadStream } from 'fs'
import FormData from 'form-data'

/* ------------------------------------------------------------------ */
/* image helper                                                       */
/* ------------------------------------------------------------------ */

export async function createMediaFromUrl(
  imageUrl: string,
  altText: string,
): Promise<string | null> {
  try {
    // Check if URL is valid
    if (!imageUrl.startsWith('http')) {
      // Handle local URLs - convert to absolute URL
      console.log('Local URL detected, converting to absolute URL:', imageUrl)
      // Assume it's a local URL starting with /
      if (imageUrl.startsWith('/')) {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        imageUrl = `${baseUrl}${imageUrl}`
        console.log('Converted to absolute URL:', imageUrl)
      } else {
        console.log('Invalid URL format, cannot process:', imageUrl)
        return null
      }
    }

    const response = await fetch(imageUrl)
    if (!response.ok)
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)

    const contentType = response.headers.get('content-type') ?? ''
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'

    // Create better filename using destination info
    const sanitizedAltText = altText.replace(/[^a-zA-Z0-9\s]/g, '').trim()
    const filename = `${sanitizedAltText.replace(/\s+/g, '-').toLowerCase()}-${Date.now().toString().slice(-6)}.${ext}`

    const tmpDir = path.resolve('./tmp')
    const tmpFile = path.join(tmpDir, filename)

    await fs.mkdir(tmpDir, { recursive: true })
    const buffer = await response.arrayBuffer()
    await fs.writeFile(tmpFile, new Uint8Array(buffer))

    const fd = new FormData()
    fd.append('file', createReadStream(tmpFile))
    fd.append('alt', altText)

    // Create media directly using Payload API instead of fetch
    let mediaId = null
    try {
      // Import payload dynamically to avoid browser errors
      const { getPayload } = await import('payload')
      const config = await import('@payload-config')
      const payload = await getPayload({ config: config.default })

      // Get file size for Payload API requirement
      const fileData = await fs.readFile(tmpFile)
      const fileSize = fileData.length

      // Create media using Payload API directly
      console.log('Creating media with Payload API directly')
      const mediaDoc = await payload.create({
        collection: 'media',
        data: { alt: altText },
        file: {
          data: fileData,
          mimetype: contentType,
          name: path.basename(tmpFile),
          size: fileSize,
        },
        overrideAccess: true,
      })

      mediaId = String(mediaDoc.id)
      console.log('Successfully created media with ID:', mediaId)
    } catch (err) {
      console.error('Error creating media with Payload API:', err)
    }

    // Clean up temp file
    await fs.unlink(tmpFile)

    return mediaId
  } catch (err) {
    console.error('Error creating media from URL:', err)
    return null
  }
}

/* ------------------------------------------------------------------ */
/* video helper                                                       */
/* ------------------------------------------------------------------ */

export async function createVideoFromUrl(
  videoUrl: string,
  altText: string,
): Promise<string | null> {
  try {
    // Check if URL is valid
    if (!videoUrl.startsWith('http')) {
      // Handle local URLs - convert to absolute URL
      console.log('Local URL detected, converting to absolute URL:', videoUrl)
      // Assume it's a local URL starting with /
      if (videoUrl.startsWith('/')) {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        videoUrl = `${baseUrl}${videoUrl}`
        console.log('Converted to absolute URL:', videoUrl)
      } else {
        console.log('Invalid URL format, cannot process:', videoUrl)
        return null
      }
    }

    // Add timeout and retry logic for video downloads
    let response
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts) {
      try {
        console.log(`Downloading video (attempt ${attempts + 1}/${maxAttempts}): ${videoUrl}`)
        
        // Use AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
        
        response = await fetch(videoUrl, {
          signal: controller.signal,
          // Add headers to prevent connection issues
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'video/*',
          }
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) break
        
        console.log(`Download failed with status ${response.status}, retrying...`)
        attempts++
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds before retry
        }
      } catch (err) {
        console.error(`Download attempt ${attempts + 1} failed:`, err)
        attempts++
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else {
          throw err
        }
      }
    }
    
    if (!response || !response.ok) {
      throw new Error(`Failed to download video after ${maxAttempts} attempts`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    const ext = contentType.includes('webm') ? 'webm' : 'mp4'

    // Create better filename using destination info
    const sanitizedAltText = altText.replace(/[^a-zA-Z0-9\s]/g, '').trim()
    const filename = `${sanitizedAltText.replace(/\s+/g, '-').toLowerCase()}-video-${Date.now().toString().slice(-6)}.${ext}`

    const tmpDir = path.resolve('./tmp')
    const tmpFile = path.join(tmpDir, filename)

    await fs.mkdir(tmpDir, { recursive: true })
    const buffer = await response.arrayBuffer()
    await fs.writeFile(tmpFile, new Uint8Array(buffer))

    const fd = new FormData()
    fd.append('file', createReadStream(tmpFile))
    fd.append('alt', altText)

    // Create media directly using Payload API instead of fetch
    let mediaId = null
    try {
      // Import payload dynamically to avoid browser errors
      const { getPayload } = await import('payload')
      const config = await import('@payload-config')
      const payload = await getPayload({ config: config.default })

      // Get file size for Payload API requirement
      const fileData = await fs.readFile(tmpFile)
      const fileSize = fileData.length

      // Create media using Payload API directly
      console.log('Creating video media with Payload API directly')
      const mediaDoc = await payload.create({
        collection: 'media',
        data: { alt: altText },
        file: {
          data: fileData,
          mimetype: contentType,
          name: path.basename(tmpFile),
          size: fileSize,
        },
        overrideAccess: true,
      })

      mediaId = String(mediaDoc.id)
      console.log('Successfully created video media with ID:', mediaId)
    } catch (err) {
      console.error('Error creating video media with Payload API:', err)
    }

    // Clean up temp file
    await fs.unlink(tmpFile)

    return mediaId
  } catch (err) {
    console.error('Error creating video from URL:', err)
    return null
  }
}