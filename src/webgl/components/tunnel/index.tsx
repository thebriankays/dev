'use client'

import React, { Fragment, useId } from 'react'
import { useContextBridge } from '@react-three/drei'
import { useCanvas } from '@/providers/Canvas'

export function WebGLTunnel({ children }: { children: React.ReactNode }) {
  const { WebGLTunnel } = useCanvas()
  const ContextBridge = useContextBridge()
  const uuid = useId()
  
  if (!WebGLTunnel) return null
  
  return (
    <WebGLTunnel.In>
      <ContextBridge key={uuid}>{children}</ContextBridge>
    </WebGLTunnel.In>
  )
}

export function DOMTunnel({ children }: { children: React.ReactNode }) {
  const { DOMTunnel } = useCanvas()
  const uuid = useId()
  
  if (!DOMTunnel) return null
  
  return (
    <DOMTunnel.In>
      <Fragment key={uuid}>{children}</Fragment>
    </DOMTunnel.In>
  )
}