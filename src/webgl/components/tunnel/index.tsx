'use client'

import React, { Fragment, useId, PropsWithChildren } from 'react'
import { useCanvas } from '@/providers/Canvas'

export function WebGLTunnel({ children }: PropsWithChildren) {
  const { WebGLTunnel } = useCanvas()
  const uuid = useId()
  
  if (!WebGLTunnel) return null
  
  return (
    <WebGLTunnel.In>
      <Fragment key={uuid}>{children}</Fragment>
    </WebGLTunnel.In>
  )
}

export function DOMTunnel({ children }: PropsWithChildren) {
  const { DOMTunnel } = useCanvas()
  const uuid = useId()
  
  if (!DOMTunnel) return null
  
  return (
    <DOMTunnel.In>
      <Fragment key={uuid}>{children}</Fragment>
    </DOMTunnel.In>
  )
}