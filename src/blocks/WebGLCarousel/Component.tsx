import React from 'react'
import type { WebGLCarouselBlockType } from './types'
import { WebGLCarouselClient } from './Component.client'

export function WebGLCarouselBlock(props: WebGLCarouselBlockType) {
  return <WebGLCarouselClient {...props} />
}