'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import './WeatherCard.scss'
import CurrentWeather from './CurrentWeather/CurrentWeather'
import WeatherAnimations from './WeatherAnimations/WeatherAnimations'
import HourlyForecast from './HourlyForecast/HourlyForecast'
import WeatherDetails from './WeatherDetails/WeatherDetails'
import DailyForecast from './DailyForecast/DailyForecast'
import WeatherIconsSVG from './WeatherIconsSVG/WeatherIconsSVG'
import { celsiusToFahrenheit, mapWeatherType } from './utils/weatherUtils'
import { HourData, WeatherData } from './types/weather'

interface WeatherCardClientProps {
  weatherData: WeatherData
  location?: string
}

const WeatherCardClient: React.FC<WeatherCardClientProps> = ({ weatherData, location }) => {
  // Prevent hydration errors by only rendering after mount
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Convert API data to component format
  const hoursData: HourData[] = weatherData.hourly.map((hour, index) => {
    const time = hour.time || '00:00'
    const hourNum = parseInt(time.split(':')[0] || '0')
    const dayIndex = Math.floor(index / 24)

    return {
      day: dayIndex === 0 ? 'tod' : 'tom',
      hour: hourNum,
      weather: mapWeatherType(hour.weather),
      temp: hour.temp,
      tempF: celsiusToFahrenheit(hour.temp),
      time: time,
    }
  })

  const [activeHourIndex, setActiveHourIndex] = useState(0)
  const [temperature, setTemperature] = useState(weatherData.current.temp)
  const [temperatureF, setTemperatureF] = useState(weatherData.current.tempF || celsiusToFahrenheit(weatherData.current.temp))
  const [weatherType, setWeatherType] = useState(mapWeatherType(weatherData.current.weather))
  const [currentDay, setCurrentDay] = useState('Today')
  const [showCurrentTemp, setShowCurrentTemp] = useState(true)
  const [lightningDuration, setLightningDuration] = useState(2)
  const [tempUnit, setTempUnit] = useState<'F' | 'C'>('F')

  const hoursContainerRef = useRef<HTMLDivElement>(null)

  // Lightning duration randomizer
  useEffect(() => {
    const interval = setInterval(() => {
      const minDuration = 1
      const maxDuration = 4
      const randomDuration = Math.random() * (maxDuration - minDuration) + minDuration
      setLightningDuration(randomDuration)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const toggleSunMoon = (hour: number) => {
    const sun = document.querySelector('.sun') as HTMLElement
    const moon = document.querySelector('.moon') as HTMLElement
    const background = document.querySelector('.background') as HTMLElement
    const backgroundNight = document.querySelector('.backgroundNight') as HTMLElement
    const cloud = document.querySelector('#cloud') as HTMLElement
    const rain = document.querySelector('#rain') as HTMLElement
    const cardBody = document.querySelector('.card-body') as HTMLElement

    if (hour >= 6 && hour <= 19) {
      // Sun rises at 6am (-90°) and sets at 7pm (90°)
      // Total arc = 180° over 13 hours (6am to 7pm)
      const rotation = -90 + ((hour - 6) * (180 / 13))
      if (sun) {
        sun.style.transform = `rotate(${rotation}deg)`
        sun.style.opacity = '1'
      }
      if (moon) moon.style.opacity = '0'
      if (background) background.style.opacity = '1'
      if (backgroundNight) backgroundNight.style.opacity = '0'
      if (cardBody) cardBody.setAttribute('data-time', 'day')
      document.querySelectorAll('.cardInfo').forEach((el) => ((el as HTMLElement).style.filter = 'invert(0%)'))
      if (cloud) {
        cloud.style.filter = 'brightness(200%) drop-shadow(0 0 10px rgba(255, 255, 255, 1))'
        cloud.style.mixBlendMode = 'normal'
      }
      if (rain) rain.style.mixBlendMode = 'normal'
    } else {
      if (moon) moon.style.opacity = '1'
      if (sun) sun.style.opacity = '0'
      // Moon appears from 8pm to 5am
      // For hours 20-23 (8pm-11pm) and 0-5 (12am-5am)
      let moonHour = hour
      if (hour < 6) {
        // After midnight, add 24 to continue the arc
        moonHour = hour + 24
      }
      // Moon rises at 8pm (hour 20) at -90° and sets at 5am (hour 29) at 90°
      // Total arc = 180° over 9 hours
      const rotation = -90 + ((moonHour - 20) * (180 / 9))
      if (moon) moon.style.transform = `rotate(${rotation}deg)`
      if (background) background.style.opacity = '0'
      if (backgroundNight) backgroundNight.style.opacity = '1'
      if (cardBody) cardBody.setAttribute('data-time', 'night')
      document.querySelectorAll('.cardInfo').forEach((el) => ((el as HTMLElement).style.filter = 'invert(100%)'))
      if (cloud) {
        cloud.style.filter = 'brightness(0%) drop-shadow(0 0 10px rgba(255, 255, 255, 1))'
        cloud.style.mixBlendMode = 'multiply'
      }
      if (rain) rain.style.mixBlendMode = 'soft-light'
    }
  }

  const updateWeatherAndTemperature = (hourData: HourData) => {
    setTemperature(hourData.temp)
    setTemperatureF(hourData.tempF)
    setWeatherType(hourData.weather)
    setCurrentDay(hourData.day === 'tom' ? 'Tomorrow' : 'Today')

    const rain = document.querySelector('#rain') as HTMLElement
    const snow = document.querySelector('#snow') as HTMLElement
    const cloud = document.querySelector('#cloud') as HTMLElement
    const thunderstorm = document.querySelector('#thunderstorm') as HTMLElement
    const background = document.querySelector('.background') as HTMLElement
    const sun = document.querySelector('.sun') as HTMLElement
    const moon = document.querySelector('.moon') as HTMLElement

    // Reset all weather elements
    if (rain) rain.style.opacity = '0'
    if (snow) snow.style.opacity = '0'
    if (cloud) cloud.style.opacity = '0'
    if (thunderstorm) thunderstorm.style.opacity = '0'
    if (background) background.style.filter = 'none'
    if (sun) sun.style.filter = 'none'
    if (moon) moon.style.filter = 'none'

    // Apply weather-specific styles
    switch (hourData.weather) {
      case 'rainy':
        if (rain) rain.style.opacity = '1'
        if (cloud) cloud.style.opacity = '0.8'
        if (background) background.style.filter = 'grayscale(0.5) brightness(0.5)'
        if (moon) moon.style.filter = 'brightness(0.8)'
        break
      case 'snowy':
        if (snow) snow.style.opacity = '1'
        if (cloud) cloud.style.opacity = '0'
        if (background) background.style.filter = 'grayscale(0.5) opacity(0.4)'
        if (sun) sun.style.filter = 'grayscale(0.9)'
        break
      case 'cloudy':
        if (cloud) cloud.style.opacity = '0.9'
        if (background) background.style.filter = 'grayscale(0.5) brightness(0.5)'
        if (moon) moon.style.filter = 'brightness(0.8)'
        break
      case 'thunderstorm':
        if (cloud) cloud.style.opacity = '0.8'
        if (thunderstorm) thunderstorm.style.opacity = '1'
        if (background) background.style.filter = 'grayscale(1) brightness(0.1)'
        if (sun) sun.style.filter = 'grayscale(0.9)'
        break
      case 'partly-cloudy':
      case 'partly-cloudy-night':
        if (cloud) cloud.style.opacity = '0.5'
        break
    }
  }

  const handleScroll = () => {
    if (!hoursContainerRef.current) return
    
    const scrollLeft = hoursContainerRef.current.scrollLeft
    const hourWidth = 97 // 85px width + 12px gap
    const hourIndex = Math.round(scrollLeft / hourWidth)
    const currentHourData = hoursData[hourIndex]

    if (currentHourData && hourIndex !== activeHourIndex) {
      setActiveHourIndex(hourIndex)
      setShowCurrentTemp(false)
      toggleSunMoon(currentHourData.hour)
      updateWeatherAndTemperature(currentHourData)
    }
  }

  const handleHourClick = (index: number) => {
    const hourData = hoursData[index]
    if (!hourData) return

    setActiveHourIndex(index)
    setShowCurrentTemp(false)
    toggleSunMoon(hourData.hour)
    updateWeatherAndTemperature(hourData)

    if (hoursContainerRef.current) {
      const hourWidth = 97
      const targetScroll = index * hourWidth
      hoursContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  // Handle wheel events
  const handleWheel = (event: React.WheelEvent) => {
    if (!hoursContainerRef.current) return
    event.preventDefault()
    hoursContainerRef.current.scrollLeft += event.deltaY
  }

  // Initial setup
  useEffect(() => {
    const firstHourData = hoursData[0]
    if (firstHourData) {
      setActiveHourIndex(0)
      toggleSunMoon(firstHourData.hour)
      updateWeatherAndTemperature(firstHourData)
    } else {
      // If no hour data, use current time
      const currentHour = new Date().getHours()
      toggleSunMoon(currentHour)
    }

    if (hoursContainerRef.current) {
      hoursContainerRef.current.scrollLeft = 0
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Don't render until mounted to prevent hydration errors
  if (!mounted) {
    return (
      <div className="weather-card-full-container">
        <div className="weather-card-left">
          <div className="card weather-card" />
        </div>
        <div className="weather-forecast-right" />
      </div>
    )
  }

  return (
    <div className="weather-card-full-container">
      <div className="weather-card-left">
        <div className="card weather-card">
          <div className="card-body">
            <div className="backgroundNight"></div>
            <div className="background"></div>
            
            <CurrentWeather
              weatherData={weatherData}
              location={location}
              tempUnit={tempUnit}
              showCurrentTemp={showCurrentTemp}
              temperature={temperature}
              temperatureF={temperatureF}
              weatherType={weatherType}
              currentDay={currentDay}
            />
            
            <div className="weather-animations-container">
              <WeatherAnimations
                key={`${weatherType}-${activeHourIndex}`}
                weatherType={weatherType}
                lightningDuration={lightningDuration}
              />
            </div>
            
            <HourlyForecast
              hoursData={hoursData}
              activeHourIndex={activeHourIndex}
              tempUnit={tempUnit}
              onScroll={handleScroll}
              onWheel={handleWheel}
              onHourClick={handleHourClick}
              containerRef={hoursContainerRef}
            />
          </div>
        </div>
      </div>

      {/* 5-Day Forecast with Animated Icons */}
      <div className="weather-forecast-right">
        <WeatherDetails weatherData={weatherData} tempUnit={tempUnit} />
        
        <div className="forecast-header">
          <h3 className="forecast-title">5-Day Forecast</h3>
          <div className="temp-toggle">
            <button
              className={`temp-btn ${tempUnit === 'F' ? 'active' : ''}`}
              onClick={() => setTempUnit('F')}
            >
              <Image 
                src="/weather/f.png" 
                alt="Fahrenheit" 
                width={16} 
                height={16}
                style={{ objectFit: 'contain' }}
              />
              °F
            </button>
            <button
              className={`temp-btn ${tempUnit === 'C' ? 'active' : ''}`}
              onClick={() => setTempUnit('C')}
            >
              <Image 
                src="/weather/c.png" 
                alt="Celsius" 
                width={16} 
                height={16}
                style={{ objectFit: 'contain' }}
              />
              °C
            </button>
          </div>
        </div>
        
        <DailyForecast dailyData={weatherData.daily} tempUnit={tempUnit} />
      </div>

      {/* SVG Weather Icons Definition */}
      <WeatherIconsSVG />
    </div>
  )
}

export default WeatherCardClient