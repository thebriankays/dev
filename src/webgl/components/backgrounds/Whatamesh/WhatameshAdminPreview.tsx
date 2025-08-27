'use client'

import React, { useEffect, useState } from 'react'
import type { Field } from 'payload'

/**
 * Payload Admin Preview Component for Whatamesh Background
 * 
 * This component allows admins to preview the Whatamesh gradient
 * directly in the Payload admin panel with live color updates.
 */
export const WhatameshPreview: React.FC<{ 
  field?: Field
  colors?: {
    color1?: string
    color2?: string
    color3?: string
    color4?: string
  }
}> = ({ colors }) => {
  const [presetIndex, setPresetIndex] = useState(0)
  
  // Gradient presets for preview
  const presets = [
    {
      name: 'Default',
      colors: ['#667eea', '#764ba2', '#f093fb', '#feca57']
    },
    {
      name: 'Ocean',
      colors: ['#0abde3', '#00a8cc', '#48dbfb', '#006ba6']
    },
    {
      name: 'Sunset',
      colors: ['#ff6b6b', '#ff8787', '#feca57', '#ff9ff3']
    },
    {
      name: 'Aurora',
      colors: ['#00d2d3', '#01a3a4', '#54a0ff', '#5f27cd']
    }
  ]
  
  // Use provided colors or current preset
  const currentColors = colors ? [
    colors.color1 || presets[presetIndex].colors[0],
    colors.color2 || presets[presetIndex].colors[1],
    colors.color3 || presets[presetIndex].colors[2],
    colors.color4 || presets[presetIndex].colors[3],
  ] : presets[presetIndex].colors
  
  return (
    <div style={{
      background: '#f3f4f6',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '20px'
    }}>
      <h4 style={{ 
        margin: '0 0 12px 0',
        fontSize: '14px',
        fontWeight: 600,
        color: '#374151'
      }}>
        Whatamesh Background Preview
      </h4>
      
      {/* Gradient Preview */}
      <div style={{
        height: '120px',
        background: `linear-gradient(90deg, ${currentColors.join(', ')})`,
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '12px'
      }}>
        {/* Animated overlay to simulate movement */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)
          `,
          animation: 'pulse 4s ease-in-out infinite'
        }} />
        
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.05); }
          }
        `}</style>
      </div>
      
      {/* Preset Selector */}
      {!colors && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            display: 'block',
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '6px'
          }}>
            Select Preset:
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {presets.map((preset, index) => (
              <button
                key={preset.name}
                onClick={() => setPresetIndex(index)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  border: '1px solid',
                  borderColor: presetIndex === index ? '#667eea' : '#d1d5db',
                  background: presetIndex === index ? '#667eea' : 'white',
                  color: presetIndex === index ? 'white' : '#374151',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Color Display */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px'
      }}>
        {currentColors.map((color, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              width: '100%',
              height: '32px',
              background: color,
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
              marginBottom: '4px'
            }} />
            <span style={{
              fontSize: '11px',
              color: '#6b7280',
              fontFamily: 'monospace'
            }}>
              {color}
            </span>
          </div>
        ))}
      </div>
      
      {/* Info Text */}
      <p style={{
        fontSize: '11px',
        color: '#9ca3af',
        margin: '12px 0 0 0',
        lineHeight: 1.4
      }}>
        This gradient will animate with noise-based vertex deformation creating an organic, 
        flowing effect. The actual animation runs in WebGL for optimal performance.
      </p>
    </div>
  )
}

/**
 * Payload Field Configuration
 * 
 * Use this field in your Payload collections/globals to add 
 * Whatamesh gradient configuration with live preview
 */
export const whatameshField: Field = {
  name: 'whatamesh',
  type: 'group',
  label: 'Background Gradient',
  admin: {
    components: {
      Field: WhatameshPreview as any
    }
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Enable Whatamesh Background',
      defaultValue: true,
    },
    {
      name: 'preset',
      type: 'select',
      label: 'Color Preset',
      defaultValue: 'default',
      options: [
        { label: 'Default (Purple)', value: 'default' },
        { label: 'Ocean', value: 'ocean' },
        { label: 'Sunset', value: 'sunset' },
        { label: 'Aurora', value: 'aurora' },
        { label: 'Custom', value: 'custom' },
      ]
    },
    {
      name: 'customColors',
      type: 'group',
      label: 'Custom Colors',
      admin: {
        condition: (data, siblingData) => siblingData?.preset === 'custom'
      },
      fields: [
        {
          name: 'color1',
          type: 'text',
          label: 'Color 1',
          defaultValue: '#667eea',
          admin: {
            description: 'First gradient color (hex format)'
          }
        },
        {
          name: 'color2',
          type: 'text',
          label: 'Color 2',
          defaultValue: '#764ba2',
          admin: {
            description: 'Second gradient color (hex format)'
          }
        },
        {
          name: 'color3',
          type: 'text',
          label: 'Color 3',
          defaultValue: '#f093fb',
          admin: {
            description: 'Third gradient color (hex format)'
          }
        },
        {
          name: 'color4',
          type: 'text',
          label: 'Color 4',
          defaultValue: '#feca57',
          admin: {
            description: 'Fourth gradient color (hex format)'
          }
        },
      ]
    },
    {
      name: 'animation',
      type: 'group',
      label: 'Animation Settings',
      fields: [
        {
          name: 'speed',
          type: 'number',
          label: 'Animation Speed',
          defaultValue: 1,
          min: 0.1,
          max: 3,
          admin: {
            description: 'Speed multiplier for the animation (1 = normal)'
          }
        },
        {
          name: 'amplitude',
          type: 'number',
          label: 'Wave Amplitude',
          defaultValue: 320,
          min: 100,
          max: 500,
          admin: {
            description: 'Intensity of the wave effect'
          }
        },
        {
          name: 'darkenTop',
          type: 'checkbox',
          label: 'Darken Top Edge',
          defaultValue: false,
          admin: {
            description: 'Apply a darkening effect to the top edge'
          }
        }
      ]
    }
  ]
}

export default WhatameshPreview