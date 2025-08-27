export interface WebGLTextBlockProps {
  text: string
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge'
  textAlign?: 'left' | 'center' | 'right'
  effect?: 'distortion' | 'glitch' | 'wave' | 'particles' | 'morph' | 'outline' | 'none'
  color?: string
  font?: string
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
    glitchAmount?: number
    waveFrequency?: number
    waveAmplitude?: number
    particleCount?: number
    morphDuration?: number
    outlineWidth?: number
    parallax?: number
    hover?: boolean
    transition?: 'fade' | 'slide' | 'morph'
  }
  animationTrigger?: 'onLoad' | 'onHover' | 'onScroll' | 'continuous'
  secondaryText?: string
}