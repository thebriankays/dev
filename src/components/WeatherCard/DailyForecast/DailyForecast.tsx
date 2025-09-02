'use client'

import React, { useRef } from 'react'
import { Animated3DIcon } from '../Animated3DIcon/Animated3DIcon'
import { celsiusToFahrenheit, mapWeatherType } from '../utils/weatherUtils'

interface DailyData {
  day: string
  high: number
  low: number
  weather: string
  icon: string
}

interface DailyForecastProps {
  dailyData: DailyData[]
  tempUnit: 'F' | 'C'
}

const DailyForecast: React.FC<DailyForecastProps> = ({ dailyData, tempUnit }) => {
  if (!dailyData || dailyData.length === 0) {
    return <div>No forecast data available</div>
  }

  return (
    <div className="forecast-days-horizontal">
      {dailyData.slice(0, 5).map((day, index) => (
        <div key={index} className="forecast-day-horizontal">
          <p className="forecast-day-name">{day.day}</p>
          <div className="forecast-icon-wrapper">
            <Animated3DIcon weatherType={mapWeatherType(day.weather)} size="medium" />
          </div>
          <p className="forecast-weather-type">{mapWeatherType(day.weather).replace(/-/g, ' ')}</p>
          <div className="forecast-temps-horizontal">
            <div className="forecast-high">
              <span className="temp-main">
                {tempUnit === 'F' ? `${celsiusToFahrenheit(day.high)}°` : `${day.high}°`}
              </span>
            </div>
            <div className="forecast-low">
              <span className="temp-main temp-low">
                {tempUnit === 'F' ? `${celsiusToFahrenheit(day.low)}°` : `${day.low}°`}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default DailyForecast