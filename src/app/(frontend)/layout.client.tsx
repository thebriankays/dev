'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()
  
  // Always render SharedCanvas but conditionally set background
  const shouldRenderCanvas = !pathname.startsWith('/explore') && !pathname.startsWith('/itinerary')
  const isLoginPage = pathname === '/login'
  
  // Use no background on login page to let AlienIntegrations take over
  const backgroundType = isLoginPage ? 'none' : (siteSettings?.background?.type || 'whatamesh')
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
      {shouldRenderCanvas && (
        <SharedCanvas 
          render={true} 
          postprocessing={false}
          interactive={true}
          background={backgroundType as 'whatamesh' | 'none'}
          backgroundProps={backgroundProps}
        />
      )}
      {children}
    </>
  )
}