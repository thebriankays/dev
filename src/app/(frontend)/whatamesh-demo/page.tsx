import React from 'react'

// Simple demo page showing the Whatamesh background
export default function WhatameshDemoPage() {
  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Background is rendered by SharedCanvas in layout */}
      <div style={{
        textAlign: 'center',
        color: 'white',
        zIndex: 10,
        padding: '2rem'
      }}>
        <h1 style={{
          fontSize: 'clamp(3rem, 8vw, 6rem)',
          margin: 0,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          textShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          WHATAMESH
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.5rem)',
          margin: '1rem 0 0',
          opacity: 0.9,
          textShadow: '0 1px 10px rgba(0,0,0,0.3)',
        }}>
          4-Color WebGL Gradient Background
        </p>
        <p style={{
          fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
          margin: '0.5rem 0 0',
          opacity: 0.7,
          textShadow: '0 1px 10px rgba(0,0,0,0.3)',
        }}>
          Colors from CSS Variables • GPU Accelerated • Noise-Based Animation
        </p>
      </div>
    </div>
  )
}