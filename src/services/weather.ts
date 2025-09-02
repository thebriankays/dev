// types/weather.ts
export interface WeatherData {
  current: {
    temp: number
    tempF?: number
    weather: string
    icon: string
    description: string
    feelsLike?: number
    feelsLikeF?: number
    dewPoint?: number
    dewPointF?: number
    heatIndex?: number
    heatIndexF?: number
    windChill?: number
    windChillF?: number
    humidity?: number
    uvIndex?: number
    precipitationProb?: number
    precipitationType?: string
    thunderstormProb?: number
    pressure?: number
    windSpeed?: number
    windDirection?: number
    windGust?: number
    visibility?: number
    cloudCover?: number
    sunrise?: string
    sunset?: string
  }
  hourly: HourData[]
  daily: DayData[]
  airQuality?: {
    aqi: number
    category: string
    dominantPollutant?: string
    pollutants?: {
      pm2_5?: {
        value: number
        units: string
        displayName: string
        fullName: string
        additionalInfo?: {
          sources: string
          effects: string
        }
      }
      pm10?: {
        value: number
        units: string
        displayName: string
        fullName: string
        additionalInfo?: {
          sources: string
          effects: string
        }
      }
      o3?: {
        value: number
        units: string
        displayName: string
        fullName: string
        additionalInfo?: {
          sources: string
          effects: string
        }
      }
      no2?: {
        value: number
        units: string
        displayName: string
        fullName: string
        additionalInfo?: {
          sources: string
          effects: string
        }
      }
      so2?: {
        value: number
        units: string
        displayName: string
        fullName: string
        additionalInfo?: {
          sources: string
          effects: string
        }
      }
      co?: {
        value: number
        units: string
        displayName: string
        fullName: string
        additionalInfo?: {
          sources: string
          effects: string
        }
      }
    }
    healthRecommendations?: {
      generalPopulation: string
      elderly?: string
      lungDiseasePopulation?: string
      heartDiseasePopulation?: string
      athletes?: string
      pregnantWomen?: string
      children?: string
    }
  }
  historical?: {
    tempChange24h?: number
    maxTemp24h?: number
    minTemp24h?: number
    precipitation24h?: number
  }
}

export interface HourData {
  time: string
  temp: number
  weather: string
  icon: string
}

export interface DayData {
  day: string
  high: number
  low: number
  weather: string
  icon: string
}

// Weather condition mapping from Google API to our format
const googleWeatherConditionMap: Record<string, string> = {
  CLEAR: 'sunny',
  SUNNY: 'sunny',
  CLOUDY: 'cloudy',
  PARTLY_CLOUDY: 'partly-cloudy',
  RAIN: 'rainy',
  RAIN_SHOWERS: 'rainy',
  SCATTERED_SHOWERS: 'rainy',
  LIGHT_RAIN: 'rainy',
  THUNDERSTORM: 'thunderstorm',
  SNOW: 'snowy',
  LIGHT_SNOW: 'snowy',
  FOG: 'foggy',
  MIST: 'foggy',
  DRIZZLE: 'rainy',
}

// Generate mock data for fallback
export function generateMockWeatherData(_location: string): WeatherData {
  const baseTemp = 25 + Math.floor(Math.random() * 5)
  const weatherTypes = ['sunny', 'partly-cloudy', 'cloudy', 'rainy', 'thunderstorm']
  const currentWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)]

  // Generate hourly data
  const hourly: HourData[] = []
  const now = new Date()

  for (let i = 0; i < 48; i++) {
    const hour = new Date(now.getTime() + i * 60 * 60 * 1000)
    const hourNum = hour.getHours()
    const isNight = hourNum < 6 || hourNum >= 22

    let weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)]
    if (isNight && weather === 'sunny') {
      weather = 'clear-night'
    } else if (isNight && weather === 'partly-cloudy') {
      weather = 'partly-cloudy-night'
    }

    hourly.push({
      time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      temp: baseTemp + Math.floor(Math.random() * 10) - 5,
      weather: weather || 'sunny',
      icon: weather || 'sunny',
    })
  }

  // Generate daily data
  const daily: DayData[] = []
  const today = new Date()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  for (let i = 0; i < 5; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[date.getDay()]
    
    const dayWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)]
    daily.push({
      day: dayName,
      high: baseTemp + 5 + Math.floor(Math.random() * 5),
      low: baseTemp - 5 + Math.floor(Math.random() * 5),
      weather: dayWeather || 'sunny',
      icon: dayWeather || 'sunny',
    })
  }

  const celsiusToFahrenheit = (c: number) => Math.round((c * 9/5) + 32)

  // Generate sunrise/sunset times based on current date
  const sunriseDate = new Date(now)
  sunriseDate.setHours(6, 30, 0, 0)
  const sunsetDate = new Date(now)
  sunsetDate.setHours(20, 45, 0, 0)

  return {
    current: {
      temp: baseTemp,
      tempF: celsiusToFahrenheit(baseTemp),
      weather: currentWeather || 'sunny',
      icon: currentWeather || 'sunny',
      description: currentWeather?.replace(/-/g, ' ') || 'sunny',
      feelsLike: baseTemp - 2,
      feelsLikeF: celsiusToFahrenheit(baseTemp - 2),
      dewPoint: baseTemp - 8,
      dewPointF: celsiusToFahrenheit(baseTemp - 8),
      heatIndex: baseTemp + 2,
      heatIndexF: celsiusToFahrenheit(baseTemp + 2),
      windChill: baseTemp - 3,
      windChillF: celsiusToFahrenheit(baseTemp - 3),
      humidity: 45 + Math.floor(Math.random() * 30),
      uvIndex: Math.floor(Math.random() * 8) + 1,
      precipitationProb: currentWeather === 'rainy' ? 60 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 20),
      precipitationType: currentWeather === 'rainy' ? 'Rain' : currentWeather === 'snowy' ? 'Snow' : undefined,
      thunderstormProb: currentWeather === 'thunderstorm' ? 70 : Math.floor(Math.random() * 10),
      pressure: 1013 + Math.floor(Math.random() * 20) - 10,
      windSpeed: Math.floor(Math.random() * 20) + 5,
      windDirection: Math.floor(Math.random() * 360),
      windGust: Math.floor(Math.random() * 10) + 15,
      visibility: 8 + Math.floor(Math.random() * 4),
      cloudCover: currentWeather === 'sunny' ? Math.floor(Math.random() * 20) : 40 + Math.floor(Math.random() * 50),
      sunrise: sunriseDate.toISOString(),
      sunset: sunsetDate.toISOString(),
    },
    hourly,
    daily,
    airQuality: {
      aqi: Math.floor(Math.random() * 50) + 20,
      category: 'Good',
      dominantPollutant: 'pm25',
      pollutants: {
        pm2_5: {
          value: 21.4 + Math.random() * 10 - 5,
          units: 'μg/m³',
          displayName: 'PM2.5',
          fullName: 'Fine particulate matter (<2.5μm)',
          additionalInfo: {
            sources: 'Main sources are combustion processes (e.g. power plants, indoor heating, wildfires).',
            effects: 'Fine particles can penetrate into the lungs and bloodstream. Short term exposure can cause coughing and breathing difficulties.'
          }
        },
        pm10: {
          value: 35.2 + Math.random() * 15 - 7,
          units: 'μg/m³',
          displayName: 'PM10',
          fullName: 'Inhalable particulate matter (<10μm)',
          additionalInfo: {
            sources: 'Main sources are combustion processes (e.g. indoor heating, wildfires), road dust.',
            effects: 'Inhalable particles can penetrate into the lungs. Short term exposure can cause coughing.'
          }
        },
        o3: {
          value: 97 + Math.random() * 30 - 15,
          units: 'μg/m³',
          displayName: 'O₃',
          fullName: 'Ozone',
          additionalInfo: {
            sources: 'Ozone is created in a chemical reaction between atmospheric oxygen and pollutants.',
            effects: 'Ozone can irritate the airways and cause coughing, a burning sensation.'
          }
        },
        no2: {
          value: 10.6 + Math.random() * 8 - 4,
          units: 'μg/m³',
          displayName: 'NO₂',
          fullName: 'Nitrogen dioxide',
          additionalInfo: {
            sources: 'Main sources are fuel burning processes, such as vehicle engines and power plants.',
            effects: 'Exposure may cause increased bronchial reactivity in asthmatics.'
          }
        },
        so2: {
          value: 0.5 + Math.random() * 2 - 1,
          units: 'μg/m³',
          displayName: 'SO₂',
          fullName: 'Sulfur dioxide',
          additionalInfo: {
            sources: 'Main sources are burning processes of sulfur-containing fuel in industry.',
            effects: 'Exposure causes irritation of the respiratory tract, coughing.'
          }
        },
        co: {
          value: 248 + Math.random() * 100 - 50,
          units: 'μg/m³',
          displayName: 'CO',
          fullName: 'Carbon monoxide',
          additionalInfo: {
            sources: 'Typically originates from incomplete combustion processes.',
            effects: 'When inhaled, carbon monoxide can prevent the blood from carrying oxygen.'
          }
        },
      },
      healthRecommendations: {
        generalPopulation: 'With this level of air quality, you have no limitations. Enjoy the outdoors!',
        elderly: 'Air quality is good for most people. Enjoy outdoor activities.',
        lungDiseasePopulation: 'Air quality is generally good for people with lung conditions.',
        heartDiseasePopulation: 'Air quality is generally good for people with heart conditions.',
        athletes: 'Perfect conditions for outdoor exercise and sports.',
        pregnantWomen: 'Air quality is good for expectant mothers.',
        children: 'Great day for children to play outside.'
      }
    },
    historical: {
      tempChange24h: Math.floor(Math.random() * 10) - 5,
      maxTemp24h: baseTemp + 8,
      minTemp24h: baseTemp - 6,
      precipitation24h: currentWeather === 'rainy' ? Math.random() * 2 : 0,
    },
  }
}

export async function fetchWeatherData(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.error('Google Maps API key not found')
      return generateMockWeatherData(`Location at ${lat}, ${lng}`)
    }

    console.log('Attempting to fetch weather data for coordinates:', { lat, lng })

    // Fetch both hourly and daily forecasts
    try {
      // Fetch hourly forecast
      const hourlyUrl = `https://weather.googleapis.com/v1/forecast/hours:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&hours=48`
      console.log('Fetching hourly forecast...')
      const hourlyResponse = await fetch(hourlyUrl, {
        next: { revalidate: 3600 } // Cache for 1 hour
      })

      // Fetch daily forecast (5 days)
      const dailyUrl = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&days=5`
      console.log('Fetching daily forecast...')
      const dailyResponse = await fetch(dailyUrl, {
        next: { revalidate: 3600 } // Cache for 1 hour
      })

      if (hourlyResponse.ok && dailyResponse.ok) {
        const hourlyData = await hourlyResponse.json()
        const dailyData = await dailyResponse.json()
        console.log('Weather API success!')

        // Process hourly data
        const hourlyForecast = hourlyData.forecastHours || []
        const currentHour = hourlyForecast[0]

        const hourly = hourlyForecast.map((hour: any) => ({
          time: new Date(hour.interval.startTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          temp: Math.round(hour.temperature?.degrees || 20),
          weather: googleWeatherConditionMap[hour.weatherCondition?.type] || 'sunny',
          icon: hour.weatherCondition?.type || 'CLEAR',
        }))

        // Process daily data from the new endpoint
        const daily: DayData[] = []
        const forecastDays = dailyData.forecastDays || []
        
        console.log('Daily forecast data received:', forecastDays.length, 'days')
        
        forecastDays.forEach((day: any, index: number) => {
          // Get the date from displayDate
          const date = new Date(day.displayDate.year, day.displayDate.month - 1, day.displayDate.day)
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          const dayName = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : dayNames[date.getDay()]
          
          // Use daytime weather as primary weather
          const weatherType = day.daytimeForecast?.weatherCondition?.type || 'CLEAR'
          
          console.log(`Day ${index}: ${dayName}, High: ${day.maxTemperature?.degrees}, Low: ${day.minTemperature?.degrees}, Weather: ${weatherType}`)
          
          daily.push({
            day: dayName,
            high: Math.round(day.maxTemperature?.degrees || 25),
            low: Math.round(day.minTemperature?.degrees || 15),
            weather: googleWeatherConditionMap[weatherType] || 'sunny',
            icon: weatherType,
          })
        })
        
        // Ensure we always have 5 days
        while (daily.length < 5) {
          const dayIndex = daily.length
          const futureDate = new Date()
          futureDate.setDate(futureDate.getDate() + dayIndex)
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          const dayName = dayIndex === 0 ? 'Today' : dayIndex === 1 ? 'Tomorrow' : dayNames[futureDate.getDay()]
          
          // Use current weather as fallback
          const fallbackTemp = currentHour?.temperature?.degrees || 25
          daily.push({
            day: dayName,
            high: Math.round(fallbackTemp + 5),
            low: Math.round(fallbackTemp - 5),
            weather: googleWeatherConditionMap[currentHour?.weatherCondition?.type] || 'sunny',
            icon: currentHour?.weatherCondition?.type || 'CLEAR',
          })
        }
        
        console.log('Final daily data:', daily.length, 'days')

        // Try to get air quality data
        let airQuality = undefined
        try {
          const airQualityUrl = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`
          const airQualityBody = {
            location: {
              latitude: lat,
              longitude: lng,
            },
            extraComputations: [
              'HEALTH_RECOMMENDATIONS',
              'DOMINANT_POLLUTANT_CONCENTRATION',
              'POLLUTANT_CONCENTRATION',
              'LOCAL_AQI',
              'POLLUTANT_ADDITIONAL_INFO'
            ],
            languageCode: 'en',
          }

          const airResponse = await fetch(airQualityUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(airQualityBody),
            next: { revalidate: 7200 }, // Cache for 2 hours (air quality changes slower)
          })

          if (airResponse.ok) {
            const airData = await airResponse.json()
            console.log('Air Quality API full response:', JSON.stringify(airData, null, 2))
            
            if (airData.indexes && airData.indexes.length > 0) {
              // Extract pollutant concentrations with full details
              const pollutants: any = {}
              
              if (airData.pollutants) {
                airData.pollutants.forEach((pollutant: any) => {
                  const code = pollutant.code
                  const concentration = pollutant.concentration
                  
                  const pollutantData = {
                    value: concentration?.value || 0,
                    units: concentration?.units === 'PARTS_PER_BILLION' ? 'ppb' : 'μg/m³',
                    displayName: pollutant.displayName || code.toUpperCase(),
                    fullName: pollutant.fullName || pollutant.displayName || code.toUpperCase(),
                    additionalInfo: pollutant.additionalInfo ? {
                      sources: pollutant.additionalInfo.sources || '',
                      effects: pollutant.additionalInfo.effects || ''
                    } : undefined
                  }
                  
                  switch (code) {
                    case 'pm25':
                      pollutants.pm2_5 = pollutantData
                      break
                    case 'pm10':
                      pollutants.pm10 = pollutantData
                      break
                    case 'o3':
                      pollutants.o3 = pollutantData
                      break
                    case 'no2':
                      pollutants.no2 = pollutantData
                      break
                    case 'so2':
                      pollutants.so2 = pollutantData
                      break
                    case 'co':
                      pollutants.co = pollutantData
                      break
                  }
                })
              }
              
              airQuality = {
                aqi: airData.indexes[0].aqi || 50,
                category: airData.indexes[0].category || 'Good',
                dominantPollutant: airData.indexes[0].dominantPollutant,
                pollutants: Object.keys(pollutants).length > 0 ? pollutants : undefined,
                healthRecommendations: airData.healthRecommendations || undefined
              }
            }
          } else {
            console.log('Air Quality API error response:', airResponse.status, await airResponse.text())
          }
        } catch (error) {
          console.log('Air Quality API error:', error)
        }

        const celsiusToFahrenheit = (c: number) => Math.round((c * 9/5) + 32)
        const currentTemp = Math.round(currentHour?.temperature?.degrees || 25)
        const feelsLike = Math.round(currentHour?.apparentTemperature?.degrees || currentTemp)
        const dewPoint = Math.round(currentHour?.dewPoint?.degrees || currentTemp - 8)
        const heatIndex = Math.round(currentHour?.heatIndex?.degrees || currentTemp)
        const windChill = Math.round(currentHour?.windChill?.degrees || currentTemp)
        
        // Get sunrise/sunset from first day's data
        const todayData = forecastDays[0]
        let sunriseTime: string
        let sunsetTime: string
        
        if (todayData?.sunEvents?.sunriseTime) {
          sunriseTime = new Date(todayData.sunEvents.sunriseTime).toISOString()
        } else {
          const defaultSunrise = new Date()
          defaultSunrise.setHours(6, 30, 0, 0)
          sunriseTime = defaultSunrise.toISOString()
        }
        
        if (todayData?.sunEvents?.sunsetTime) {
          sunsetTime = new Date(todayData.sunEvents.sunsetTime).toISOString()
        } else {
          const defaultSunset = new Date()
          defaultSunset.setHours(20, 45, 0, 0)
          sunsetTime = defaultSunset.toISOString()
        }

        return {
          current: {
            temp: currentTemp,
            tempF: celsiusToFahrenheit(currentTemp),
            weather: googleWeatherConditionMap[currentHour?.weatherCondition?.type] || 'sunny',
            icon: currentHour?.weatherCondition?.type || 'CLEAR',
            description: currentHour?.weatherCondition?.description?.text || 'Sunny',
            feelsLike: feelsLike,
            feelsLikeF: celsiusToFahrenheit(feelsLike),
            dewPoint: dewPoint,
            dewPointF: celsiusToFahrenheit(dewPoint),
            heatIndex: heatIndex,
            heatIndexF: celsiusToFahrenheit(heatIndex),
            windChill: windChill,
            windChillF: celsiusToFahrenheit(windChill),
            humidity: currentHour?.humidity?.relativeHumidity || 50,
            uvIndex: currentHour?.uvIndex?.value || 5,
            precipitationProb: currentHour?.precipitationProbability?.value || 0,
            precipitationType: currentHour?.precipitationType?.text,
            thunderstormProb: currentHour?.thunderstormProbability?.value || 0,
            pressure: currentHour?.pressure?.value || 1013,
            windSpeed: Math.round(currentHour?.wind?.speed?.value || 10),
            windDirection: currentHour?.wind?.direction?.degrees || 0,
            windGust: Math.round(currentHour?.wind?.gust?.value || 0),
            visibility: Math.round(currentHour?.visibility?.value || 10),
            cloudCover: currentHour?.cloudCover?.value || 0,
            sunrise: sunriseTime,
            sunset: sunsetTime,
          },
          hourly: hourly.slice(0, 48),
          daily,
          airQuality,
          historical: {
            tempChange24h: 0,
            maxTemp24h: Math.round(todayData?.maxTemperature?.degrees || currentTemp + 5),
            minTemp24h: Math.round(todayData?.minTemperature?.degrees || currentTemp - 5),
            precipitation24h: 0,
          },
        }
      } else {
        console.log('Weather API error:', hourlyResponse.status, dailyResponse.status)
        throw new Error('Weather API failed')
      }
    } catch (weatherError) {
      console.log('Weather API error, falling back to mock data:', weatherError)
      return generateMockWeatherData(`Location at ${lat}, ${lng}`)
    }
  } catch (error) {
    console.error('Error fetching weather data:', error)
    return generateMockWeatherData(`Location at ${lat}, ${lng}`)
  }
}