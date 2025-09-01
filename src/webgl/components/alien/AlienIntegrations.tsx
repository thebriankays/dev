'use client'

import React from 'react'
import { ViewportRenderer } from '../view'
import { AlienScene } from './AlienScene'
import './alien.scss'

interface AlienIntegrationsProps {
  showText?: boolean
  className?: string
}

export function AlienIntegrations({ showText = true, className = '' }: AlienIntegrationsProps) {
  return (
    <div className={`alien-integrations ${className}`}>
      {/* WebGL content using shared canvas */}
      <div className="alien-integrations__canvas">
        <ViewportRenderer interactive={true}>
          <AlienScene />
        </ViewportRenderer>
      </div>

      {showText && (
        <>
          {/* Text layers for cutout effect */}
          {/* Back layer - solid white text behind model */}
          <div className="alien-integrations__text-back">
            ALIEN<br />INTEGRATIONS
          </div>
          
          {/* Front layer - stroke text above model */}
          <div className="alien-integrations__text-front">
            ALIEN<br />INTEGRATIONS
          </div>
        </>
      )}
    </div>
  )
}