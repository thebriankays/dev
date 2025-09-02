import React from 'react'
import Link from 'next/link'
import { AnimatedFlag } from '@/webgl/components/AnimatedFlag'
import WeatherCardServer from '@/components/WeatherCard/WeatherCardServer'

type Props = {
  destination?:
    | number
    | {
        id: number
        title: string
        slug?: string
        city?: string | null
        country?: string | null
        flagSvg?: string | null
        lat?: number | null
        lng?: number | null
        countryData?: {
          countryName?: string
          countryCode?: string
          flagUrl?: string
          [key: string]: unknown
        }
      }
  background?: {
    backgroundType?: 'transparent' | 'color'
    backgroundColor?: string
  }
  separatorLinesColor?: string
  showWeatherCard?: boolean
  showAnimatedFlag?: boolean
  useMockData?: boolean
}

export const DestinationDetailBlockComponent: React.FC<Props> = ({
  destination,
  background = { backgroundType: 'transparent' },
  separatorLinesColor = '#ffd074',
  showWeatherCard = true,
  showAnimatedFlag = true,
  useMockData = false,
}) => {
  if (!destination) return null

  const destinationData = typeof destination === 'object' ? destination : null

  return (
    <div
      className="destination-detail-block py-16"
      style={{
        backgroundColor:
          background?.backgroundType === 'color' ? background.backgroundColor : 'transparent',
      }}
    >
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left column - Destination info */}
          <div className="destination-info">
            <h2 className="text-4xl font-bold mb-4">{destinationData?.title || 'Destination'}</h2>
            {destinationData?.city && <p className="text-xl mb-2">{destinationData.city}</p>}
            {destinationData?.country && (
              <p className="text-lg text-gray-600 mb-6">{destinationData.country}</p>
            )}

            {showWeatherCard && destinationData?.city && (
              <div className="weather-section mb-8">
                <WeatherCardServer 
                  city={destinationData.city} 
                  lat={destinationData.lat}
                  lng={destinationData.lng}
                  location={destinationData.city}
                  useMockData={useMockData} 
                />
              </div>
            )}

            {/* AreaExplorer link */}
            {destinationData?.slug && (
              <div className="area-explorer-link mb-6">
                <Link
                  href={`/explore/${destinationData.slug}`}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  <span className="mr-2">🗺️</span>
                  Explore in 3D
                </Link>
              </div>
            )}
          </div>

          {/* Right column - Animated flag */}
          {showAnimatedFlag && destinationData?.flagSvg && (
            <div className="flag-section flex justify-center items-center h-64">
              <AnimatedFlag flagSvg={destinationData.flagSvg} width={300} height={200} />
            </div>
          )}
        </div>
      </div>

      {/* Separator line */}
      <div
        className="separator-line mx-auto mt-12"
        style={{
          width: '100px',
          height: '2px',
          backgroundColor: separatorLinesColor,
        }}
      />
    </div>
  )
}
