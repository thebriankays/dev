'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { gsap } from 'gsap'
import CustomEase from 'gsap/CustomEase'

interface DolphinProps {
  curve: THREE.CatmullRomCurve3
  delay?: number
  index: number
  animationSpeed?: number
}

gsap.registerPlugin(CustomEase)

const ease = CustomEase.create(
  'custom',
  'M0,0,C0.042,0.224,0.268,0.35,0.524,0.528,0.708,0.656,0.876,0.808,1,1'
)

export function Dolphin({ curve, delay = 0, index, animationSpeed = 3 }: DolphinProps) {
  const { scene } = useGLTF('/dolphin.glb')
  const meshRef = useRef<THREE.Mesh>(null)
  const playHead = useRef({ value: 0 })
  const dataTextureRef = useRef<THREE.DataTexture | null>(null)
  
  const dolphinMesh = useMemo(() => {
    const mesh = scene.children[0] as THREE.Mesh
    const geometry = mesh.geometry.clone()
    geometry.rotateZ(-Math.PI * 0.5)
    
    const material = (mesh.material as THREE.Material).clone()
    
    return { geometry, material }
  }, [scene])

  const { numPoints, dataTexture, lengthRatio, objSize } = useMemo(() => {
    const numPoints = 511
    const cPoints = curve.getSpacedPoints(numPoints)
    const cObjects = curve.computeFrenetFrames(numPoints, true)

    const data: number[] = []
    // For RGBA format, we need 4 values per pixel
    cPoints.forEach((v) => {
      data.push(v.x, v.y, v.z, 1.0)
    })
    cObjects.binormals.forEach((v) => {
      data.push(v.x, v.y, v.z, 1.0)
    })
    cObjects.normals.forEach((v) => {
      data.push(v.x, v.y, v.z, 1.0)
    })
    cObjects.tangents.forEach((v) => {
      data.push(v.x, v.y, v.z, 1.0)
    })

    const dataArray = new Float32Array(data)
    const tex = new THREE.DataTexture(
      dataArray,
      numPoints + 1,
      4,
      THREE.RGBAFormat,
      THREE.FloatType
    )
    tex.internalFormat = 'RGBA32F'
    tex.magFilter = THREE.NearestFilter
    tex.needsUpdate = true

    const objBox = new THREE.Box3().setFromBufferAttribute(
      dolphinMesh.geometry.getAttribute('position') as THREE.BufferAttribute
    )
    const objSize = new THREE.Vector3()
    objBox.getSize(objSize)

    const lengthRatio = objSize.z / curve.getLength()

    return { numPoints, dataTexture: tex, lengthRatio, objSize }
  }, [curve, dolphinMesh.geometry])

  useEffect(() => {
    dataTextureRef.current = dataTexture
    
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 })
    tl.to(playHead.current, { value: 1, duration: animationSpeed, ease }, delay)
    
    return () => {
      tl.kill()
    }
  }, [dataTexture, delay, animationSpeed])

  useEffect(() => {
    if (!dolphinMesh.material) return

    const material = dolphinMesh.material as THREE.MeshStandardMaterial
    material.onBeforeCompile = (shader) => {
      shader.uniforms = {
        ...shader.uniforms,
        uSpatialTexture: { value: dataTextureRef.current },
        uTextureSize: { value: new THREE.Vector2(numPoints + 1, 4) },
        uTime: { value: 0 },
        uLengthRatio: { value: lengthRatio },
        uObjSize: { value: objSize }
      }

      shader.vertexShader = `
        uniform sampler2D uSpatialTexture;
        uniform vec2 uTextureSize;
        uniform float uTime;
        uniform float uLengthRatio;
        uniform vec3 uObjSize;
  
        struct splineData {
          vec3 point;
          vec3 binormal;
          vec3 normal;
        };
  
        splineData getSplineData(float t){
          float xstep = 1. / uTextureSize.y;
          float halfStep = xstep * 0.5;
          splineData sd;
          sd.point    = texture2D(uSpatialTexture, vec2(t, xstep * 0. + halfStep)).rgb;
          sd.binormal = texture2D(uSpatialTexture, vec2(t, xstep * 1. + halfStep)).rgb;
          sd.normal   = texture2D(uSpatialTexture, vec2(t, xstep * 2. + halfStep)).rgb;
          return sd;
        }
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        `#include <begin_vertex>`,
        `#include <begin_vertex>
  
          vec3 pos = position;
    
          float wStep = 1. / uTextureSize.x;
          float hWStep = wStep * 0.5;
    
          float d = pos.z / uObjSize.z;
          float t = uTime + (d * uLengthRatio);
          float numPrev = floor(t / wStep);
          float numNext = numPrev + 1.;
          float tPrev = numPrev * wStep + hWStep;
          float tNext = numNext * wStep + hWStep;
          splineData splinePrev = getSplineData(tPrev);
          splineData splineNext = getSplineData(tNext);
    
          float f = (t - tPrev) / wStep;
          vec3 P = mix(splinePrev.point, splineNext.point, f);
          vec3 B = mix(splinePrev.binormal, splineNext.binormal, f);
          vec3 N = mix(splinePrev.normal, splineNext.normal, f);
    
          transformed = P + (N * pos.x) + (B * pos.y);
        `
      )

      material.userData.shader = shader
    }
  }, [dolphinMesh.material, numPoints, lengthRatio, objSize])

  useFrame(() => {
    if (meshRef.current && dolphinMesh.material.userData.shader) {
      dolphinMesh.material.userData.shader.uniforms.uTime.value = playHead.current.value
    }
  })

  return (
    <mesh
      ref={meshRef}
      geometry={dolphinMesh.geometry}
      material={dolphinMesh.material}
    />
  )
}

useGLTF.preload('/dolphin.glb')