'use client'

import React from 'react'
import { weatherDescriptions, celsiusToFahrenheit, mapWeatherType } from '../utils/weatherUtils'
import { WeatherData } from '../types/weather'

interface CurrentWeatherProps {
  weatherData: WeatherData
  location?: string
  tempUnit: 'F' | 'C'
  showCurrentTemp: boolean
  temperature: number
  temperatureF: number
  weatherType: string
  currentDay: string
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({
  weatherData,
  location,
  tempUnit,
  showCurrentTemp,
  temperature,
  temperatureF,
  weatherType,
  currentDay
}) => {
  return (
    <>
      <div className="location-name cardInfo">
        <span>{location || 'Location'}</span>
      </div>
      <div className="temperature cardInfo">
        <span id="temperature">
          {tempUnit === 'F' 
            ? (showCurrentTemp ? (weatherData.current.tempF || celsiusToFahrenheit(weatherData.current.temp)) : temperatureF)
            : (showCurrentTemp ? weatherData.current.temp : temperature)
          }
        </span>°
        {tempUnit}
      </div>
      <div className="weatherType cardInfo">
        <span id="weatherType">
          {showCurrentTemp 
            ? (weatherDescriptions[mapWeatherType(weatherData.current.weather)] || weatherData.current.weather)
            : (weatherDescriptions[weatherType] || weatherType)
          }
        </span>
      </div>
      <div className="currentDay cardInfo">
        <span id="currentDay">{currentDay}</span>
      </div>
    </>
  )
}

export default CurrentWeather