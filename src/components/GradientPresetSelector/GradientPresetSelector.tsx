'use client'

import React, { useState, useEffect } from 'react'
import { useField } from '@payloadcms/ui'

// Define all gradient presets
const presets = [
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

interface GradientPresetSelectorProps {
  path: string // e.g., 'background.whatamesh'
}

const GradientPresetSelector: React.FC<GradientPresetSelectorProps> = ({ path }) => {
  const [activePreset, setActivePreset] = useState<number | null>(null)
  
  // Get the colors array field
  const colorsField = useField<Array<{ color: string }>>({ path: `${path}.colors` })
  
  // Check if current colors match any preset
  useEffect(() => {
    const currentColors = (colorsField.value || []).map(c => c.color?.toLowerCase() || '')
    
    if (currentColors.length === 4) {
      const matchingPresetIndex = presets.findIndex(preset =>
        preset.colors.every((color, index) => 
          color.toLowerCase() === currentColors[index]
        )
      )
      setActivePreset(matchingPresetIndex !== -1 ? matchingPresetIndex : null)
    }
  }, [colorsField.value])
  
  const applyPreset = (preset: typeof presets[0], index: number) => {
    // Update the colors array field with the preset colors
    const newColors = preset.colors.map(color => ({ color }))
    colorsField.setValue(newColors)
    setActivePreset(index)
  }
  
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: 600,
        color: '#374151',
        marginBottom: '8px',
      }}>
        Color Presets
      </label>
      
      {activePreset !== null && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#f0f9ff',
          color: '#0369a1',
          borderRadius: '4px',
          fontSize: '12px',
          marginBottom: '12px',
        }}>
          Current: {presets[activePreset].name}
        </div>
      )}
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '8px',
      }}>
        {presets.map((preset, index) => (
          <div
            key={index}
            role="button"
            tabIndex={0}
            onClick={() => applyPreset(preset, index)}
            onKeyDown={(e) => e.key === 'Enter' && applyPreset(preset, index)}
            style={{
              background: `linear-gradient(45deg, ${preset.colors.join(', ')})`,
              height: '60px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '8px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: activePreset === index
                ? '0 0 0 2px #3b82f6, 0 4px 8px rgba(0,0,0,0.15)'
                : '0 2px 4px rgba(0,0,0,0.1)',
              transform: activePreset === index ? 'scale(1.02)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (activePreset !== index) {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
              }
            }}
            onMouseLeave={(e) => {
              if (activePreset !== index) {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
              }
            }}
          >
            <span style={{
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
            }}>
              {preset.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GradientPresetSelector
