'use client'

import React, { useRef, useEffect, useLayoutEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import r3f-globe to ensure it's loaded in the browser
const R3fGlobe = dynamic(() => import('r3f-globe'), {
  ssr: false,
})

// Wrapper component that completely disables HTML rendering in r3f-globe
// This prevents the "Div is not part of the THREE namespace" error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TravelDataGlobeWrapper = React.forwardRef<any, any>((props, ref) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internalRef = useRef<any>(null)
  
  // Use layout effect to patch before render
  useLayoutEffect(() => {
    if (internalRef.current) {
      const globe = internalRef.current
      
      // Aggressively disable all HTML-related features
      // Override the globe's scene to prevent HTML layer creation
      if (globe.scene) {
        const originalAdd = globe.scene.add
        globe.scene.add = function(...args: any[]) {
          // Filter out any HTML-related objects
          const filtered = args.filter((obj: any) => {
            if (!obj) return false
            const name = obj.name || ''
            const type = obj.type || ''
            // Skip any objects that might be HTML-related
            if (name.includes('html') || type.includes('html')) {
              return false
            }
            return true
          })
          return originalAdd.apply(this, filtered)
        }
      }
      
      // Disable HTML elements layer completely
      Object.defineProperty(globe, 'htmlElementsLayer', {
        get: () => null,
        set: () => {},
        configurable: false
      })
      
      // Override all HTML-related methods
      const htmlMethods = [
        '_buildHtmlElementsLayer',
        '_updateHtmlElements',
        'htmlElement',
        'htmlElementsData',
        'htmlTransitionDuration',
        'htmlAltitude',
        'htmlLat',
        'htmlLng',
        'htmlRadius',
        'htmlMargin',
        '_htmlElementsData',
        '_htmlElement'
      ]
      
      htmlMethods.forEach(method => {
        if (globe[method] !== undefined) {
          globe[method] = () => {}
        }
      })
      
      // Forward the patched ref
      if (ref) {
        if (typeof ref === 'function') {
          ref(internalRef.current)
        } else {
          ref.current = internalRef.current
        }
      }
    }
  })
  
  // Filter out ALL HTML and label-related props
  const {
    htmlElementsData: _htmlElementsData,
    htmlElement: _htmlElement,
    htmlTransitionDuration: _htmlTransitionDuration,
    htmlAltitude: _htmlAltitude,
    htmlLat: _htmlLat,
    htmlLng: _htmlLng,
    htmlRadius: _htmlRadius,
    htmlMargin: _htmlMargin,
    labelsData: _labelsData,
    labelLat: _labelLat,
    labelLng: _labelLng,
    labelText: _labelText,
    labelSize: _labelSize,
    labelDotRadius: _labelDotRadius,
    labelColor: _labelColor,
    labelResolution: _labelResolution,
    labelAltitude: _labelAltitude,
    labelIncludeDot: _labelIncludeDot,
    labelDotOrientation: _labelDotOrientation,
    labelLabel: _labelLabel,
    labelThreeObject: _labelThreeObject,
    customLayerData: _customLayerData,
    customThreeObject: _customThreeObject,
    customThreeObjectUpdate: _customThreeObjectUpdate,
    ...cleanProps
  } = props
  
  return (
    <R3fGlobe
      ref={internalRef}
      {...cleanProps}
      // Force disable all HTML and label features
      htmlElementsData={[]}
      labelsData={[]}
      customLayerData={[]}
    />
  )
})

TravelDataGlobeWrapper.displayName = 'TravelDataGlobeWrapper'