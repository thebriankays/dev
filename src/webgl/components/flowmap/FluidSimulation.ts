import * as THREE from 'three'
import Program from '@/webgl/utils/program'

interface FluidConfig {
  simRes?: number
  dyeRes?: number
  densityDissipation?: number
  velocityDissipation?: number
  pressureDissipation?: number
  curlStrength?: number
  radius?: number
  iterations?: number
}

interface Pointer {
  x: number
  y: number
  dx: number
  dy: number
  moved: boolean
  isDown: boolean
}

class FrameBufferObject {
  texture: THREE.DataTexture
  fbo: THREE.WebGLRenderTarget
  width: number
  height: number
  
  constructor(
    renderer: THREE.WebGLRenderer,
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    type: number,
    minFilter: THREE.MinificationTextureFilter,
    magFilter: THREE.MagnificationTextureFilter
  ) {
    this.width = width
    this.height = height
    
    const data = new Float32Array(width * height * 4)
    this.texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType)
    this.texture.minFilter = minFilter
    this.texture.magFilter = magFilter
    this.texture.needsUpdate = true
    
    this.fbo = new THREE.WebGLRenderTarget(width, height, {
      minFilter,
      magFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
      stencilBuffer: false,
    })
  }
  
  get read() {
    return this.fbo
  }
  
  get write() {
    return this.fbo
  }
  
  swap() {
    // In Three.js we don't need to swap, just return the same target
    return this.fbo
  }
}

class DoubleFBO {
  read: FrameBufferObject
  write: FrameBufferObject
  
  constructor(
    renderer: THREE.WebGLRenderer,
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    type: number,
    minFilter: number,
    magFilter: number
  ) {
    this.read = new FrameBufferObject(renderer, width, height, internalFormat, format, type, minFilter, magFilter)
    this.write = new FrameBufferObject(renderer, width, height, internalFormat, format, type, minFilter, magFilter)
  }
  
  swap() {
    const temp = this.read
    this.read = this.write
    this.write = temp
  }
}

// Shader code
const baseVertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const clearShader = `
  uniform sampler2D uTexture;
  uniform float uDissipation;
  varying vec2 vUv;
  
  void main() {
    vec4 color = texture2D(uTexture, vUv);
    gl_FragColor = color * uDissipation;
  }
`

const splatShader = `
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  varying vec2 vUv;
  
  void main() {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`

const advectionShader = `
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;
  varying vec2 vUv;
  
  void main() {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    vec4 result = texture2D(uSource, coord);
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
  }
`

const divergenceShader = `
  uniform sampler2D uVelocity;
  uniform float halfrdx;
  uniform vec2 texelSize;
  varying vec2 vUv;
  
  void main() {
    vec2 fieldL = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).xy;
    vec2 fieldR = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).xy;
    vec2 fieldT = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).xy;
    vec2 fieldB = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).xy;
    
    float divergence = halfrdx * (fieldR.x - fieldL.x + fieldT.y - fieldB.y);
    gl_FragColor = vec4(divergence, 0.0, 0.0, 1.0);
  }
`

const curlShader = `
  uniform sampler2D uVelocity;
  uniform float halfrdx;
  uniform vec2 texelSize;
  varying vec2 vUv;
  
  void main() {
    vec2 fieldL = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).xy;
    vec2 fieldR = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).xy;
    vec2 fieldT = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).xy;
    vec2 fieldB = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).xy;
    
    float vorticity = halfrdx * (fieldR.y - fieldL.y - fieldT.x + fieldB.x);
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`

const vorticityShader = `
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  uniform vec2 texelSize;
  varying vec2 vUv;
  
  void main() {
    vec2 fieldL = texture2D(uCurl, vUv - vec2(texelSize.x, 0.0)).xy;
    vec2 fieldR = texture2D(uCurl, vUv + vec2(texelSize.x, 0.0)).xy;
    vec2 fieldT = texture2D(uCurl, vUv + vec2(0.0, texelSize.y)).xy;
    vec2 fieldB = texture2D(uCurl, vUv - vec2(0.0, texelSize.y)).xy;
    vec2 fieldC = texture2D(uCurl, vUv).xy;
    
    vec2 force = 0.5 * vec2(abs(fieldT.x) - abs(fieldB.x), abs(fieldR.x) - abs(fieldL.x));
    force /= length(force) + 0.00001;
    force *= curl * fieldC.x;
    force.y *= -1.0;
    
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    gl_FragColor = vec4(velocity + force * dt, 0.0, 1.0);
  }
`

const pressureShader = `
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 texelSize;
  varying vec2 vUv;
  
  void main() {
    float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`

const gradientSubtractShader = `
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 texelSize;
  uniform float halfrdx;
  varying vec2 vUv;
  
  void main() {
    float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= halfrdx * vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`

export class FluidSimulation {
  renderer: THREE.WebGLRenderer
  velocity: DoubleFBO
  density: DoubleFBO
  pressure: DoubleFBO
  divergence: FrameBufferObject
  curl: FrameBufferObject
  
  config: Required<FluidConfig>
  pointers: Pointer[]
  splatQueue: Array<{x: number, y: number, dx: number, dy: number}>
  
  uniform: { value: THREE.Texture | null }
  
  // Shader programs
  clearProgram: Program
  splatProgram: Program
  advectionProgram: Program
  divergenceProgram: Program
  curlProgram: Program
  vorticityProgram: Program
  pressureProgram: Program
  gradientSubtractProgram: Program
  
  constructor(renderer: THREE.WebGLRenderer, config: FluidConfig = {}) {
    this.renderer = renderer
    
    this.config = {
      simRes: config.simRes || 128,
      dyeRes: config.dyeRes || 256,
      densityDissipation: config.densityDissipation || 0.97,
      velocityDissipation: config.velocityDissipation || 0.98,
      pressureDissipation: config.pressureDissipation || 0.8,
      curlStrength: config.curlStrength || 20,
      radius: config.radius || 0.2,
      iterations: config.iterations || 3,
    }
    
    this.pointers = [{
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      moved: false,
      isDown: false,
    }]
    
    this.splatQueue = []
    
    const simRes = this.config.simRes
    const dyeRes = this.config.dyeRes
    const texType = THREE.FloatType
    const rgba = THREE.RGBAFormat
    const rg = THREE.RGFormat
    const r = THREE.RedFormat
    const filtering = THREE.LinearFilter
    
    // Create FBOs
    this.velocity = new DoubleFBO(renderer, simRes, simRes, rg, rg, texType, filtering, filtering)
    this.density = new DoubleFBO(renderer, dyeRes, dyeRes, rgba, rgba, texType, filtering, filtering)
    this.pressure = new DoubleFBO(renderer, simRes, simRes, r, r, texType, THREE.NearestFilter, THREE.NearestFilter)
    this.divergence = new FrameBufferObject(renderer, simRes, simRes, r, r, texType, THREE.NearestFilter, THREE.NearestFilter)
    this.curl = new FrameBufferObject(renderer, simRes, simRes, r, r, texType, THREE.NearestFilter, THREE.NearestFilter)
    
    this.uniform = { value: this.density.read.read.texture }
    
    // Create shader programs
    this.clearProgram = new Program(this.createMaterial(clearShader, {
      uTexture: { value: null },
      uDissipation: { value: 0 },
    }))
    
    this.splatProgram = new Program(this.createMaterial(splatShader, {
      uTarget: { value: null },
      aspectRatio: { value: 1 },
      color: { value: new THREE.Vector3() },
      point: { value: new THREE.Vector2() },
      radius: { value: 1 },
    }))
    
    this.advectionProgram = new Program(this.createMaterial(advectionShader, {
      uVelocity: { value: null },
      uSource: { value: null },
      texelSize: { value: new THREE.Vector2() },
      dt: { value: 0.016 },
      dissipation: { value: 0 },
    }))
    
    this.divergenceProgram = new Program(this.createMaterial(divergenceShader, {
      uVelocity: { value: null },
      halfrdx: { value: 0.5 },
      texelSize: { value: new THREE.Vector2() },
    }))
    
    this.curlProgram = new Program(this.createMaterial(curlShader, {
      uVelocity: { value: null },
      halfrdx: { value: 0.5 },
      texelSize: { value: new THREE.Vector2() },
    }))
    
    this.vorticityProgram = new Program(this.createMaterial(vorticityShader, {
      uVelocity: { value: null },
      uCurl: { value: null },
      curl: { value: this.config.curlStrength },
      dt: { value: 0.016 },
      texelSize: { value: new THREE.Vector2() },
    }))
    
    this.pressureProgram = new Program(this.createMaterial(pressureShader, {
      uPressure: { value: null },
      uDivergence: { value: null },
      texelSize: { value: new THREE.Vector2() },
    }))
    
    this.gradientSubtractProgram = new Program(this.createMaterial(gradientSubtractShader, {
      uPressure: { value: null },
      uVelocity: { value: null },
      texelSize: { value: new THREE.Vector2() },
      halfrdx: { value: 0.5 },
    }))
  }
  
  createMaterial(fragmentShader: string, uniforms: Record<string, THREE.IUniform>) {
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: baseVertexShader,
      fragmentShader,
      depthWrite: false,
      depthTest: false,
    })
  }
  
  updateMouse(e: MouseEvent | TouchEvent) {
    const pointer = this.pointers[0]
    const rect = this.renderer.domElement.getBoundingClientRect()
    
    let x, y
    if ('touches' in e && e.touches.length > 0) {
      x = e.touches[0].clientX
      y = e.touches[0].clientY
    } else if ('clientX' in e) {
      x = e.clientX
      y = e.clientY
    } else {
      return
    }
    
    const prevX = pointer.x
    const prevY = pointer.y
    
    pointer.x = (x - rect.left) / rect.width
    pointer.y = 1 - (y - rect.top) / rect.height
    pointer.dx = pointer.x - prevX
    pointer.dy = pointer.y - prevY
    pointer.moved = Math.abs(pointer.dx) > 0 || Math.abs(pointer.dy) > 0
    
    if (pointer.moved && pointer.isDown) {
      this.splatQueue.push({
        x: pointer.x,
        y: pointer.y,
        dx: pointer.dx * 10,
        dy: pointer.dy * 10,
      })
    }
  }
  
  splat(x: number, y: number, dx: number, dy: number) {
    this.splatQueue.push({ x, y, dx, dy })
  }
  
  update(deltaTime = 0.016) {
    const dt = Math.min(deltaTime, 0.033)
    const currentRenderTarget = this.renderer.getRenderTarget()
    
    // Process splats
    this.splatQueue.forEach(splat => {
      this.applyInput(this.velocity.read, splat)
      this.applyInput(this.density.read, { ...splat, dx: splat.dx * 3, dy: splat.dy * 3 })
    })
    this.splatQueue = []
    
    // Advection
    this.advect(this.velocity.read, this.velocity.read, this.velocity.write, this.config.velocityDissipation, dt)
    this.velocity.swap()
    
    this.advect(this.velocity.read, this.density.read, this.density.write, this.config.densityDissipation, dt)
    this.density.swap()
    
    // Vorticity confinement
    this.computeCurl()
    this.applyVorticity(dt)
    
    // Pressure
    this.computeDivergence()
    this.computePressure()
    this.subtractGradient()
    
    // Update output texture
    this.uniform.value = this.density.read.read.texture
    
    // Restore render target
    this.renderer.setRenderTarget(currentRenderTarget)
  }
  
  applyInput(target: FrameBufferObject, splat: {x: number, y: number, dx: number, dy: number}) {
    const material = this.splatProgram.material as THREE.ShaderMaterial
    material.uniforms.uTarget.value = target.read.texture
    material.uniforms.aspectRatio.value = this.renderer.domElement.width / this.renderer.domElement.height
    material.uniforms.color.value.set(splat.dx, splat.dy, 0)
    material.uniforms.point.value.set(splat.x, splat.y)
    material.uniforms.radius.value = this.config.radius / 100.0
    
    this.renderer.setRenderTarget(target.write)
    this.splatProgram.render(this.renderer)
    target.swap()
  }
  
  advect(velocityFBO: FrameBufferObject, sourceFBO: FrameBufferObject, targetFBO: FrameBufferObject, dissipation: number, dt: number) {
    const material = this.advectionProgram.material as THREE.ShaderMaterial
    material.uniforms.uVelocity.value = velocityFBO.read.texture
    material.uniforms.uSource.value = sourceFBO.read.texture
    material.uniforms.texelSize.value.set(1.0 / velocityFBO.width, 1.0 / velocityFBO.height)
    material.uniforms.dt.value = dt
    material.uniforms.dissipation.value = dissipation
    
    this.renderer.setRenderTarget(targetFBO.write)
    this.advectionProgram.render(this.renderer)
  }
  
  computeCurl() {
    const material = this.curlProgram.material as THREE.ShaderMaterial
    material.uniforms.uVelocity.value = this.velocity.read.read.texture
    material.uniforms.halfrdx.value = 0.5
    material.uniforms.texelSize.value.set(1.0 / this.velocity.read.width, 1.0 / this.velocity.read.height)
    
    this.renderer.setRenderTarget(this.curl.write)
    this.curlProgram.render(this.renderer)
  }
  
  applyVorticity(dt: number) {
    const material = this.vorticityProgram.material as THREE.ShaderMaterial
    material.uniforms.uVelocity.value = this.velocity.read.read.texture
    material.uniforms.uCurl.value = this.curl.read.texture
    material.uniforms.curl.value = this.config.curlStrength
    material.uniforms.dt.value = dt
    material.uniforms.texelSize.value.set(1.0 / this.velocity.read.width, 1.0 / this.velocity.read.height)
    
    this.renderer.setRenderTarget(this.velocity.write.write)
    this.vorticityProgram.render(this.renderer)
    this.velocity.swap()
  }
  
  computeDivergence() {
    const material = this.divergenceProgram.material as THREE.ShaderMaterial
    material.uniforms.uVelocity.value = this.velocity.read.read.texture
    material.uniforms.halfrdx.value = 0.5
    material.uniforms.texelSize.value.set(1.0 / this.velocity.read.width, 1.0 / this.velocity.read.height)
    
    this.renderer.setRenderTarget(this.divergence.write)
    this.divergenceProgram.render(this.renderer)
  }
  
  computePressure() {
    const material = this.pressureProgram.material as THREE.ShaderMaterial
    material.uniforms.uDivergence.value = this.divergence.read.texture
    material.uniforms.texelSize.value.set(1.0 / this.pressure.read.width, 1.0 / this.pressure.read.height)
    
    // Clear pressure
    const clearMaterial = this.clearProgram.material as THREE.ShaderMaterial
    clearMaterial.uniforms.uTexture.value = this.pressure.read.read.texture
    clearMaterial.uniforms.uDissipation.value = this.config.pressureDissipation
    this.renderer.setRenderTarget(this.pressure.write.write)
    this.clearProgram.render(this.renderer)
    this.pressure.swap()
    
    // Jacobi iterations
    for (let i = 0; i < this.config.iterations; i++) {
      material.uniforms.uPressure.value = this.pressure.read.read.texture
      this.renderer.setRenderTarget(this.pressure.write.write)
      this.pressureProgram.render(this.renderer)
      this.pressure.swap()
    }
  }
  
  subtractGradient() {
    const material = this.gradientSubtractProgram.material as THREE.ShaderMaterial
    material.uniforms.uPressure.value = this.pressure.read.read.texture
    material.uniforms.uVelocity.value = this.velocity.read.read.texture
    material.uniforms.texelSize.value.set(1.0 / this.velocity.read.width, 1.0 / this.velocity.read.height)
    material.uniforms.halfrdx.value = 0.5
    
    this.renderer.setRenderTarget(this.velocity.write.write)
    this.gradientSubtractProgram.render(this.renderer)
    this.velocity.swap()
  }
  
  dispose() {
    // Dispose all FBOs and programs
    this.velocity.read.fbo.dispose()
    this.velocity.write.fbo.dispose()
    this.density.read.fbo.dispose()
    this.density.write.fbo.dispose()
    this.pressure.read.fbo.dispose()
    this.pressure.write.fbo.dispose()
    this.divergence.fbo.dispose()
    this.curl.fbo.dispose()
    
    // Dispose programs
    this.clearProgram.dispose()
    this.splatProgram.dispose()
    this.advectionProgram.dispose()
    this.divergenceProgram.dispose()
    this.curlProgram.dispose()
    this.vorticityProgram.dispose()
    this.pressureProgram.dispose()
    this.gradientSubtractProgram.dispose()
  }
}