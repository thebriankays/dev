'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useField, useFormFields, useForm } from '@payloadcms/ui'
import type { GroupFieldClientComponent } from 'payload'

const gradientPresets = [
  {
    name: 'Default',
    colors: ['#dca8d8', '#a3d3f9', '#fcd6d6', '#eae2ff'],
  },
  {
    name: 'Sunset',
    colors: ['#fc5c7d', '#6a82fb', '#fc5c7d', '#f7b733'],
  },
  {
    name: 'Tropical',
    colors: ['#98eabe', '#437add', '#bf45ee', '#f5f1e8'],
  },
  {
    name: 'Pastel',
    colors: ['#FFDDE1', '#EE9CA7', '#C9FFBF', '#FFAFBD'],
  },
  {
    name: 'Spring',
    colors: ['#FFD3B5', '#B3E0E3', '#D8A8E8', '#9DE0AD'],
  },
  {
    name: 'Tech',
    colors: ['#225ee1', '#28d7bf', '#ac53cf', '#e7a39c'],
  },
  {
    name: 'Candy',
    colors: ['#F098F3', '#fbe8d0', '#fcc3e6', '#72B8F9'],
  },
  {
    name: 'Vibrant',
    colors: ['#a960ee', '#ff333d', '#90e0ff', '#ffcb57'],
  },
  {
    name: 'Fusion',
    colors: ['#E1785D', '#A87CEF', '#5BC8E2', '#4447EC'],
  },
  {
    name: 'Modern',
    colors: ['#4a306d', '#fe5448', '#81d6e3', '#edcce4'],
  },
]

export const WhatameshPreview: GroupFieldClientComponent = ({ field }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { dispatchFields } = useForm()
  
  // Get the form values
  const formFields = useFormFields(([fields]) => {
    const backgroundType = fields['background.type']?.value
    const whatameshData = fields['background.whatamesh']?.value || {}
    
    return {
      type: backgroundType,
      seed: whatameshData.seed || 5,
      animate: whatameshData.animate !== false,
      colors: whatameshData.colors || [
        { color: '#ff0080' },
        { color: '#7928ca' },
        { color: '#0070f3' },
      ],
      speed: whatameshData.speed || 0.5,
      intensity: whatameshData.intensity || 0.5,
    }
  })
  
  useEffect(() => {
    if (!canvasRef.current || formFields.type !== 'whatamesh') return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    
    let time = 0
    
    const draw = () => {
      const { seed, animate, colors, speed, intensity } = formFields
      
      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height)
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height)
      
      // Simple animated gradient visualization
      colors.forEach((color, i) => {
        const position = i / (colors.length - 1)
        const offset = animate ? Math.sin(time * speed + i) * 0.1 * intensity : 0
        gradient.addColorStop(
          Math.max(0, Math.min(1, position + offset)),
          color.color
        )
      })
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, rect.width, rect.height)
      
      // Add some noise effect based on seed
      if (intensity > 0) {
        ctx.globalAlpha = intensity * 0.1
        for (let i = 0; i < 100; i++) {
          const x = (Math.sin(seed * i * 0.1) * 0.5 + 0.5) * rect.width
          const y = (Math.cos(seed * i * 0.15) * 0.5 + 0.5) * rect.height
          const radius = Math.sin(seed * i * 0.2) * 20 + 10
          
          const noiseGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
          noiseGradient.addColorStop(0, 'rgba(255,255,255,0.1)')
          noiseGradient.addColorStop(1, 'rgba(255,255,255,0)')
          
          ctx.fillStyle = noiseGradient
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
        }
        ctx.globalAlpha = 1
      }
      
      if (animate) {
        time += 0.01
        animationRef.current = requestAnimationFrame(draw)
      }
    }
    
    draw()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [formFields])
  
  if (formFields.type !== 'whatamesh') {
    return null
  }
  
  return (
    <div className="field-type group-field">
      <div className="group-field__header">
        <button
          type="button"
          className="group-field__toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <span className={`group-field__toggle-icon ${isCollapsed ? '' : 'open'}`}>
            ▶
          </span>
          {field.label || field.name}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="group-field__content">
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Preview
            </label>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '200px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#000',
              }}
            />
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
              Live preview of the Whatamesh background effect
            </p>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Gradient Presets
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              {gradientPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    // Update the colors field with the preset colors
                    const newColors = preset.colors.map(color => ({ color }))
                    dispatchFields({
                      type: 'UPDATE',
                      path: 'background.whatamesh.colors',
                      value: newColors,
                    })
                  }}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '0.5rem',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#007bff'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ddd'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{
                    height: '40px',
                    borderRadius: '2px',
                    background: `linear-gradient(135deg, ${preset.colors.join(', ')})`,
                    marginBottom: '0.25rem',
                  }} />
                  <div style={{ 
                    fontSize: '0.75rem', 
                    textAlign: 'center',
                    color: '#333'
                  }}>
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="group-field__fields">
            {field.fields?.map((subField) => {
              const FieldComponent = subField.admin?.components?.Field
              if (!FieldComponent || typeof FieldComponent !== 'function') {
                return null
              }
              return <FieldComponent key={subField.name} {...subField} />
            })}
          </div>
        </div>
      )}
    </div>
  )
}