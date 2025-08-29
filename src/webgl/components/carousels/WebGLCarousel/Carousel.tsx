import { useEffect, useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { usePrevious } from 'react-use'
import gsap from 'gsap'
import * as THREE from 'three'
import PostProcessing from './PostProcessing'
import CarouselItem from './CarouselItem'
import { lerp, getPiramidalIndex } from './utils'

// Default images - replace with your actual images
const images = [
  { image: '/images/1.jpg' },
  { image: '/images/2.jpg' },
  { image: '/images/3.jpg' },
  { image: '/images/4.jpg' },
  { image: '/images/5.jpg' },
  { image: '/images/6.jpg' },
  { image: '/images/7.jpg' },
  { image: '/images/8.jpg' },
  { image: '/images/9.jpg' },
  { image: '/images/10.jpg' },
  { image: '/images/11.jpg' },
  { image: '/images/12.jpg' },
]

/*------------------------------
Plane Settings
------------------------------*/
const planeSettings = {
  width: 1,
  height: 2.5,
  gap: 0.1,
}

/*------------------------------
Gsap Defaults
------------------------------*/
gsap.defaults({
  duration: 2.5,
  ease: 'power3.out',
})

interface CarouselProps {
  imageData?: Array<{ image: string }>
  enablePostProcessing?: boolean
  planeSettings?: {
    width?: number
    height?: number
    gap?: number
  }
}

/*------------------------------
Carousel
------------------------------*/
const Carousel: React.FC<CarouselProps> = ({ imageData = images }) => {
  const [$root, setRoot] = useState<THREE.Group | null>(null)
  const $post = useRef<any>(null)

  const [activePlane, setActivePlane] = useState<number | null>(null)
  const prevActivePlane = usePrevious(activePlane)
  const { viewport } = useThree()

  /*--------------------
  Vars
  --------------------*/
  const progress = useRef(0)
  const startX = useRef(0)
  const isDown = useRef(false)
  const speedWheel = 0.02
  const speedDrag = -0.3
  const oldProgress = useRef(0)
  const speed = useRef(0)
  const $items = useMemo(() => {
    if ($root) return $root.children
    return []
  }, [$root])

  /*--------------------
  Display Items
  --------------------*/
  const displayItems = (item: THREE.Object3D, index: number, active: number) => {
    const piramidalIndex = getPiramidalIndex($items as any[], active)[index]
    gsap.to(item.position, {
      x: (index - active) * (planeSettings.width + planeSettings.gap),
      y: $items.length * -0.1 + piramidalIndex * 0.1,
    })
  }

  /*--------------------
  RAF
  --------------------*/
  useFrame(() => {
    progress.current = Math.max(0, Math.min(progress.current, 100))

    const active = Math.floor((progress.current / 100) * ($items.length - 1))
    $items.forEach((item, index) => displayItems(item, index, active))
    speed.current = lerp(speed.current, Math.abs(oldProgress.current - progress.current), 0.1)

    oldProgress.current = lerp(oldProgress.current, progress.current, 0.1)

    if ($post.current) {
      $post.current.thickness = speed.current
    }
  })

  /*--------------------
  Handle Wheel
  --------------------*/
  const handleWheel = (e: React.WheelEvent) => {
    if (activePlane !== null) return
    const isVerticalScroll = Math.abs(e.deltaY) > Math.abs(e.deltaX)
    const wheelProgress = isVerticalScroll ? e.deltaY : e.deltaX
    progress.current = progress.current + wheelProgress * speedWheel
  }

  /*--------------------
  Handle Down
  --------------------*/
  const handleDown = (e: React.PointerEvent) => {
    if (activePlane !== null) return
    isDown.current = true
    startX.current = e.clientX
  }

  /*--------------------
  Handle Up
  --------------------*/
  const handleUp = () => {
    isDown.current = false
  }

  /*--------------------
  Handle Move
  --------------------*/
  const handleMove = (e: React.PointerEvent) => {
    if (activePlane !== null || !isDown.current) return
    const x = e.clientX
    const mouseProgress = (x - startX.current) * speedDrag
    progress.current = progress.current + mouseProgress
    startX.current = x
  }

  /*--------------------
  Click
  --------------------*/
  useEffect(() => {
    if (!$items.length) return
    if (activePlane !== null && prevActivePlane === null) {
      progress.current = (activePlane / ($items.length - 1)) * 100 // Calculate the progress.current based on activePlane
    }
  }, [activePlane, $items, prevActivePlane])

  /*--------------------
  Render Plane Events
  --------------------*/
  const renderPlaneEvents = () => {
    return (
      <mesh
        position={[0, 0, -0.01]}
        onWheel={handleWheel}
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerMove={handleMove}
        onPointerLeave={handleUp}
        onPointerCancel={handleUp}
      >
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial transparent={true} opacity={0} />
      </mesh>
    )
  }

  /*--------------------
  Render Slider
  --------------------*/
  const renderSlider = () => {
    return (
      <group ref={setRoot}>
        {imageData.map((item, i) => (
          <CarouselItem
            width={planeSettings.width}
            height={planeSettings.height}
            setActivePlane={setActivePlane}
            activePlane={activePlane}
            key={item.image}
            item={item}
            index={i}
          />
        ))}
      </group>
    )
  }

  return (
    <group>
      {renderPlaneEvents()}
      {renderSlider()}
      <PostProcessing ref={$post} />
    </group>
  )
}

export default Carousel
