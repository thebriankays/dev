import React from 'react'
import './WeatherCardBlock.scss'
import WeatherCardServer from '@/components/WeatherCard/WeatherCardServer'

interface WeatherCardBlockProps {
  title?: string
  location?: string
  city?: string
  lat?: number | null
  lng?: number | null
  useMockData?: boolean
}

export const WeatherCardBlock: React.FC<WeatherCardBlockProps> = ({
  title: _title = 'Weather Forecast',
  location = '',
  city,
  lat,
  lng,
  useMockData = false,
}) => {
  return (
    <div className="weather-card-block">
      <div className="container">
        <h2 className="weather-card-block__title">Climate and Weather</h2>
        <WeatherCardServer lat={lat} lng={lng} location={location} city={city} useMockData={useMockData} />
      </div>
    </div>
  )
}

export default WeatherCardBlock
