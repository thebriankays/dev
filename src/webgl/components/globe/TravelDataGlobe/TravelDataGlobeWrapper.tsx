'use client'

// IMPORTANT: Import setup before r3f-globe to extend THREE namespace
import './setup-r3f-globe'

import React, { useRef, useEffect } from 'react'
import R3fGlobe from 'r3f-globe'

// Wrapper component that patches r3f-globe to disable HTML rendering
// This is a workaround for the "Div is not part of the THREE namespace" error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TravelDataGlobeWrapper = React.forwardRef<any, any>((props, ref) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internalRef = useRef<any>(null)
  
  useEffect(() => {
    if (internalRef.current) {
      // Override the internal globe object to disable HTML elements
      const globe = internalRef.current
      
      // Disable HTML elements layer if it exists
      if (globe.htmlElementsLayer) {
        globe.htmlElementsLayer = null
      }
      
      // Override methods that might create HTML elements
      if (globe._buildHtmlElementsLayer) {
        globe._buildHtmlElementsLayer = () => {}
      }
      
      if (globe._updateHtmlElements) {
        globe._updateHtmlElements = () => {}
      }
      
      // Forward the patched ref
      if (ref) {
        if (typeof ref === 'function') {
          ref(internalRef.current)
        } else {
          ref.current = internalRef.current
        }
      }
    }
  }, [ref])
  
  // Filter out HTML-related props
  const {
    htmlElementsData: _htmlElementsData,
    htmlElement: _htmlElement,
    htmlTransitionDuration: _htmlTransitionDuration,
    htmlAltitude: _htmlAltitude,
    htmlLat: _htmlLat,
    htmlLng: _htmlLng,
    ...cleanProps
  } = props
  
  return (
    <R3fGlobe
      ref={internalRef}
      {...cleanProps}
      // Force disable HTML features
      htmlElementsData={[]}
    />
  )
})

TravelDataGlobeWrapper.displayName = 'TravelDataGlobeWrapper'