// Temporary block type definitions until payload types are regenerated

export interface DestinationDetailBlock {
  destination?: number | { 
    id: number
    title: string
    city?: string | null
    country?: string | null
    flagSvg?: string | null
    countryData?: any
  }
  background?: {
    backgroundType?: 'transparent' | 'color'
    backgroundColor?: string
  }
  separatorLinesColor?: string
  showWeatherCard?: boolean
  showAnimatedFlag?: boolean
  useMockData?: boolean
  id?: string
  blockName?: string
  blockType: 'destinationDetailBlock'
}


export interface WeatherCardBlockType {
  blockType: 'weatherCardBlock'
  title?: string
  location?: string
  city?: string
  lat?: number | null
  lng?: number | null
  useMockData?: boolean
  id?: string
  blockName?: string
}