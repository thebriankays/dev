import * as THREE from 'three'

// Import shaders as strings
const flowmapVertex = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const flowmapFragment = `
uniform float uTime;
uniform vec2 uPointer;
uniform vec2 uVelocity;
uniform sampler2D uPrevious;
uniform float uAspect;
uniform float uFalloff;
uniform float uAlpha;
uniform float uDissipation;

varying vec2 vUv;

float distanceToSegment(vec2 a, vec2 b, vec2 p) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 aspectUv = vUv;
  aspectUv.x *= uAspect;
  
  vec2 pointerAspect = uPointer;
  pointerAspect.x *= uAspect;
  
  vec2 prevPointerAspect = uPointer - uVelocity * 0.1;
  prevPointerAspect.x *= uAspect;
  
  // Calculate distance to pointer trail
  float distance = distanceToSegment(prevPointerAspect, pointerAspect, aspectUv);
  
  // Create falloff
  float influence = smoothstep(uFalloff, 0.0, distance);
  influence *= uAlpha;
  
  // Sample previous frame
  vec4 previous = texture2D(uPrevious, vUv);
  
  // Apply dissipation
  previous.rgb *= uDissipation;
  
  // Add new influence
  vec3 color = vec3(influence);
  color = mix(previous.rgb, color, influence);
  
  // Add velocity information to RG channels
  color.rg += uVelocity * influence * 0.1;
  
  gl_FragColor = vec4(color, 1.0);
}
`

export class FlowmapPass {
  private renderer: THREE.WebGLRenderer
  private width: number
  private height: number
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private geometry: THREE.PlaneGeometry
  private material: THREE.ShaderMaterial
  private mesh: THREE.Mesh
  private renderTargets: THREE.WebGLRenderTarget[]
  private currentIndex: number = 0
  
  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.renderer = renderer
    this.width = width
    this.height = height
    
    // Create scene and camera
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    
    // Create geometry
    this.geometry = new THREE.PlaneGeometry(2, 2)
    
    // Create material
    this.material = new THREE.ShaderMaterial({
      vertexShader: flowmapVertex,
      fragmentShader: flowmapFragment,
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2() },
        uVelocity: { value: new THREE.Vector2() },
        uPrevious: { value: null },
        uAspect: { value: width / height },
        uFalloff: { value: 0.5 },
        uAlpha: { value: 1.0 },
        uDissipation: { value: 0.98 },
      },
    })
    
    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
    
    // Create render targets for ping-pong
    this.renderTargets = [
      new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        depthBuffer: false,
      }),
      new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        depthBuffer: false,
      }),
    ]
  }
  
  update(delta: number, pointer: THREE.Vector2) {
    const previousIndex = this.currentIndex
    this.currentIndex = (this.currentIndex + 1) % 2
    
    // Update uniforms
    this.material.uniforms.uTime.value += delta
    this.material.uniforms.uPointer.value.copy(pointer)
    this.material.uniforms.uPrevious.value = this.renderTargets[previousIndex].texture
    
    // Render to current target
    const currentRenderTarget = this.renderTargets[this.currentIndex]
    this.renderer.setRenderTarget(currentRenderTarget)
    this.renderer.render(this.scene, this.camera)
    this.renderer.setRenderTarget(null)
  }
  
  getTexture(): THREE.Texture {
    return this.renderTargets[this.currentIndex].texture
  }
  
  resize(width: number, height: number) {
    this.width = width
    this.height = height
    this.material.uniforms.uAspect.value = width / height
    
    this.renderTargets.forEach(target => {
      target.setSize(width, height)
    })
  }
  
  dispose() {
    this.geometry.dispose()
    this.material.dispose()
    this.renderTargets.forEach(target => target.dispose())
  }
}