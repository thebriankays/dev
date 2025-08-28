'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { SiteSettings } from '@/payload-types'

const SharedCanvas = dynamic(
  () => import('@/webgl/components/canvas/SharedCanvas').then(mod => mod.SharedCanvas),
  { ssr: false }
)

interface ClientLayoutProps {
  children: React.ReactNode
  siteSettings?: SiteSettings
}

export function ClientLayout({ children, siteSettings }: ClientLayoutProps) {
  const backgroundType = siteSettings?.background?.type || 'whatamesh'
  const whatameshSettings = siteSettings?.background?.whatamesh
  
  const backgroundProps = whatameshSettings ? {
    colors: whatameshSettings.colors?.map(c => c.color) || undefined,
    seed: whatameshSettings.seed,
    speed: whatameshSettings.speed,
    intensity: whatameshSettings.intensity,
    animate: whatameshSettings.animate,
  } : {}

  return (
    <>
      <SharedCanvas 
        render={true} 
        postprocessing={false}
        background={backgroundType as 'whatamesh' | 'none'}
        backgroundProps={backgroundProps}
      />
      {children}
    </>
  )
}