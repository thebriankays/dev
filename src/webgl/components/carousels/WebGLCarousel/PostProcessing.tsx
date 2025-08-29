import { forwardRef, useImperativeHandle, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import { Color } from 'three'

interface PostProcessingRef {
  thickness: number
}

const PostProcessing = forwardRef<PostProcessingRef>((_, ref) => {
  const { viewport } = useThree()
  const materialRef = useRef<any>(null)

  useImperativeHandle(ref, () => ({
    set thickness(value: number) {
      if (materialRef.current) {
        materialRef.current.thickness = value
      }
    },
    get thickness() {
      return materialRef.current?.thickness || 0
    }
  }))

  // For production, we'll disable leva controls and use fixed values
  const active = true
  const ior = 0.9

  return active ? (
    <mesh position={[0, 0, 1]}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <MeshTransmissionMaterial
        ref={materialRef}
        background={new Color('white')}
        transmission={0.7}
        roughness={0}
        thickness={0}
        chromaticAberration={0.06}
        anisotropy={0}
        ior={ior}
      />
    </mesh>
  ) : null
})

PostProcessing.displayName = 'PostProcessing'

export default PostProcessing