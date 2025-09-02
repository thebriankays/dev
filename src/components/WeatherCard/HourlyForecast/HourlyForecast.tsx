'use client'

import React from 'react'
import { formatTime } from '../utils/weatherUtils'

interface HourData {
  day: string
  hour: number
  weather: string
  temp: number
  tempF: number
  time: string
}

interface HourlyForecastProps {
  hoursData: HourData[]
  activeHourIndex: number
  tempUnit: 'F' | 'C'
  onScroll: () => void
  onWheel: (event: React.WheelEvent) => void
  onHourClick: (index: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

const getWeatherIconSVG = (weather: string, isNight: boolean = false) => {
  // Map weather types to SVG icon IDs
  const weatherMap: { [key: string]: string } = {
    'sunny': isNight ? 'clear-night' : 'sunny',
    'clear-day': isNight ? 'clear-night' : 'sunny',
    'clear-night': 'clear-night',
    'partly-cloudy': isNight ? 'partly-cloudy-night' : 'partly-cloudy-day',
    'partly-cloudy-day': isNight ? 'partly-cloudy-night' : 'partly-cloudy-day',
    'partly-cloudy-night': 'partly-cloudy-night',
    'cloudy': 'cloudy',
    'foggy': 'mist',
    'mist': 'mist',
    'rainy': 'rainy',
    'rain': 'rainy',
    'snowy': 'snow',
    'snow': 'snow',
    'thunderstorm': 'thunderstorm'
  }
  
  return weatherMap[weather] || (isNight ? 'clear-night' : 'sunny')
}

const HourlyForecast: React.FC<HourlyForecastProps> = ({
  hoursData,
  activeHourIndex,
  tempUnit,
  onScroll,
  onWheel,
  onHourClick,
  containerRef
}) => {
  return (
    <div
      ref={containerRef}
      className="hours-container"
      onScroll={onScroll}
      onWheel={onWheel}
    >
      <div className="hours">
        {hoursData.slice(0, 48).map((hour, index) => {
          const isNight = hour.hour < 6 || hour.hour > 19
          return (
            <div
              key={`${hour.day}-${hour.hour}-${index}`}
              className={`hour ${index === activeHourIndex ? 'active' : ''}`}
              data-day={hour.day}
              data-hour={hour.hour}
              data-weather={hour.weather}
              data-temp={hour.temp}
              onClick={() => onHourClick(index)}
            >
              <span className="timeSpan">{formatTime(hour.time)}</span>
              <div className="weather-icon-svg">
                <svg className="icon-hourly" viewBox="0 0 100 100">
                  <use href={`#${getWeatherIconSVG(hour.weather, isNight)}`}></use>
                </svg>
              </div>
              <div className="tempContainer">
                <span className="tempSpan">
                  {tempUnit === 'F' ? `${hour.tempF}°` : `${hour.temp}°`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default HourlyForecast