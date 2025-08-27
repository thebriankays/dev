declare module 'troika-three-text' {
  import { Mesh } from 'three'
  
  export class Text extends Mesh {
    text: string
    font: string
    fontSize: number
    anchorX: string | number
    anchorY: string | number
    color: number | string
    maxWidth: number
    lineHeight: number
    letterSpacing: number
    textAlign: string
    whiteSpace: string
    fillOpacity: number
    material: any
    sync(): void
  }
}