export interface WebGLTextBlockProps {
  text: string
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge'
  textAlign?: 'left' | 'center' | 'right'
  effect?: 'distortion' | 'wave' | 'particles'
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