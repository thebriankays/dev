'use client'

import React, { useLayoutEffect } from 'react'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

// Create a placeholder class for HTML elements that r3f-globe might use
class HtmlPlaceholder extends THREE.Group {
  constructor() {
    super()
    this.visible = false
  }
}

// Extend THREE namespace with HTML element placeholders
// This prevents "X is not part of the THREE namespace" errors
extend({ 
  Div: HtmlPlaceholder,
  div: HtmlPlaceholder,
  Span: HtmlPlaceholder,
  span: HtmlPlaceholder,
  P: HtmlPlaceholder,
  p: HtmlPlaceholder,
})

// Component to patch r3f-globe's HTML rendering
export function R3fGlobePatch() {
  // Use layout effect to ensure extensions are registered before render
  useLayoutEffect(() => {
    // Re-extend in case r3f-globe overrides them
    extend({ 
      Div: HtmlPlaceholder,
      div: HtmlPlaceholder,
    })
  }, [])
  
  return null
}