import React from 'react'
import { BlockWrapper } from '../_shared/BlockWrapper'
import { DolphinBlockClient } from './DolphinBlock.client'
import type { DolphinBlockProps } from './types'
import { cn } from '@/utilities/ui'

export const DolphinBlock: React.FC<DolphinBlockProps> = (props) => {
  const {
    title,
    subtitle,
    sceneSettings,
    dolphins,
    interaction,
    height = 'full',
    glassEffect,
    fluidOverlay,
    webglEffects,
  } = props

  return (
    <BlockWrapper
      glassEffect={glassEffect}
      fluidOverlay={fluidOverlay}
      className="dolphin-block relative h-screen min-h-[600px] w-full"
      disableDefaultCamera={true}
      interactive={true}
      webglContent={
        <DolphinBlockClient
          sceneSettings={sceneSettings}
          dolphins={dolphins}
          interaction={interaction}
          webglEffects={webglEffects}
        />
      }
    >
      {(title || subtitle) && (
        <div className="absolute top-0 left-0 w-full p-8 z-10 pointer-events-none">
          <div className="container mx-auto">
            {title && (
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xl md:text-2xl text-white/80 drop-shadow-md">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
    </BlockWrapper>
  )
}