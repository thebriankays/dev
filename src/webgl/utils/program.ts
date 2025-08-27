import {
  Material,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from 'three'

// Shared geometry for all Program instances
const geometry = new PlaneGeometry(1, 1)

// Shared camera for full-screen rendering
const camera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.0001, 1000)
camera.position.set(0, 0, 1)
camera.lookAt(0, 0, 0)

/**
 * Program class for simplified shader rendering
 * Used for full-screen shader passes in effects like fluid simulation and flowmaps
 */
export default class Program extends Scene {
  material: Material
  mesh: Mesh
  scene: Scene

  constructor(material: Material) {
    super()
    this.material = material
    this.mesh = new Mesh(geometry, this.material)
    
    this.scene = new Scene()
    this.scene.add(this.mesh)
  }

  /**
   * Get the material/program
   * @deprecated Use .material directly
   */
  get program() {
    return this.material
  }

  /**
   * Set uniforms on the material
   */
  setUniform(name: string, value: any) {
    const material = this.material as any
    if ('uniforms' in material && material.uniforms) {
      if (material.uniforms[name]) {
        material.uniforms[name].value = value
      }
    }
  }

  /**
   * Get uniform value from the material
   */
  getUniform(name: string) {
    const material = this.material as any
    if ('uniforms' in material && material.uniforms) {
      return material.uniforms[name]?.value
    }
    return undefined
  }

  /**
   * Render the program to the current render target
   */
  render(renderer: WebGLRenderer) {
    renderer.render(this.scene, camera)
  }

  /**
   * Dispose of the program resources
   */
  dispose() {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}