'use client'

import React, { useRef, useEffect } from 'react'
import { useFormFields, useForm } from '@payloadcms/ui'
import type { GroupFieldClientComponent } from 'payload'
import { View } from '@react-three/drei'
import { Whatamesh } from '@/webgl/components/backgrounds/Whatamesh'
import GradientPresetSelector from '../GradientPresetSelector/GradientPresetSelector'

// Helper to generate random pastel colors
const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360)
  const saturation = 60 + Math.floor(Math.random() * 20) // 60-80%
  const lightness = 70 + Math.floor(Math.random() * 15) // 70-85%
  
  // Convert HSL to hex
  const h = hue / 360
  const s = saturation / 100
  const l = lightness / 100
  
  const hslToRgb = (h: number, s: number, l: number) => {
    let r, g, b
    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }
  
  return hslToRgb(h, s, l)
}

export const WhatameshAdminPreview: GroupFieldClientComponent = ({ field, path }) => {
  const viewRef = useRef<HTMLDivElement>(null)
  const { dispatchFields } = useForm()
  
  // Read the current whatamesh settings from the form
  const formFields = useFormFields(([fields]) => {
    const bgType = fields['background.type']?.value
    const whatameshData = fields['background.whatamesh']?.value as any || {}
    const colors = whatameshData.colors || [
      { color: '#dca8d8' },
      { color: '#a3d3f9' },
      { color: '#fcd6d6' },
      { color: '#eae2ff' },
    ]
    
    return {
      bgType,
      colors: colors.map((c: any) => c.color || '#000000') as string[],
      animate: whatameshData.animate !== false,
      speed: whatameshData.speed || 0.5,
      intensity: whatameshData.intensity || 0.5,
      seed: whatameshData.seed || 5,
    }
  })
  
  // Don't render if background type is not whatamesh
  if (formFields.bgType !== 'whatamesh') {
    return null
  }
  
  // Set CSS variables on document.documentElement so Whatamesh can read them
  useEffect(() => {
    const root = document.documentElement
    
    // Store original values to restore later
    const originalColors: string[] = []
    for (let i = 1; i <= 4; i++) {
      const varName = `--gradient-color-${i}`
      originalColors.push(getComputedStyle(root).getPropertyValue(varName))
    }
    
    // Set the new colors
    formFields.colors.forEach((color, i) => {
      root.style.setProperty(`--gradient-color-${i + 1}`, color)
    })
    
    // Cleanup: restore original colors when component unmounts
    return () => {
      originalColors.forEach((color, i) => {
        if (color) {
          root.style.setProperty(`--gradient-color-${i + 1}`, color)
        }
      })
    }
  }, [formFields.colors])
  
  const updateColor = (index: number, color: string) => {
    const newColors = formFields.colors.map((c: string, i: number) => ({ 
      color: i === index ? color : c 
    }))
    
    dispatchFields({
      type: 'UPDATE',
      path: 'background.whatamesh.colors',
      value: newColors,
    })
  }
  
  const handleRandomize = () => {
    const newColors = Array(4).fill(null).map(() => ({ 
      color: getRandomColor() 
    }))
    
    dispatchFields({
      type: 'UPDATE',
      path: 'background.whatamesh.colors',
      value: newColors,
    })
  }
  
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
      }}>
        <h4 style={{
          margin: '0 0 12px 0',
          fontSize: '14px',
          fontWeight: 600,
          color: '#374151',
        }}>
          Whatamesh Live Preview
        </h4>
        
        {/* Mini canvas preview using View - renders the actual Whatamesh component */}
        <div 
          ref={viewRef}
          style={{
            position: 'relative',
            width: '100%',
            height: '200px',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '16px',
            border: '1px solid #e5e7eb',
            background: '#000',
          }}
        >
          <View track={viewRef as React.RefObject<HTMLElement>}>
            <Whatamesh 
              amplitude={320 * formFields.intensity}
              speed={formFields.speed}
              seed={formFields.seed}
              darkenTop={false}
              shadowPower={5}
            />
          </View>
        </div>
        
        {/* Color Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '16px',
        }}>
          {formFields.colors.map((color: string, index: number) => (
            <div key={index} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}>
              <input
                type="color"
                value={color}
                onChange={(e) => updateColor(index, e.target.value)}
                style={{
                  width: '48px',
                  height: '48px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              />
              <span style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#6b7280',
              }}>
                {color.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
        
        {/* Randomize Button */}
        <button
          type="button"
          onClick={handleRandomize}
          style={{
            width: '100%',
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            background: 'white',
            color: '#374151',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '16px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white'
          }}
        >
          Randomize Colors
        </button>
        
        {/* Preset Selector */}
        <GradientPresetSelector path="background.whatamesh" />
      </div>
    </div>
  )
}

export default WhatameshAdminPreview
