'use client'

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { AlienScene } from '@/webgl/components/alien/AlienScene'
import './before-login.scss'

const BeforeLogin: React.FC = () => {
  return (
    <div className="before-login">
      {/* Back text layer - behind 3D model */}
      <div className="alien-text-back">
        ALIEN<br />INTEGRATIONS
      </div>
      
      {/* 3D model with standalone canvas */}
      <div 
        className="alien-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          background: 'transparent',
          pointerEvents: 'none'
        }}
      >
        <Canvas
          camera={{
            position: [0, 0, 10],
            fov: 45,
          }}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
          }}
        >
          <Suspense fallback={null}>
            <AlienScene />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Front text layer - above 3D model */}
      <div className="alien-text-front">
        ALIEN<br />INTEGRATIONS
      </div>
    </div>
  )
}

export default BeforeLogin
