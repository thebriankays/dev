import type { Object3DNode } from '@react-three/fiber'
import type { BentPlaneGeometry, MeshSineMaterial } from './util'

declare module '@react-three/fiber' {
  interface ThreeElements {
    bentPlaneGeometry: Object3DNode<BentPlaneGeometry, typeof BentPlaneGeometry>
    meshSineMaterial: Object3DNode<MeshSineMaterial, typeof MeshSineMaterial>
  }
}