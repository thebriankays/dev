'use client'

import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback
} from 'react'

// Type definitions for Cesium
interface CesiumViewer {
  camera: {
    flyTo: (options: Record<string, unknown>) => void
    setView: (options: Record<string, unknown>) => void
    heading: number
    pitch: number
    positionCartographic: {
      longitude: number
      latitude: number
      height: number
    }
  }
  scene: {
    globe: { enableLighting: boolean }
    primitives: { add: (primitive: unknown) => void }
    debugShowFramesPerSecond: boolean
    pick: (position: { position: { x: number; y: number } }) => unknown
    canvas: HTMLCanvasElement
  }
  entities: {
    add: (entity: Record<string, unknown>) => unknown
    remove: (entity: unknown) => void
  }
  imageryLayers: {
    removeAll: () => void
    addImageryProvider: (provider: unknown) => void
  }
  cesiumWidget?: { creditContainer?: HTMLElement }
  destroy: () => void
  isDestroyed: () => boolean
  clock: {
    onTick: {
      addEventListener: (callback: () => void) => void
      removeEventListener: (callback: () => void) => void
    }
  }
}

interface CesiumModule {
  Ion: { defaultAccessToken?: string }
  Viewer: new (
    container: HTMLElement,
    options?: Record<string, unknown>
  ) => CesiumViewer
  Cartesian3: {
    fromDegrees: (
      lng: number,
      lat: number,
      height?: number
    ) => unknown
    fromRadians: (
      lng: number,
      lat: number,
      height?: number
    ) => unknown
  }
  Cartesian2: new (x: number, y: number) => unknown
  Math: {
    toRadians: (degrees: number) => number
  }
  Color: { WHITE: unknown; BLACK: unknown }
  VerticalOrigin: { BOTTOM: unknown; TOP: unknown }
  HeightReference: { CLAMP_TO_GROUND: unknown }
  LabelStyle: { FILL_AND_OUTLINE: unknown }
  EllipsoidTerrainProvider: new () => unknown
  OpenStreetMapImageryProvider: new (options: {
    url: string
  }) => unknown
  Cesium3DTileset: {
    fromUrl: (url: string, options?: Record<string, unknown>) => Promise<unknown>
  }
  ScreenSpaceEventHandler: new (canvas: HTMLCanvasElement) => {
    setInputAction: (
      callback: (movement: { position: { x: number; y: number } }) => void,
      type: unknown
    ) => void
  }
  ScreenSpaceEventType: { LEFT_CLICK: unknown }
  defined: (value: unknown) => boolean
  Entity: unknown
}

// Define the API that the parent component can call
export interface CesiumViewerHandle {
  flyTo: (opts: {
    lat: number
    lng: number
    altitude?: number
    heading?: number
    pitch?: number
    duration?: number
  }) => void
  startOrbit: (
    type: 'dynamic' | 'fixed',
    speed: number
  ) => void
  stopOrbit: () => void
  addPlaceMarkers: (
    places: google.maps.places.PlaceResult[]
  ) => void
  addPlaceMarker: (
    place: google.maps.places.PlaceResult,
    id: string
  ) => void
  clearMarkers: () => void
  isReady: () => boolean
}

interface CesiumViewerProps {
  /** Called when the Cesium viewer has been created */
  onLoad?: () => void
  /**
   * Called with the Cesium Viewer instance when ready.
   * Useful for disabling default controls or adding other
   * custom settings.
   */
  onViewerReady?: (viewer: CesiumViewer) => void
  /**
   * Called when a marker is clicked
   */
  onMarkerClick?: (id: string) => void
  /**
   * Optional initial camera location. If omitted, the
   * viewer will start centered on San Francisco with a
   * default altitude.
   */
  initialLocation?: {
    lat: number
    lng: number
    altitude?: number
    heading?: number
    pitch?: number
  }
}

export const CesiumViewer = forwardRef<
  CesiumViewerHandle,
  CesiumViewerProps
>(({ onLoad, onViewerReady, onMarkerClick, initialLocation }, ref) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<CesiumViewer | null>(null)
  const cesiumRef = useRef<CesiumModule | null>(null)
  const orbitTickListener = useRef<(() => void) | null>(null)
  const placeEntitiesRef = useRef<unknown[]>([])
  const isInitializedRef = useRef(false)

  // Memoize callbacks
  const handleLoad = useCallback(() => {
    if (onLoad) {
      onLoad()
    }
  }, [onLoad])

  const handleMarkerClick = useCallback((id: string) => {
    if (onMarkerClick) {
      onMarkerClick(id)
    }
  }, [onMarkerClick])

  // Expose the API to the parent via ref
  useImperativeHandle(ref, () => ({
    /**
     * Fly the camera to a given coordinate. You may specify altitude,
     * heading, pitch and duration (in seconds). Defaults are used
     * when values are omitted.
     */
    flyTo(opts) {
      const viewer = viewerRef.current
      const Cesium = cesiumRef.current
      if (!viewer || !Cesium) return

      const {
        lat,
        lng,
        altitude = 1500,
        heading = 0,
        pitch = -45,
        duration = 2.5
      } = opts

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          lng,
          lat,
          altitude
        ),
        orientation: {
          heading: Cesium.Math.toRadians(heading),
          pitch: Cesium.Math.toRadians(pitch),
          roll: 0
        },
        duration
      })
    },

    startOrbit(type, speed) {
      // Stop any existing orbit
      this.stopOrbit()
      const viewer = viewerRef.current
      const Cesium = cesiumRef.current
      if (!viewer || !Cesium) return

      const orbitSpeed = speed * 0.01 // Adjusted for smoother control

      const tickFunction = () => {
        if (type === 'dynamic') {
          const time = Date.now() / 1000
          const sine = Math.sin(time * 0.15)
          const pitch = Cesium.Math.toRadians(-45 + sine * 10)
          viewer.camera.setView({ 
            orientation: { 
              heading: viewer.camera.heading, 
              pitch,
              roll: 0
            }
          })
        }
        // Rotate camera
        const currentHeading = viewer.camera.heading
        viewer.camera.setView({
          orientation: {
            heading: currentHeading + Cesium.Math.toRadians(orbitSpeed),
            pitch: viewer.camera.pitch,
            roll: 0
          }
        })
      }

      viewer.clock.onTick.addEventListener(tickFunction)
      orbitTickListener.current = tickFunction
    },

    stopOrbit() {
      const viewer = viewerRef.current
      if (viewer && orbitTickListener.current) {
        viewer.clock.onTick.removeEventListener(orbitTickListener.current)
        orbitTickListener.current = null
      }
    },

    addPlaceMarker(place, id) {
      const viewer = viewerRef.current
      const Cesium = cesiumRef.current
      const location = place.geometry?.location
      if (!viewer || !Cesium || !location) return

      const entity = viewer.entities.add({
        id: id, // Use the Google Place ID as the entity ID
        position: Cesium.Cartesian3.fromDegrees(
          location.lng(),
          location.lat(),
          10
        ),
        billboard: {
          image:
            place.icon ||
            '/red-dot.png',
          scale: 1.0,
          color: Cesium.Color.WHITE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference:
            Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: place.name || '',
          font: '14px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          disableDepthTestDistance:
            Number.POSITIVE_INFINITY,
          heightReference:
            Cesium.HeightReference.CLAMP_TO_GROUND
        }
      })
      placeEntitiesRef.current.push(entity)
    },

    addPlaceMarkers(places) {
      const viewer = viewerRef.current
      const Cesium = cesiumRef.current
      if (!viewer || !Cesium) return
      
      // Clear existing markers
      this.clearMarkers()

      places.forEach(place => {
        if (place.place_id) {
          this.addPlaceMarker(place, place.place_id)
        }
      })
    },

    clearMarkers() {
      const viewer = viewerRef.current
      if (!viewer) return
      placeEntitiesRef.current.forEach(entity => {
        viewer.entities.remove(entity)
      })
      placeEntitiesRef.current = []
    },

    isReady() {
      return (
        isInitializedRef.current &&
        viewerRef.current !== null
      )
    }
  }))

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) return

    let isMounted = true

    const initCesium = async () => {
      if (!mapContainerRef.current) return
      try {
        const Cesium = (await import(
          /* webpackChunkName: "cesium" */ 'cesium'
        )) as unknown as CesiumModule

        if (!isMounted) return

        cesiumRef.current = Cesium

        // Try to import Cesium CSS
        try {
          await import(
            /* webpackMode: "lazy" */
            'cesium/Build/Cesium/Widgets/widgets.css' as string
          )
        } catch {
          console.warn(
            'Cesium CSS not loaded; using default styles'
          )
        }

        // Disable Cesium Ion by default (we use Google tiles)
        Cesium.Ion.defaultAccessToken = undefined
        const apiKey =
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

        // Create the viewer
        const viewer = new Cesium.Viewer(
          mapContainerRef.current,
          {
            terrainProvider: new Cesium.EllipsoidTerrainProvider(),
            baseLayerPicker: false,
            homeButton: false,
            sceneModePicker: false,
            navigationHelpButton: false,
            animation: false,
            timeline: false,
            fullscreenButton: false,
            vrButton: false,
            geocoder: false,
            infoBox: false,
            selectionIndicator: false,
            shadows: false,
            shouldAnimate: true,
            requestRenderMode: false
          }
        )

        viewerRef.current = viewer

        // Remove any default imagery layers
        viewer.imageryLayers.removeAll()

        // Hide the Cesium logo
        const creditContainer = (
          viewer as CesiumViewer & {
            cesiumWidget?: { creditContainer?: HTMLElement }
          }
        ).cesiumWidget?.creditContainer
        if (creditContainer) {
          creditContainer.style.display = 'none'
        }

        // Disable globe lighting and FPS display
        viewer.scene.globe.enableLighting = false
        viewer.scene.debugShowFramesPerSecond = false

        // Load Google 3D tiles if API key is available
        if (apiKey) {
          try {
            // Use the Cesium3DTileset.fromUrl method to align with Google's examples
            const tileset = await Cesium.Cesium3DTileset.fromUrl(
              `https://tile.googleapis.com/v1/3dtiles/root.json?key=${apiKey}`,
              { showCreditsOnScreen: true }
            )
            viewer.scene.primitives.add(tileset)
            console.log('Google 3D Tiles loaded successfully')
          } catch (error) {
            console.warn(
              'Google 3D tiles not available; falling back to OpenStreetMap',
              error
            )
            const osmProvider = new Cesium.OpenStreetMapImageryProvider(
              { url: 'https://a.tile.openstreetmap.org/' }
            )
            viewer.imageryLayers.addImageryProvider(
              osmProvider
            )
          }
        } else {
          // No API key, always use OpenStreetMap
          const osmProvider = new Cesium.OpenStreetMapImageryProvider(
            { url: 'https://a.tile.openstreetmap.org/' }
          )
          viewer.imageryLayers.addImageryProvider(
            osmProvider
          )
        }

        // Add click handler for markers if callback provided
        if (onMarkerClick && Cesium.ScreenSpaceEventHandler) {
          const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
          handler.setInputAction((movement: { position: { x: number; y: number } }) => {
            const pickedObject = viewer.scene.pick(movement) as any
            if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject?.id)) {
              if (typeof pickedObject.id === 'string') {
                handleMarkerClick(pickedObject.id)
              } else if (pickedObject.id && pickedObject.id.id) {
                handleMarkerClick(pickedObject.id.id)
              }
            }
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        }

        // Set initial camera view
        const initLat = initialLocation?.lat ?? 37.7759
        const initLng = initialLocation?.lng ?? -122.4175
        const initAltitude = initialLocation?.altitude ?? 1500
        const initHeading = initialLocation?.heading ?? 0
        const initPitch = initialLocation?.pitch ?? -45

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            initLng,
            initLat,
            initAltitude
          ),
          orientation: {
            heading: Cesium.Math.toRadians(initHeading),
            pitch: Cesium.Math.toRadians(initPitch),
            roll: 0
          }
        })

        // Mark as initialized
        isInitializedRef.current = true

        // Notify listeners
        if (isMounted) {
          handleLoad()
          if (onViewerReady) {
            onViewerReady(viewer)
          }
        }
      } catch (err) {
        console.error('Cesium initialization error:', err)
      }
    }

    initCesium()

    return () => {
      isMounted = false
      if (orbitTickListener.current && viewerRef.current) {
        viewerRef.current.clock.onTick.removeEventListener(orbitTickListener.current)
      }
      if (
        viewerRef.current &&
        !viewerRef.current.isDestroyed()
      ) {
        viewerRef.current.destroy()
      }
      viewerRef.current = null
      cesiumRef.current = null
      isInitializedRef.current = false
    }
  }, [handleLoad, onViewerReady, initialLocation, handleMarkerClick, onMarkerClick])

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    />
  )
})

CesiumViewer.displayName = 'CesiumViewer'
