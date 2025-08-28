// Singleton Google Maps loader to prevent multiple initialization errors
import { Loader } from '@googlemaps/js-api-loader'

let loaderInstance: Loader | null = null
let loadPromise: Promise<typeof google> | null = null

export const getGoogleMapsLoader = () => {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places'],
      id: 'payload-google-maps-singleton',
      language: 'en',
      region: 'US',
    })
  }
  return loaderInstance
}

export const loadGoogleMaps = async (): Promise<typeof google> => {
  if (!loadPromise) {
    const loader = getGoogleMapsLoader()
    loadPromise = loader.load()
  }
  return loadPromise
}

// Check if Google Maps is already loaded
export const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && !!window.google?.maps
}

// Hook for React components
export const useGoogleMapsLoader = () => {
  const isLoaded = isGoogleMapsLoaded()
  
  return {
    isLoaded,
    loadError: null,
    loader: getGoogleMapsLoader(),
  }
}