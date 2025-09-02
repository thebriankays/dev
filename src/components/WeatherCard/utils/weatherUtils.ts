// Map weather types to user-friendly descriptions
export const weatherDescriptions: { [key: string]: string } = {
  sunny: 'Sunny',
  'clear-night': 'Clear',
  'partly-cloudy': 'P. Cloudy',
  'partly-cloudy-night': 'P. Cloudy',
  cloudy: 'Cloudy',
  foggy: 'Foggy',
  rainy: 'Rainy',
  snowy: 'Snowy',
  thunderstorm: 'Thunder',
}

// Convert 24hr time to 12hr with AM/PM
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours || '0')
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minutes || '00'} ${ampm}`
}

// Convert Celsius to Fahrenheit
export const celsiusToFahrenheit = (celsius: number) => Math.round((celsius * 9) / 5 + 32)

// Map Google Weather API conditions to our internal weather types
export const mapWeatherType = (weather: string): string => {
  const normalizedWeather = weather.toUpperCase()
  
  // Clear/Sunny conditions
  if (['CLEAR', 'MOSTLY_CLEAR'].includes(normalizedWeather)) {
    return 'sunny'
  }
  
  // Partly cloudy conditions (some sun visible)
  if (['PARTLY_CLOUDY'].includes(normalizedWeather)) {
    return 'partly-cloudy'
  }
  
  // Fully cloudy conditions (no sun visible)
  if (['MOSTLY_CLOUDY', 'CLOUDY'].includes(normalizedWeather)) {
    return 'cloudy'
  }
  
  // Wind conditions (treat as cloudy)
  if (['WINDY', 'WIND_AND_RAIN'].includes(normalizedWeather)) {
    return 'partly-cloudy'
  }
  
  // All rain conditions
  if ([
    'LIGHT_RAIN_SHOWERS', 'CHANCE_OF_SHOWERS', 'SCATTERED_SHOWERS', 'RAIN_SHOWERS',
    'HEAVY_RAIN_SHOWERS', 'LIGHT_TO_MODERATE_RAIN', 'MODERATE_TO_HEAVY_RAIN',
    'RAIN', 'LIGHT_RAIN', 'HEAVY_RAIN', 'RAIN_PERIODICALLY_HEAVY'
  ].includes(normalizedWeather)) {
    return 'rainy'
  }
  
  // All snow conditions
  if ([
    'LIGHT_SNOW_SHOWERS', 'CHANCE_OF_SNOW_SHOWERS', 'SCATTERED_SNOW_SHOWERS',
    'SNOW_SHOWERS', 'HEAVY_SNOW_SHOWERS', 'LIGHT_TO_MODERATE_SNOW',
    'MODERATE_TO_HEAVY_SNOW', 'SNOW', 'LIGHT_SNOW', 'HEAVY_SNOW',
    'SNOWSTORM', 'SNOW_PERIODICALLY_HEAVY', 'HEAVY_SNOW_STORM',
    'BLOWING_SNOW', 'RAIN_AND_SNOW'
  ].includes(normalizedWeather)) {
    return 'snowy'
  }
  
  // All thunderstorm conditions
  if ([
    'THUNDERSTORM', 'THUNDERSHOWER', 'LIGHT_THUNDERSTORM_RAIN',
    'SCATTERED_THUNDERSTORMS', 'HEAVY_THUNDERSTORM'
  ].includes(normalizedWeather)) {
    return 'thunderstorm'
  }
  
  // Hail (treat as thunderstorm)
  if (['HAIL', 'HAIL_SHOWERS'].includes(normalizedWeather)) {
    return 'thunderstorm'
  }
  
  // Fallback to sunny for unknown conditions
  return 'sunny'
}

// Get wind direction from degrees
export const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index] || 'N'
}

// Get UV Index severity
export const getUVSeverity = (uv: number): string => {
  if (uv <= 2) return 'Low'
  if (uv <= 5) return 'Moderate'
  if (uv <= 7) return 'High'
  if (uv <= 10) return 'Very High'
  return 'Extreme'
}