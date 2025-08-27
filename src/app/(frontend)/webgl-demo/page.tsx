'use client'

import React from 'react'
import { ViewportRenderer } from '@/webgl/components/view'
import { WebGLImage } from '@/webgl/components/image'

export default function WebGLDemoPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto py-20">
        <h1 className="text-6xl font-bold text-white text-center mb-10">
          WebGL Shared Canvas Demo
        </h1>
        
        {/* Glass Effect Demo */}
        <section className="mb-20">
          <div className="glass-panel p-8 rounded-2xl max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Glass Morphism</h2>
            <p className="text-white/80">
              This panel demonstrates the global glass morphism design system.
              The effect is applied using CSS variables and can be customized.
            </p>
          </div>
        </section>
        
        {/* WebGL Image Demo */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-8">WebGL Image</h2>
          <div className="max-w-4xl mx-auto">
            <ViewportRenderer>
              <WebGLImage
                src="https://picsum.photos/800/600"
                distortion={0.2}
                parallax={0.1}
                hover={true}
                scale={2}
              />
            </ViewportRenderer>
          </div>
        </section>
        
        {/* Multiple Glass Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-xl font-bold text-white mb-2">Card 1</h3>
            <p className="text-white/70">Glass card with blur effect</p>
          </div>
          <div className="glass-frost p-6 rounded-xl">
            <h3 className="text-xl font-bold text-white mb-2">Card 2</h3>
            <p className="text-white/70">Frosted glass variant</p>
          </div>
          <div className="glass-liquid p-6 rounded-xl">
            <h3 className="text-xl font-bold text-white mb-2">Card 3</h3>
            <p className="text-white/70">Liquid glass effect</p>
          </div>
        </section>
      </div>
    </div>
  )
}