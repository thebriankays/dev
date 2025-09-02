'use client'

import React from 'react'
import './Animated3DIcon.scss'

interface Animated3DIconProps {
  weatherType: string
  size?: 'small' | 'medium' | 'large'
}

interface WeatherLabelProps {
  weatherType: string
}

export const WeatherLabel: React.FC<WeatherLabelProps> = ({ weatherType }) => {
  const getWeatherLabel = (weather: string) => {
    switch (weather.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return 'Sunny'
      case 'rainy':
      case 'rain':
        return 'Rainy'
      case 'snowy':
      case 'snow':
        return 'Snowy'
      case 'thunderstorm':
        return 'Thunderstorm'
      case 'partly-cloudy':
        return 'Partly Cloudy'
      case 'cloudy':
        return 'Cloudy'
      default:
        return 'Sunny'
    }
  }

  return (
    <div className="weather-label">
      {getWeatherLabel(weatherType)}
    </div>
  )
}

export const Animated3DIcon: React.FC<Animated3DIconProps> = ({ weatherType, size = 'medium' }) => {
  const getWeatherClass = (weather: string) => {
    switch (weather.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return 'weather--sun'
      case 'partly-cloudy':
        return 'weather--rainbow'
      case 'cloudy':
        return 'weather--cloudy'
      case 'rainy':
      case 'rain':
        return 'weather--rain'
      case 'snowy':
      case 'snow':
        return 'weather--snow'
      case 'thunderstorm':
        return 'weather--thunder'
      default:
        return 'weather--sun'
    }
  }

  const renderIcon = (weather: string) => {
    const normalizedWeather = weather.toLowerCase()
    
    switch (normalizedWeather) {
      case 'sunny':
      case 'clear':
        return (
          <>
            <div className="icon__sun">
              <div className="icon__sun-lights">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="icon__sun-light"></div>
                ))}
              </div>
            </div>
          </>
        )
      
      case 'rainy':
      case 'rain':
        return (
          <>
            <div className="icon__rain">
              <div className="icon__rain-drops"></div>
            </div>   
            <div className="icon__cloud">
              <div className="icon__cloud-reflect icon__cloud-reflect--1"></div>
              <div className="icon__cloud-reflect icon__cloud-reflect--2"></div>  
              <svg className="icon__cloud-svg" xmlns="http://www.w3.org/2000/svg" style={{isolation: 'isolate'}} viewBox="0 0 200 500" width="50%">
                <clipPath id="cloud-path">
                  <path d=" M 146.5 293 C 65.644 293 0 227.356 0 146.5 C 0 65.644 65.644 0 146.5 0 C 205.641 0 256.643 35.12 279.772 85.624 C 293.416 79.445 308.559 76 324.5 76 C 384.383 76 433 124.617 433 184.5 C 433 244.383 384.383 293 324.5 293 L 324.5 293 C 324.5 293 324.5 293 324.5 293 L 146.5 293 Z" fill="currentColor"/>
                </clipPath>
              </svg>
            </div>
            <div className="icon__cloud-shadow"></div>
          </>
        )
      
      case 'thunderstorm':
        return (
          <>
            <div className="icon__rain">
              <div className="icon__rain-drops"></div>
            </div>   
            <div className="icon__thunder"></div>
            <div className="icon__cloud">
              <div className="icon__cloud-reflect icon__cloud-reflect--1"></div>
              <div className="icon__cloud-reflect icon__cloud-reflect--2"></div>  
              <svg className="icon__cloud-svg" xmlns="http://www.w3.org/2000/svg" style={{isolation: 'isolate'}} viewBox="0 0 200 500" width="50%">
                <clipPath id="cloud-path">
                  <path d=" M 146.5 293 C 65.644 293 0 227.356 0 146.5 C 0 65.644 65.644 0 146.5 0 C 205.641 0 256.643 35.12 279.772 85.624 C 293.416 79.445 308.559 76 324.5 76 C 384.383 76 433 124.617 433 184.5 C 433 244.383 384.383 293 324.5 293 L 324.5 293 C 324.5 293 324.5 293 324.5 293 L 146.5 293 Z" fill="currentColor"/>
                </clipPath>
              </svg>
            </div>
            <div className="icon__cloud-shadow"></div>
          </>
        )
      
      case 'snowy':
      case 'snow':
        return (
          <>
            <div className="icon__snow">
              <div className="icon__snow-flakes"></div>
            </div>   
            <div className="icon__cloud">
              <div className="icon__cloud-reflect icon__cloud-reflect--1"></div>
              <div className="icon__cloud-reflect icon__cloud-reflect--2"></div>  
              <svg className="icon__cloud-svg" xmlns="http://www.w3.org/2000/svg" style={{isolation: 'isolate'}} viewBox="0 0 200 500" width="50%">
                <clipPath id="cloud-path">
                  <path d=" M 146.5 293 C 65.644 293 0 227.356 0 146.5 C 0 65.644 65.644 0 146.5 0 C 205.641 0 256.643 35.12 279.772 85.624 C 293.416 79.445 308.559 76 324.5 76 C 384.383 76 433 124.617 433 184.5 C 433 244.383 384.383 293 324.5 293 L 324.5 293 C 324.5 293 324.5 293 324.5 293 L 146.5 293 Z" fill="currentColor"/>
                </clipPath>
              </svg>
            </div>
            <div className="icon__cloud-shadow"></div>
          </>
        )
      
      case 'partly-cloudy':
        return (
          <>
            <div className="icon__rainbow">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="icon__rainbow-arc"></div>
              ))}
            </div>   
            <div className="icon__cloud">
              <div className="icon__cloud-reflect icon__cloud-reflect--1"></div>
              <div className="icon__cloud-reflect icon__cloud-reflect--2"></div>  
              <svg className="icon__cloud-svg" xmlns="http://www.w3.org/2000/svg" style={{isolation: 'isolate'}} viewBox="0 0 200 500" width="50%">
                <clipPath id="cloud-path">
                  <path d=" M 146.5 293 C 65.644 293 0 227.356 0 146.5 C 0 65.644 65.644 0 146.5 0 C 205.641 0 256.643 35.12 279.772 85.624 C 293.416 79.445 308.559 76 324.5 76 C 384.383 76 433 124.617 433 184.5 C 433 244.383 384.383 293 324.5 293 L 324.5 293 C 324.5 293 324.5 293 324.5 293 L 146.5 293 Z" fill="currentColor"/>
                </clipPath>
              </svg>
            </div>
            <div className="icon__cloud-shadow"></div>
          </>
        )
      
      case 'cloudy':
      default:
        return (
          <>
            <div className="icon__cloud">
              <div className="icon__cloud-reflect icon__cloud-reflect--1"></div>
              <div className="icon__cloud-reflect icon__cloud-reflect--2"></div>  
              <svg className="icon__cloud-svg" xmlns="http://www.w3.org/2000/svg" style={{isolation: 'isolate'}} viewBox="0 0 200 500" width="50%">
                <clipPath id="cloud-path">
                  <path d=" M 146.5 293 C 65.644 293 0 227.356 0 146.5 C 0 65.644 65.644 0 146.5 0 C 205.641 0 256.643 35.12 279.772 85.624 C 293.416 79.445 308.559 76 324.5 76 C 384.383 76 433 124.617 433 184.5 C 433 244.383 384.383 293 324.5 293 L 324.5 293 C 324.5 293 324.5 293, 324.5 293 L 146.5 293 Z" fill="currentColor"/>
                </clipPath>
              </svg>
            </div>
            <div className="icon__cloud-shadow"></div>
          </>
        )
    }
  }

  return (
    <div className={`weather-3d weather-3d--${size}`}>
      <div className={`weather ${getWeatherClass(weatherType)}`}>
        <div className="icon">
          {renderIcon(weatherType)}
        </div>
      </div>
      <WeatherLabel weatherType={weatherType} />
    </div>
  )
}

export default Animated3DIcon