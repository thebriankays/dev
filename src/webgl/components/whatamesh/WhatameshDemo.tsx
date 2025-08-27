'use client'

import React, { useState } from 'react'
import { WhatameshBackground, WhatameshUtils } from './index'

// Demo component showcasing different Whatamesh configurations
export function WhatameshDemo() {
  const [config, setConfig] = useState({
    colorStart: '#667eea',
    colorEnd: '#764ba2',
    colorAccent: '#f093fb',
    speed: 0.3,
    amplitude: 0.5,
    frequency: 1.5,
  })

  const presets = [
    {
      name: 'Sunset Dream',
      colorStart: '#ff6b6b',
      colorEnd: '#feca57',
      colorAccent: '#ff9ff3',
      speed: 0.2,
      amplitude: 0.6,
      frequency: 1.2,
    },
    {
      name: 'Ocean Depths',
      colorStart: '#0abde3',
      colorEnd: '#006ba6',
      colorAccent: '#48dbfb',
      speed: 0.4,
      amplitude: 0.8,
      frequency: 1.0,
    },
    {
      name: 'Aurora Borealis',
      colorStart: '#00d2d3',
      colorEnd: '#5f27cd',
      colorAccent: '#54a0ff',
      speed: 0.5,
      amplitude: 0.4,
      frequency: 2.0,
    },
    {
      name: 'Volcanic Fire',
      colorStart: '#eb2f06',
      colorEnd: '#f39c12',
      colorAccent: '#e74c3c',
      speed: 0.6,
      amplitude: 0.7,
      frequency: 1.5,
    },
  ]

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Whatamesh Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <WhatameshBackground
          {...config}
          interactive={true}
          mouseInfluence={true}
          opacity={0.9}
          gradientSpeed={0.2}
        />
      </div>

      {/* Controls Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '20px',
        color: 'white',
        fontFamily: 'sans-serif',
        maxWidth: '400px',
      }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Whatamesh Controls</h3>
        
        {/* Preset Buttons */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Presets:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setConfig(preset)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Color Controls */}
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              Start Color:
            </label>
            <input
              type="color"
              value={config.colorStart}
              onChange={(e) => setConfig({ ...config, colorStart: e.target.value })}
              style={{ width: '100%', height: '32px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              End Color:
            </label>
            <input
              type="color"
              value={config.colorEnd}
              onChange={(e) => setConfig({ ...config, colorEnd: e.target.value })}
              style={{ width: '100%', height: '32px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              Accent Color:
            </label>
            <input
              type="color"
              value={config.colorAccent}
              onChange={(e) => setConfig({ ...config, colorAccent: e.target.value })}
              style={{ width: '100%', height: '32px' }}
            />
          </div>

          {/* Animation Controls */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              Speed: {config.speed.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={config.speed}
              onChange={(e) => setConfig({ ...config, speed: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              Amplitude: {config.amplitude.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={config.amplitude}
              onChange={(e) => setConfig({ ...config, amplitude: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              Frequency: {config.frequency.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={config.frequency}
              onChange={(e) => setConfig({ ...config, frequency: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Title Overlay */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: 'white',
        zIndex: 5,
      }}>
        <h1 style={{
          fontSize: 'clamp(3rem, 8vw, 8rem)',
          margin: 0,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          textShadow: '0 0 40px rgba(0,0,0,0.3)',
          mixBlendMode: 'overlay',
        }}>
          WHATAMESH
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.5rem)',
          margin: '1rem 0 0',
          opacity: 0.8,
          textShadow: '0 0 20px rgba(0,0,0,0.5)',
        }}>
          Animated WebGL Background Component
        </p>
      </div>
    </div>
  )
}

export default WhatameshDemo