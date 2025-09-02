'use client'

import React from 'react'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faLocationArrow
} from '@fortawesome/free-solid-svg-icons'
import { celsiusToFahrenheit, getUVSeverity } from '../utils/weatherUtils'
import { WeatherData } from '../types/weather'

interface WeatherDetailsProps {
  weatherData: WeatherData
  tempUnit: 'F' | 'C'
}

const WeatherDetails: React.FC<WeatherDetailsProps> = ({ weatherData, tempUnit }) => {
  // Format sunrise/sunset times
  const formatTime = (time?: string) => {
    if (!time) return '6:30 AM' // Default if no time provided
    try {
      const date = new Date(time)
      if (isNaN(date.getTime())) return '6:30 AM' // Fallback for invalid date
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return '6:30 AM'
    }
  }

  // Get AQI color based on value
  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#4ade80' // Green - Good
    if (aqi <= 100) return '#facc15' // Yellow - Moderate
    if (aqi <= 150) return '#fb923c' // Orange - Unhealthy for Sensitive
    if (aqi <= 200) return '#f87171' // Red - Unhealthy
    if (aqi <= 300) return '#c084fc' // Purple - Very Unhealthy
    return '#dc2626' // Dark Red - Hazardous
  }

  const airQualityValue = weatherData.airQuality?.aqi || 42
  const airQualityCategory = weatherData.airQuality?.category || 'Good'

  return (
    <div className="weather-details">
      {/* Air Quality Section - Enhanced */}
      <div className="air-quality-section">
        {/* Air Quality Section - Simplified */}
        <div className="air-quality">
          <h4>
            <Image 
              src="/weather/lungs.png" 
              alt="Air Quality" 
              width={24} 
              height={24}
              style={{ objectFit: 'contain' }}
            />
            Air Quality
          </h4>
          <div className="detail-value">
            <span className="value-large" style={{ color: getAQIColor(airQualityValue) }}>
              {airQualityValue}
            </span>
            <span className="value-label">{airQualityCategory}</span>
          </div>
        </div>
      </div>
      
      <div className="detail-grid">
        {weatherData.current.feelsLike !== undefined && (
          <div className="detail-item">
            <Image 
              src="/weather/temp.png" 
              alt="Temperature" 
              width={32} 
              height={32}
              style={{ objectFit: 'contain' }}
            />
            <div className="detail-content">
              <span className="detail-label">Feels Like</span>
              <span className="detail-value">
                {tempUnit === 'F' 
                  ? `${weatherData.current.feelsLikeF || celsiusToFahrenheit(weatherData.current.feelsLike)}°` 
                  : `${weatherData.current.feelsLike}°`}
              </span>
            </div>
          </div>
        )}
        
        {weatherData.current.humidity !== undefined && (
          <div className="detail-item">
            <Image 
              src="/weather/humidity.png" 
              alt="Humidity" 
              width={32} 
              height={32}
              style={{ objectFit: 'contain' }}
            />
            <div className="detail-content">
              <span className="detail-label">Humidity</span>
              <span className="detail-value">{weatherData.current.humidity}%</span>
            </div>
          </div>
        )}
        
        {weatherData.current.uvIndex !== undefined && (
          <div className="detail-item">
            <Image 
              src="/weather/uv.png" 
              alt="UV Index" 
              width={32} 
              height={32}
              style={{ objectFit: 'contain' }}
            />
            <div className="detail-content">
              <span className="detail-label">UV Index</span>
              <span className="detail-value">
                {weatherData.current.uvIndex} <span className="uv-severity">({getUVSeverity(weatherData.current.uvIndex)})</span>
              </span>
            </div>
          </div>
        )}
        
        {weatherData.current.windSpeed !== undefined && (
          <div className="detail-item">
            <Image 
              src="/weather/wind.png" 
              alt="Wind" 
              width={32} 
              height={32}
              style={{ objectFit: 'contain' }}
            />
            <div className="detail-content">
              <span className="detail-label">Wind</span>
              <span className="detail-value">
                {weatherData.current.windSpeed} mph
                <span className="wind-direction">
                  <FontAwesomeIcon 
                    icon={faLocationArrow} 
                    style={{transform: `rotate(${(weatherData.current.windDirection || 0) - 45}deg)`, marginLeft: '0.5rem'}}
                  />
                </span>
              </span>
            </div>
          </div>
        )}
        
        {weatherData.current.pressure !== undefined && (
          <div className="detail-item">
            <Image 
              src="/weather/pressure.png" 
              alt="Pressure" 
              width={32} 
              height={32}
              style={{ objectFit: 'contain' }}
            />
            <div className="detail-content">
              <span className="detail-label">Pressure</span>
              <span className="detail-value">{weatherData.current.pressure} mb</span>
            </div>
          </div>
        )}

        {weatherData.current.visibility !== undefined && (
          <div className="detail-item">
            <Image 
              src="/weather/visibility.png" 
              alt="Visibility" 
              width={32} 
              height={32}
              style={{ objectFit: 'contain' }}
            />
            <div className="detail-content">
              <span className="detail-label">Visibility</span>
              <span className="detail-value">{weatherData.current.visibility} mi</span>
            </div>
          </div>
        )}

        {/* Sunrise */}
        <div className="detail-item">
          <Image 
            src="/weather/sunrise.png" 
            alt="Sunrise" 
            width={32} 
            height={32}
            style={{ objectFit: 'contain' }}
          />
          <div className="detail-content">
            <span className="detail-label">Sunrise</span>
            <span className="detail-value">{formatTime(weatherData.current.sunrise)}</span>
          </div>
        </div>

        {/* Sunset */}
        <div className="detail-item">
          <Image 
            src="/weather/sunset.png" 
            alt="Sunset" 
            width={32} 
            height={32}
            style={{ objectFit: 'contain' }}
          />
          <div className="detail-content">
            <span className="detail-label">Sunset</span>
            <span className="detail-value">{formatTime(weatherData.current.sunset)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeatherDetails