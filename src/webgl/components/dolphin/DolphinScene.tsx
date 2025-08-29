'use client'

import { useRef, useEffect, useMemo, Suspense } from 'react'
import { useFrame, useThree, extend } from '@react-three/fiber'
import { Water } from 'three-stdlib'
import { Sky, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { Dolphin } from './Dolphin'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      water: any
    }
  }
}

interface DolphinSceneProps {
  sceneSettings?: {
    cameraDistance?: number
    waterColor?: string
    skyTurbidity?: number
    sunElevation?: number
  }
  dolphins?: {
    count?: '1' | '2' | '3'
    animationSpeed?: number
    pathVariation?: 'default' | 'wide' | 'narrow'
  }
  interaction?: {
    enableOrbitControls?: boolean
    autoRotate?: boolean
    rotationSpeed?: number
  }
  webglEffects?: {
    distortion?: number
    parallax?: number
    hover?: boolean
    transition?: 'fade' | 'slide' | 'morph'
  }
}

extend({ Water })

function map(value: number, sMin: number, sMax: number, dMin: number, dMax: number) {
  return dMin + ((value - sMin) / (sMax - sMin)) * (dMax - dMin)
}

function getCurve(wMin: number, wMax: number, hMin: number, hMax: number, z: number) {
  const path = new THREE.Path()
  path.moveTo(0, 40)
  path.bezierCurveTo(39.4459, 17.0938, 62.5, 0, 100, 0)
  path.bezierCurveTo(137.5, 0, 173.133, 19.1339, 200, 40)
  const pathPoints = path.getPoints()
  
  const initialPoints = pathPoints.map(
    ({ x, y }) =>
      new THREE.Vector3(
        map(x, 0, 200, wMin, wMax),
        map(y, 0, 40, hMax, hMin),
        z
      )
  )
  const curve = new THREE.CatmullRomCurve3(initialPoints)
  curve.curveType = 'centripetal'
  curve.closed = false
  return curve
}

export function DolphinScene({
  sceneSettings = {},
  dolphins = {},
  interaction = {},
  webglEffects = {}
}: DolphinSceneProps) {
  const waterRef = useRef<Water>(null)
  const skyRef = useRef<any>(null)
  const { gl, scene } = useThree()
  const sun = useMemo(() => new THREE.Vector3(), [])
  
  const {
    cameraDistance = 300,
    waterColor = '#001e0f',
    skyTurbidity = 10,
    sunElevation = 20
  } = sceneSettings
  
  // Initialize sun position and environment
  useEffect(() => {
    const phi = THREE.MathUtils.degToRad(90 - sunElevation)
    const theta = THREE.MathUtils.degToRad(180)
    sun.setFromSphericalCoords(1, phi, theta)
    
    // Update sky sun position
    if (skyRef.current) {
      skyRef.current.material.uniforms.sunPosition.value.copy(sun)
    }
    
    // Update water sun direction
    if (waterRef.current && waterRef.current.material) {
      waterRef.current.material.uniforms.sunDirection.value.copy(sun).normalize()
    }
    
    // Generate environment map
    const pmremGenerator = new THREE.PMREMGenerator(gl)
    pmremGenerator.compileEquirectangularShader()
    
    if (skyRef.current) {
      scene.environment = pmremGenerator.fromScene(skyRef.current).texture
    }
    
    return () => {
      pmremGenerator.dispose()
    }
  }, [sunElevation, sun, gl, scene])
  
  const {
    count = '3',
    animationSpeed = 3,
    pathVariation = 'default'
  } = dolphins
  
  const {
    enableOrbitControls = true,
    autoRotate = false,
    rotationSpeed = 0.5
  } = interaction
  
  const waterNormals = useMemo(() => {
    return new THREE.TextureLoader().load(
      '/dolphin-waternormals.jpg',
      (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping
      }
    )
  }, [])

  const curves = useMemo(() => {
    const numCurves = parseInt(count)
    const pathConfigs = {
      default: [
        [-140, 80, -10, 20, 10],
        [-100, 100, -15, 25, 30],
        [-80, 120, -10, 20, 50]
      ],
      wide: [
        [-180, 120, -10, 20, 10],
        [-150, 150, -15, 25, 30],
        [-120, 180, -10, 20, 50]
      ],
      narrow: [
        [-100, 40, -10, 20, 10],
        [-80, 60, -15, 25, 30],
        [-60, 80, -10, 20, 50]
      ]
    }
    
    const config = pathConfigs[pathVariation]
    return config.slice(0, numCurves).map(([wMin, wMax, hMin, hMax, z]) => 
      getCurve(wMin, wMax, hMin, hMax, z)
    )
  }, [count, pathVariation])

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl)
    pmremGenerator.compileEquirectangularShader()
    
    return () => {
      pmremGenerator.dispose()
    }
  }, [gl])

  useFrame((state, delta) => {
    if (waterRef.current && waterRef.current.material && waterRef.current.material.uniforms) {
      waterRef.current.material.uniforms.time.value += delta
    }
  })

  return (
    <group>
      <PerspectiveCamera
        makeDefault
        position={[0, 50, cameraDistance]}
        rotation={[-0.2, 0, 0]}
        fov={55}
        near={1}
        far={20000}
      />
      
      {enableOrbitControls && (
        <OrbitControls
          maxPolarAngle={Math.PI * 0.495}
          target={[0, 10, 0]}
          minDistance={40}
          maxDistance={200}
          autoRotate={autoRotate}
          autoRotateSpeed={rotationSpeed}
        />
      )}

      <ambientLight intensity={0.6} />
      <directionalLight 
        position={sun.clone().multiplyScalar(500)} 
        intensity={1.5} 
        castShadow 
      />

      <Sky
        ref={skyRef}
        distance={450000}
        turbidity={skyTurbidity}
        rayleigh={3}
        mieCoefficient={0.005}
        mieDirectionalG={0.7}
        sunPosition={sun}
      />

      {/* @ts-ignore - Water is extended but TypeScript doesn't know */}
      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(10000, 10000),
          {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals,
            sunDirection: new THREE.Vector3(0.7, 0.7, 0),
            sunColor: 0xffffff,
            waterColor: new THREE.Color(waterColor).getHex(),
            distortionScale: 3.7,
            fog: false,
            alpha: 0.9,
          }
        ]}
        position={[0, 0, 0]}
        rotation-x={-Math.PI / 2}
      />

      <Suspense fallback={null}>
        {curves.map((curve, index) => (
          <Dolphin
            key={index}
            curve={curve}
            delay={index === 0 ? 0.3 : index === 1 ? 0 : 0.4}
            index={index}
            animationSpeed={animationSpeed}
          />
        ))}
      </Suspense>
    </group>
  )
}