import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY
  if (!apiKey) {
    console.error('OpenWeatherMap API key not configured')
    return NextResponse.json({ error: 'Weather service not configured' }, { status: 503 })
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`
    const response = await fetch(url, {
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: Math.round(data.wind.speed),
      humidity: data.main.humidity,
      main: data.weather[0].main,
      city: data.name
    })
  } catch (error) {
    console.error('Error fetching weather:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
