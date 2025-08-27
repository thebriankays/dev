import React, { forwardRef } from 'react'
import * as THREE from 'three'

interface AtmosphereGlowProps {
  material: THREE.ShaderMaterial
  scale?: number
}

export const AtmosphereGlow = forwardRef<THREE.Mesh, AtmosphereGlowProps>(
  ({ material, scale = 1.15 }, ref) => {
    return (
      <mesh ref={ref} scale={scale} material={material}>
        <sphereGeometry args={[2, 64, 64]} />
      </mesh>
    )
  }
)

AtmosphereGlow.displayName = 'AtmosphereGlow'