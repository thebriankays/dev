export interface DolphinBlockProps {
  title?: string
  subtitle?: string
  sceneSettings?: {
    cameraDistance?: number
    waterColor?: string
    skyTurbidity?: number
    sunElevation?: number
  }
  dolphins?: {
    count?: '1' | '2' | '3'
    animationSpeed?: number
    pathVariation?: 'default' | 'wide' | 'narrow'
  }
  interaction?: {
    enableOrbitControls?: boolean
    autoRotate?: boolean
    rotationSpeed?: number
  }
  height?: 'small' | 'medium' | 'large' | 'full'
  glassEffect?: {
    enabled: boolean
    variant?: 'card' | 'panel' | 'subtle' | 'frost' | 'liquid'
    intensity?: number
  }
  fluidOverlay?: {
    enabled: boolean
    intensity?: number
    color?: string
  }
  webglEffects?: {
    distortion?: number
    parallax?: number
    hover?: boolean
    transition?: 'fade' | 'slide' | 'morph'
  }
}