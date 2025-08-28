'use client'

import React from 'react'
import { DolphinScene } from '@/webgl/components/dolphin/DolphinScene'
import type { DolphinBlockProps } from './types'

export const DolphinBlockClient: React.FC<
  Pick<DolphinBlockProps, 'sceneSettings' | 'dolphins' | 'interaction' | 'webglEffects'>
> = ({ sceneSettings, dolphins, interaction, webglEffects }) => {
  return (
    <DolphinScene
      sceneSettings={sceneSettings}
      dolphins={dolphins}
      interaction={interaction}
      webglEffects={webglEffects}
    />
  )
}