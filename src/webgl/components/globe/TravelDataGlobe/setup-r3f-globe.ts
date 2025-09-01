// This file must be imported before r3f-globe to extend THREE namespace
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

// Create a placeholder class for HTML elements that r3f-globe uses
class HtmlElementPlaceholder extends THREE.Group {
  constructor() {
    super()
    this.visible = false
  }
}

// Extend THREE namespace with HTML element placeholders
// This prevents "X is not part of the THREE namespace" errors from r3f-globe
extend({ 
  Div: HtmlElementPlaceholder,
  div: HtmlElementPlaceholder,
  Span: HtmlElementPlaceholder,
  span: HtmlElementPlaceholder,
  P: HtmlElementPlaceholder,
  p: HtmlElementPlaceholder,
  A: HtmlElementPlaceholder,
  a: HtmlElementPlaceholder,
  Button: HtmlElementPlaceholder,
  button: HtmlElementPlaceholder,
})

console.log('R3F Globe HTML elements extended to THREE namespace')