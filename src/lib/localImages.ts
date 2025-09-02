// localImages.ts - Utility functions for managing local image storage

import { UnsplashImage } from './unsplash'
import path from 'path'
import { promises as fsPromises } from 'fs'

// Base paths for stored images
const UNSPLASH_LOCAL_PATH = 'public/media/unsplash'
const PEXELS_LOCAL_PATH = 'public/media/pexels'
const RANDOM_TRAVEL_LOCAL_PATH = 'public/random_travel'
// Base paths for URLs (without 'public' prefix)
const UNSPLASH_URL_PATH = 'media/unsplash'
const PEXELS_URL_PATH = 'media/pexels'
const RANDOM_TRAVEL_URL_PATH = 'random_travel'

// Image extensions to look for
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

// Safely check if code is running on server side
const isServer = typeof window === 'undefined'

/**
 * Checks if an image URL is local or external
 */
function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * Reads local images from a directory
 * @param source - 'unsplash', 'pexels', or 'random-travel'
 * @param category - Optional category/subfolder to check
 * @param limit - Maximum number of images to return
 * @returns Array of UnsplashImage compatible objects
 */
export async function getLocalImages(
  source: 'unsplash' | 'pexels' | 'random-travel',
  category?: string,
  limit: number = 30,
): Promise<UnsplashImage[]> {
  // Skip if running on client side
  if (!isServer) return []

  try {
    // Determine the path to check
    let basePath: string
    let urlPath: string

    switch (source) {
      case 'unsplash':
        basePath = UNSPLASH_LOCAL_PATH
        urlPath = UNSPLASH_URL_PATH
        break
      case 'pexels':
        basePath = PEXELS_LOCAL_PATH
        urlPath = PEXELS_URL_PATH
        break
      case 'random-travel':
        basePath = RANDOM_TRAVEL_LOCAL_PATH
        urlPath = RANDOM_TRAVEL_URL_PATH
        break
    }

    const dirPath = category
      ? path.join(process.cwd(), basePath, category)
      : path.join(process.cwd(), basePath)

    // Check if directory exists
    try {
      await fsPromises.access(dirPath)
    } catch (_err) {
      // If category directory doesn't exist, create it
      try {
        await fsPromises.mkdir(dirPath, { recursive: true })
        console.log(`Created directory: ${dirPath}`)
      } catch (_err) {
        console.warn(`Error creating directory for ${source}/${category}:`, _err)
      }

      return []
    }

    // Read the directory
    const files = await fsPromises.readdir(dirPath)

    // Filter for image files
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase()
      return IMAGE_EXTENSIONS.includes(ext)
    })

    // Limit the number of files
    const limitedFiles = imageFiles.slice(0, limit)

    // Convert to UnsplashImage format with absolute URLs
    const images: UnsplashImage[] = limitedFiles.map((file) => {
      // Create a proper URL path for the browser (without 'public' prefix)
      const relativePath = category ? `${category}/${file}` : file
      const publicUrl = `/${urlPath}/${relativePath}`.replace(/\/+/g, '/')

      // Ensure the URL is properly formatted
      const absoluteUrl = publicUrl.startsWith('/') ? publicUrl : `/${publicUrl}`

      return {
        url: absoluteUrl,
        width: 1200, // Default width
        height: 800, // Default height
      }
    })

    return images
  } catch (error) {
    console.warn(`Error reading local ${source} images:`, error)
    return []
  }
}

/**
 * Gets random local travel images
 * @param count - Number of images to return
 * @returns Array of Next.js image src strings
 */
export async function getRandomLocalTravelImages(count: number = 1): Promise<string[]> {
  // Skip if running on client side
  if (!isServer) return []

  try {
    const dirPath = path.join(process.cwd(), RANDOM_TRAVEL_LOCAL_PATH)

    // Check if directory exists
    try {
      await fsPromises.access(dirPath)
    } catch (_err) {
      return []
    }

    // Read the directory
    const files = await fsPromises.readdir(dirPath)

    // Filter for image files
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase()
      return IMAGE_EXTENSIONS.includes(ext)
    })

    // If no images found, return empty array
    if (imageFiles.length === 0) {
      return []
    }

    const result: string[] = []

    // If we have enough images, just shuffle and take what we need
    if (imageFiles.length >= count) {
      const shuffled = [...imageFiles].sort(() => Math.random() - 0.5)
      for (let i = 0; i < count; i++) {
        const publicUrl = `/${RANDOM_TRAVEL_URL_PATH}/${shuffled[i]}`.replace(/\/+/g, '/')
        result.push(publicUrl.startsWith('/') ? publicUrl : `/${publicUrl}`)
      }
    } else {
      // Not enough images, so we need to reuse some
      const shuffled = [...imageFiles].sort(() => Math.random() - 0.5)

      for (let i = 0; i < count; i++) {
        const fileIndex = i % imageFiles.length
        const publicUrl = `/${RANDOM_TRAVEL_URL_PATH}/${shuffled[fileIndex]}`.replace(/\/+/g, '/')
        result.push(publicUrl.startsWith('/') ? publicUrl : `/${publicUrl}`)
      }
    }

    return result
  } catch (error) {
    console.warn(`Error reading random travel images:`, error)
    return []
  }
}

/**
 * Saves an image from a URL to the local filesystem
 * @param url - The image URL to download
 * @param source - Whether this is from unsplash or pexels
 * @param category - Optional category/subfolder to save to
 */
export async function saveImageLocally(
  url: string,
  source: 'unsplash' | 'pexels',
  category?: string,
): Promise<string | null> {
  // Skip if not on server
  if (!isServer) return url

  // Skip if already a local URL
  if (!isExternalUrl(url)) {
    return url
  }

  try {
    // Determine the save path
    const basePath = source === 'unsplash' ? UNSPLASH_LOCAL_PATH : PEXELS_LOCAL_PATH
    const dirPath = category
      ? path.join(process.cwd(), basePath, category)
      : path.join(process.cwd(), basePath)

    // Create directory if it doesn't exist
    try {
      await fsPromises.access(dirPath)
    } catch {
      await fsPromises.mkdir(dirPath, { recursive: true })
      console.log(`Created directory: ${dirPath}`)
    }

    // Generate a unique filename based on URL and timestamp
    const urlHash = Buffer.from(url)
      .toString('base64')
      .replace(/[\/\+\=]/g, '')
      .substring(0, 10)
    const timestamp = Date.now().toString().substring(0, 6)
    const filename = `${source}_${urlHash}_${timestamp}.jpg`
    const filePath = path.join(dirPath, filename)

    // Download the image
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Save the file
    await fsPromises.writeFile(filePath, buffer as any)

    // Return the public URL path (without 'public' prefix)
    const urlPath = source === 'unsplash' ? UNSPLASH_URL_PATH : PEXELS_URL_PATH
    const publicUrl = `/${urlPath}/${category || ''}/${filename}`.replace(/\/+/g, '/')
    return publicUrl
  } catch (error) {
    console.warn(`Error saving image from ${source}:`, error)
    return null
  }
}

/**
 * Saves multiple images from URLs to the local filesystem
 * @param images - Array of UnsplashImage objects to save
 * @param source - Whether these are from unsplash or pexels
 * @param category - Optional category/subfolder to save to
 */
export async function saveImagesLocally(
  images: UnsplashImage[],
  source: 'unsplash' | 'pexels',
  category?: string,
): Promise<void> {
  // Skip if not on server
  if (!isServer) return

  try {
    // Filter to only save external images
    const externalImages = images.filter((img) => isExternalUrl(img.url))

    if (externalImages.length === 0) {
      console.log(`No external images to save for ${source}/${category || ''}`)
      return
    }

    console.log(`Saving ${externalImages.length} external ${source} images to local storage`)

    // Process images sequentially to avoid overwhelming the system
    for (const image of externalImages) {
      await saveImageLocally(image.url, source, category)
    }

    console.log(`Successfully saved ${externalImages.length} ${source} images to local storage`)
  } catch (error) {
    console.warn(`Error saving ${source} images:`, error)
  }
}