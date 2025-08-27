import React from 'react'
import { WebGLTextBlock } from '@/blocks/WebGLText/Component'
import { WebGLImage } from '@/webgl/components/image'
import { ViewportRenderer } from '@/webgl/components/view'

export default function WebGLTestPage() {
  return (
    <div className="container mx-auto py-20">
      <h1 className="text-4xl font-bold text-center mb-10">WebGL Test Page</h1>
      
      {/* Test WebGL Text Block */}
      <section className="mb-20">
        <WebGLTextBlock
          text="Welcome to WebGL"
          fontSize="xlarge"
          textAlign="center"
          effect="distortion"
          glassEffect={{ enabled: true, variant: 'frost' }}
          webglEffects={{ distortion: 0.5 }}
        />
      </section>
      
      {/* Test Glass Effect */}
      <section className="mb-20">
        <div className="glass-panel p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Glass Panel Test</h2>
          <p>This is a glass panel with the global glass effect applied.</p>
        </div>
      </section>
      
      {/* Test WebGL Image */}
      <section className="mb-20">
        <ViewportRenderer>
          <WebGLImage
            src="/placeholder.jpg"
            distortion={0.2}
            parallax={0.1}
            hover={true}
          />
        </ViewportRenderer>
      </section>
    </div>
  )
}