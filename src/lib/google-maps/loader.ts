// Singleton Google Maps loader to prevent multiple initialization errors
let loadPromise: Promise<any> | null = null

export const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).google?.maps
}

export const loadGoogleMaps = async (): Promise<any> => {
  // Return existing promise if already loading/loaded
  if (loadPromise) {
    return loadPromise
  }

  // Check if already loaded
  if (isGoogleMapsLoaded()) {
    loadPromise = Promise.resolve((window as any).google)
    return loadPromise
  }

  // Create loading promise
  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Maps can only be loaded in browser environment'))
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    
    if (!apiKey) {
      reject(new Error('Google Maps API key is not configured'))
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      const checkLoaded = () => {
        if ((window as any).google?.maps) {
          resolve((window as any).google)
        }
      }
      
      // If script exists, wait for it to load
      if ((window as any).google?.maps) {
        resolve((window as any).google)
      } else {
        existingScript.addEventListener('load', checkLoaded)
        // Also check periodically in case the event already fired
        const checkInterval = setInterval(() => {
          if ((window as any).google?.maps) {
            clearInterval(checkInterval)
            resolve((window as any).google)
          }
        }, 100)
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          reject(new Error('Google Maps loading timeout'))
        }, 10000)
      }
      return
    }

    // Create and append script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly`
    script.async = true
    script.defer = true
    script.id = 'payload-google-maps-script'
    
    script.onload = () => {
      if ((window as any).google?.maps) {
        resolve((window as any).google)
      } else {
        reject(new Error('Google Maps loaded but google object not available'))
      }
    }
    
    script.onerror = () => {
      loadPromise = null // Reset so it can be retried
      reject(new Error('Failed to load Google Maps script'))
    }
    
    document.head.appendChild(script)
  }).catch(error => {
    loadPromise = null // Reset on error
    throw error
  })
  
  return loadPromise
}

// Hook for React components
export const useGoogleMapsLoader = () => {
  const isLoaded = isGoogleMapsLoaded()
  
  return {
    isLoaded,
    loadError: null,
    loadGoogleMaps,
  }
}