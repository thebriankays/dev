import React from 'react'
import { BlockWrapper } from '../_shared/BlockWrapper'
import { WebGLTextClient } from './WebGLText.client'
import type { WebGLTextBlockProps } from './types'

export const WebGLTextBlock: React.FC<WebGLTextBlockProps> = (props) => {
  const {
    text,
    fontSize = 'large',
    textAlign = 'center',
    effect = 'distortion',
    color,
    font,
    glassEffect,
    fluidOverlay,
    webglEffects,
    animationTrigger,
    secondaryText,
  } = props
  
  return (
    <BlockWrapper
      glassEffect={glassEffect}
      fluidOverlay={fluidOverlay}
      className="webgl-text-block"
      webglContent={
        <WebGLTextClient
          text={text}
          fontSize={fontSize}
          effect={effect}
          color={color}
          font={font}
          webglEffects={webglEffects}
          animationTrigger={animationTrigger}
          secondaryText={secondaryText}
        />
      }
    >
      <div 
        className={`webgl-text-content text-${fontSize} text-${textAlign}`}
        style={{ opacity: 0 }}
      >
        {text}
      </div>
    </BlockWrapper>
  )
}