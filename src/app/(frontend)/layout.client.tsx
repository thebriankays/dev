'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { CanvasProvider } from '@/webgl/components/canvas'

const SharedCanvas = dynamic(
  () => import('@/webgl/components/canvas/SharedCanvas').then(mod => mod.SharedCanvas),
  { ssr: false }
)

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <CanvasProvider>
      <SharedCanvas render={true} postprocessing={false} />
      {children}
    </CanvasProvider>
  )
}