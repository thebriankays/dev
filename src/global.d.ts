interface Window {
  __r3f?: {
    invalidate: () => void
  }
}

// Shader file declarations
declare module '*.vert' {
  const content: string
  export default content
}

declare module '*.frag' {
  const content: string
  export default content
}

declare module '*.glsl' {
  const content: string
  export default content
}