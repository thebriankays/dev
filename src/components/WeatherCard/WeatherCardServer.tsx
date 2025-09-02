import React from 'react'
import { fetchWeatherData, generateMockWeatherData } from '@/services/weather'
import WeatherCardClient from './WeatherCardClient'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'

interface WeatherCardServerProps {
  lat?: number | null
  lng?: number | null
  location?: string
  city?: string
  useMockData?: boolean
}

// Cache weather data for 24 hours
const getCachedWeatherData = unstable_cache(
  async (lat: number, lng: number) => {
    return await fetchWeatherData(lat, lng)
  },
  ['weather-data'],
  {
    revalidate: 24 * 60 * 60, // 24 hours in seconds
    tags: ['weather'],
  }
)

export default async function WeatherCardServer({ 
  lat, 
  lng, 
  location = '',
  city,
  useMockData = false 
}: WeatherCardServerProps) {
  // Check if we're in admin context by looking at the URL
  const headersList = await headers()
  const fullUrl = headersList.get('referer') || ''
  const isAdmin = fullUrl.includes('/admin')
  
  let weatherData = null
  let isUsingMockData = useMockData || isAdmin // Always use mock data in admin
  
  if (!isUsingMockData && lat && lng) {
    try {
      // Use cached version of weather data
      weatherData = await getCachedWeatherData(lat, lng)
      if (!weatherData) {
        isUsingMockData = true
      }
    } catch (error) {
      console.error('Error fetching cached weather data:', error)
      isUsingMockData = true
    }
  } else {
    isUsingMockData = true
  }
  
  // Use mock data if fetch fails or if explicitly requested
  if (!weatherData) {
    weatherData = generateMockWeatherData(city || location || 'Unknown Location')
  }

  // Log if we're using mock data in development
  if (process.env.NODE_ENV === 'development') {
    if (isAdmin) {
      console.log(`WeatherCard: Using mock data in admin context for ${location || 'location'}`)
    } else if (isUsingMockData) {
      console.log(`WeatherCard: Using mock data for ${location || 'location'}`)
    }
  }

  return (
    <WeatherCardClient 
      weatherData={weatherData}
      location={city || location}
    />
  )
}