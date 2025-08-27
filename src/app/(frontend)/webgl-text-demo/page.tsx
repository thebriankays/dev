import React from 'react'
import { Metadata } from 'next'
import { SharedCanvas } from '@/webgl/components/canvas/SharedCanvas'
import { TextEffectsDemo } from '@/webgl/components/text'

export const metadata: Metadata = {
  title: 'WebGL Text Effects Demo',
  description: 'Showcase of Codrops-style text effects using Troika-three-text',
}

export default function WebGLTextDemoPage() {
  return (
    <main className="min-h-screen bg-black">
      <SharedCanvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <TextEffectsDemo />
      </SharedCanvas>
      
      <div className="fixed top-4 left-4 text-white z-10">
        <h1 className="text-2xl font-bold mb-2">WebGL Text Effects Demo</h1>
        <p className="text-sm opacity-70">
          Use the controls panel to explore different text effects
        </p>
      </div>
    </main>
  )
}