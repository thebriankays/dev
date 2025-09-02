export interface HourData {
  day: string
  hour: number
  weather: string
  temp: number
  tempF: number
  time: string
}

export interface DailyData {
  day: string
  high: number
  low: number
  weather: string
  icon: string
}

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
  hourly: Array<{
    time: string
    temp: number
    weather: string
    icon: string
  }>
  daily: Array<{
    day: string
    high: number
    low: number
    weather: string
    icon: string
  }>
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