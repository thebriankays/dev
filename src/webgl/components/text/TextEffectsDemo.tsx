'use client'

import React, { useState } from 'react'
import { WebGLTextClient } from './WebGLTextClient'
import './WebGLText.scss'

type TextEffect = 'distortion' | 'glitch' | 'wave' | 'particles' | 'morph' | 'outline'

const effectPresets = {
  distortion: {
    effect: 'distortion' as TextEffect,
    webglEffects: { distortion: 0.5 },
  },
  glitch: {
    effect: 'glitch' as TextEffect,
    webglEffects: { glitchAmount: 0.5 },
  },
  wave: {
    effect: 'wave' as TextEffect,
    webglEffects: { waveFrequency: 5, waveAmplitude: 0.5 },
  },
  particles: {
    effect: 'particles' as TextEffect,
    webglEffects: { particleCount: 100 },
  },
  morph: {
    effect: 'morph' as TextEffect,
    webglEffects: { morphDuration: 2.0 },
  },
  outline: {
    effect: 'outline' as TextEffect,
    webglEffects: { outlineWidth: 0.1 },
  },
}

export function TextEffectsDemo() {
  const [selectedEffect, setSelectedEffect] = useState<TextEffect>('distortion')
  const [text, setText] = useState('Hello World')
  const [secondaryText, setSecondaryText] = useState('Goodbye World')
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('large')
  const [color, setColor] = useState('#ffffff')
  const [animationTrigger, setAnimationTrigger] = useState<'onLoad' | 'onHover' | 'onScroll' | 'continuous'>('onHover')

  const currentPreset = effectPresets[selectedEffect as keyof typeof effectPresets] || effectPresets.distortion

  return (
    <div className="text-effects-demo">
      <div className="controls-panel">
        <h2>WebGL Text Effects Demo</h2>
        
        <div className="control-group">
          <label>Text:</label>
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
        </div>

        {selectedEffect === 'morph' && (
          <div className="control-group">
            <label>Secondary Text:</label>
            <input type="text" value={secondaryText} onChange={(e) => setSecondaryText(e.target.value)} />
          </div>
        )}

        <div className="control-group">
          <label>Effect:</label>
          <select value={selectedEffect} onChange={(e) => setSelectedEffect(e.target.value as TextEffect)}>
            {Object.keys(effectPresets).map(effect => (
              <option key={effect} value={effect}>{effect.charAt(0).toUpperCase() + effect.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Font Size:</label>
          <select value={fontSize} onChange={(e) => setFontSize(e.target.value as 'small' | 'medium' | 'large' | 'xlarge')}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xlarge">Extra Large</option>
          </select>
        </div>

        <div className="control-group">
          <label>Color:</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>

        <div className="control-group">
          <label>Animation Trigger:</label>
          <select value={animationTrigger} onChange={(e) => setAnimationTrigger(e.target.value as any)}>
            <option value="onLoad">On Load</option>
            <option value="onHover">On Hover</option>
            <option value="onScroll">On Scroll</option>
            <option value="continuous">Continuous</option>
          </select>
        </div>
      </div>

      <div className="preview-area">
        <WebGLTextClient
          text={text}
          fontSize={fontSize}
          color={color}
          effect={currentPreset.effect}
          webglEffects={currentPreset.webglEffects}
          animationTrigger={animationTrigger}
          secondaryText={selectedEffect === 'morph' ? secondaryText : undefined}
        />
      </div>

      <style jsx>{`
        .text-effects-demo {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 2rem;
          padding: 2rem;
          min-height: 100vh;
          background: #000;
          color: #fff;
        }

        .controls-panel {
          background: rgba(255, 255, 255, 0.05);
          padding: 2rem;
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .controls-panel h2 {
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }

        .control-group {
          margin-bottom: 1rem;
        }

        .control-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .control-group input,
        .control-group select {
          width: 100%;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: #fff;
        }

        .control-group input[type="range"] {
          cursor: pointer;
        }

        .control-group span {
          margin-left: 0.5rem;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .preview-area {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default TextEffectsDemo