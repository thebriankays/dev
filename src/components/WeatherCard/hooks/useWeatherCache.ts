import { useEffect, useState } from 'react'

interface CacheItem<T> {
  data: T
  timestamp: number
}

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export function useWeatherCache<T>(key: string, initialData: T): [T, (data: T) => void] {
  const [data, setData] = useState<T>(initialData)

  useEffect(() => {
    // Try to load from localStorage on mount
    try {
      const cached = localStorage.getItem(`weather_cache_${key}`)
      if (cached) {
        const parsedCache: CacheItem<T> = JSON.parse(cached)
        const now = Date.now()
        
        // Check if cache is still valid (less than 24 hours old)
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setData(parsedCache.data)
        }
      }
    } catch (error) {
      console.error('Error loading weather cache:', error)
    }
  }, [key])

  const updateCache = (newData: T) => {
    setData(newData)
    
    // Save to localStorage
    try {
      const cacheItem: CacheItem<T> = {
        data: newData,
        timestamp: Date.now()
      }
      localStorage.setItem(`weather_cache_${key}`, JSON.stringify(cacheItem))
    } catch (error) {
      console.error('Error saving weather cache:', error)
    }
  }

  return [data, updateCache]
}

export function isCacheValid(key: string): boolean {
  try {
    const cached = localStorage.getItem(`weather_cache_${key}`)
    if (!cached) return false
    
    const parsedCache: CacheItem<unknown> = JSON.parse(cached)
    const now = Date.now()
    
    return now - parsedCache.timestamp < CACHE_DURATION
  } catch {
    return false
  }
}