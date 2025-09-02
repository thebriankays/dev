import React, { forwardRef } from 'react'
import * as THREE from 'three'

interface CloudsProps {
  radius: number
  cloudsMap?: THREE.Texture
  opacity?: number
}

export const Clouds = forwardRef<THREE.Mesh, CloudsProps>(({
  radius,
  cloudsMap,
  opacity = 0.4
}, ref) => {
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[radius * 1.01, 64, 64]} />
      <meshPhongMaterial
        map={cloudsMap}
        transparent={true}
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  )
})

Clouds.displayName = 'Clouds'
