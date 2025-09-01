import * as THREE from 'three'

// Create the black matcap texture exactly like the original
export function createBlackMatcap() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  const unit = (val: number) => val * canvas.height * 0.01

  ctx.fillStyle = '#222222'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.lineCap = 'round'
  ctx.strokeStyle = '#ddd'
  ctx.filter = `blur(${unit(0.5)}px)`

  const rows = 8
  const cols = 4
  const colFactor = 0.75
  const colAngle = Math.PI / cols
  const colAngleHalf = colAngle * 0.5

  for (let row = 0; row < rows; row++) {
    ctx.lineWidth = unit(10 - row) * 0.25
    const r = 47 - row * 5
    for (let col = 0; col < cols; col++) {
      ctx.beginPath()
      const centralAngle = -colAngleHalf - colAngle * col
      ctx.arc(
        unit(50),
        unit(50),
        unit(r),
        centralAngle - colAngleHalf * colFactor,
        centralAngle + colAngleHalf * colFactor
      )
      ctx.stroke()
    }
  }

  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.moveTo(unit(50), unit(50))
  ctx.arc(unit(50), unit(50), unit(50), Math.PI * 0.25, Math.PI * 0.75)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.center.setScalar(0.5)
  return texture
}

// Create the neon gradient texture exactly like the original
export function createNeonMatcap() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  const grd = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grd.addColorStop(0.25, '#ff00ff')
  grd.addColorStop(0.5, '#ff88ff')
  grd.addColorStop(0.75, '#0044ff')
  grd.addColorStop(1, '#ffff00')

  ctx.fillStyle = grd
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.center.setScalar(0.5)
  return texture
}

// SimplexNoise implementation - matches Three.js SimplexNoise
export class SimplexNoise {
  private grad3 = [
    [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
    [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
    [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
  ]
  
  private p: number[] = []
  private perm: number[] = []
  private permMod12: number[] = []

  constructor() {
    // Initialize permutation array
    for(let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(Math.random() * 256)
    }
    
    // Extend the permutation table
    for(let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255]
      this.permMod12[i] = this.perm[i] % 12
    }
  }

  noise(xin: number, yin: number): number {
    let n0, n1, n2; // Noise contributions from the three corners
    
    // Skew the input space to determine which simplex cell we're in
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0)
    const s = (xin + yin) * F2 // Hairy factor for 2D
    const i = Math.floor(xin + s)
    const j = Math.floor(yin + s)
    
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0
    const t = (i + j) * G2
    const X0 = i - t // Unskew the cell origin back to (x,y) space
    const Y0 = j - t
    const x0 = xin - X0 // The x,y distances from the cell origin
    const y0 = yin - Y0
    
    // Determine which simplex we are in
    let i1, j1 // Offsets for second (middle) corner of simplex in (i,j) coords
    if(x0 > y0) {
      i1 = 1
      j1 = 0
    } else {
      i1 = 0
      j1 = 1
    }
    
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    const x1 = x0 - i1 + G2 // Offsets for middle corner in (x,y) unskewed coords
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1.0 + 2.0 * G2 // Offsets for last corner in (x,y) unskewed coords
    const y2 = y0 - 1.0 + 2.0 * G2
    
    // Work out the hashed gradient indices of the three simplex corners
    const ii = i & 255
    const jj = j & 255
    const gi0 = this.permMod12[ii + this.perm[jj]]
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]]
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]]
    
    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0*x0 - y0*y0
    if(t0 < 0) {
      n0 = 0.0
    } else {
      t0 *= t0
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0)
    }
    
    let t1 = 0.5 - x1*x1 - y1*y1
    if(t1 < 0) {
      n1 = 0.0
    } else {
      t1 *= t1
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1)
    }
    
    let t2 = 0.5 - x2*x2 - y2*y2
    if(t2 < 0) {
      n2 = 0.0
    } else {
      t2 *= t2
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2)
    }
    
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70.0 * (n0 + n1 + n2)
  }

  private dot(g: number[], x: number, y: number): number {
    return g[0] * x + g[1] * y
  }
}

// Auto-centering utility to fix off-center rotation
export function centerGeometry(geometry: THREE.BufferGeometry) {
  // Calculate bounding box and center
  const positionAttribute = geometry.attributes.position
  
  // Check if position attribute exists and is a BufferAttribute
  if (!positionAttribute || !(positionAttribute instanceof THREE.BufferAttribute)) {
    console.warn('Position attribute not found or not a BufferAttribute')
    return geometry
  }
  
  const box = new THREE.Box3().setFromBufferAttribute(positionAttribute)
  const center = new THREE.Vector3()
  box.getCenter(center)
  
  // Translate geometry to center it at origin
  geometry.translate(-center.x, -center.y, -center.z)
  
  return geometry
}