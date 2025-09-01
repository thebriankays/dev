'use client'

import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback
} from 'react'

// Type definitions for Cesium Viewer
export interface CesiumViewer {
  camera: {
    flyTo: (options: Record<string, unknown>) => void
    setView: (options: Record<string, unknown>) => void
    heading: number
    pitch: number
    roll?: number
    positionCartographic: {
      longitude: number
      latitude: number
      height: number
    }
    changed?: {
      addEventListener: (callback: () => void) => void
      removeEventListener: (callback: () => void) => void
    }
  }
  scene?: {
    globe?: { enableLighting: boolean }
    primitives?: { 
      add: (primitive: unknown) => void
      remove: (primitive: unknown) => void
    }
    debugShowFramesPerSecond?: boolean
    pick?: (position: { position: { x: number; y: number } }) => unknown
    canvas?: HTMLCanvasElement
  }
  entities: {
    add: (entity: Record<string, unknown>) => unknown
    remove: (entity: unknown) => void
    removeAll: () => void
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
  Color: { 
    WHITE: unknown
    BLACK: unknown
    RED: unknown
    BLUE: unknown
    GREEN: unknown
    YELLOW: unknown
    ORANGE: unknown
    fromCssColorString: (color: string) => unknown
  }
  VerticalOrigin: { BOTTOM: unknown; TOP: unknown; CENTER: unknown }
  HeightReference: { CLAMP_TO_GROUND: unknown }
  LabelStyle: { FILL_AND_OUTLINE: unknown }
  EllipsoidTerrainProvider: new () => unknown
  OpenStreetMapImageryProvider: new (options: {
    url: string
  }) => unknown
  Cesium3DTileset: {
    fromUrl?: (url: string, options?: Record<string, unknown>) => Promise<unknown>
  }
  ScreenSpaceEventHandler: new (canvas: HTMLCanvasElement) => {
    setInputAction: (
      callback: (movement: { position: { x: number; y: number } }) => void,
      type: unknown
    ) => void
    destroy?: () => void
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
  getViewer: () => CesiumViewer | null
}

interface CesiumViewerProps {
  onLoad?: () => void
  onViewerReady?: (viewer: CesiumViewer) => void
  onMarkerClick?: (id: string) => void
  initialLocation?: {
    lat: number
    lng: number
    name?: string
    altitude?: number
    heading?: number
    pitch?: number
  }
}

// Map POI types to colors
const POI_COLORS: Record<string, string> = {
  restaurant: '#FF6B6B',      // Red
  cafe: '#8B4513',            // Brown
  park: '#4CAF50',            // Green
  museum: '#9C27B0',          // Purple
  lodging: '#2196F3',         // Blue
  shopping_mall: '#FF9800',   // Orange
  tourist_attraction: '#00BCD4', // Cyan
  bank: '#607D8B',            // Blue Grey
  pharmacy: '#E91E63',        // Pink
  hospital: '#F44336',        // Deep Red
  gas_station: '#795548',     // Brown
  parking: '#3F51B5',         // Indigo
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
  const eventHandlerRef = useRef<any>(null)
  const tilesetRef = useRef<any>(null)

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

  // Get color for POI type
  const getPoiColor = (place: google.maps.places.PlaceResult): string => {
    const types = place.types || []
    for (const [type, color] of Object.entries(POI_COLORS)) {
      if (types.includes(type)) {
        return color
      }
    }
    return '#FF0000' // Default red
  }

  // Expose the API to the parent via ref
  useImperativeHandle(ref, () => ({
    flyTo(opts) {
      const viewer = viewerRef.current
      const Cesium = cesiumRef.current
      if (!viewer || !Cesium) {
        console.warn('Viewer not ready for flyTo')
        return
      }

      const {
        lat,
        lng,
        altitude = 1500,
        heading = 0,
        pitch = -45,
        duration = 2.5
      } = opts

      try {
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
      } catch (error) {
        console.error('Error in flyTo:', error)
      }
    },

    startOrbit(type, speed) {
      this.stopOrbit()
      const viewer = viewerRef.current
      const Cesium = cesiumRef.current
      if (!viewer || !Cesium) {
        console.warn('Viewer not ready for orbit')
        return
      }

      const orbitSpeed = speed * 0.01

      const tickFunction = () => {
        try {
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
          const currentHeading = viewer.camera.heading
          viewer.camera.setView({
            orientation: {
              heading: currentHeading + Cesium.Math.toRadians(orbitSpeed),
              pitch: viewer.camera.pitch,
              roll: 0
            }
          })
        } catch (error) {
          console.error('Error in orbit tick:', error)
        }
      }

      viewer.clock.onTick.addEventListener(tickFunction)
      orbitTickListener.current = tickFunction
    },

    stopOrbit() {
      const viewer = viewerRef.current
      if (viewer && orbitTickListener.current) {
        try {
          viewer.clock.onTick.removeEventListener(orbitTickListener.current)
        } catch (error) {
          console.error('Error stopping orbit:', error)
        }
        orbitTickListener.current = null
      }
    },

    addPlaceMarker(place, id) {
      const viewer = viewerRef.current
      const Cesium = cesiumRef.current
      const location = place.geometry?.location
      if (!viewer || !Cesium || !location) return

      try {
        const color = getPoiColor(place)
        const cesiumColor = Cesium.Color.fromCssColorString(color)
        
        // Create a simple point marker without label to avoid overlap
        const entity = viewer.entities.add({
          id: id,
          position: Cesium.Cartesian3.fromDegrees(
            location.lng(),
            location.lat(),
            10
          ),
          point: {
            pixelSize: 12,
            color: cesiumColor,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          // Store the place name in properties for tooltip/click handling
          properties: {
            name: place.name,
            rating: place.rating,
            vicinity: place.vicinity
          }
        })
        placeEntitiesRef.current.push(entity)
      } catch (error) {
        console.error('Error adding place marker:', error)
      }
    },

    addPlaceMarkers(places) {
      const viewer = viewerRef.current
      const Cesium = cesiumRef.current
      if (!viewer || !Cesium) {
        console.warn('Viewer not ready for markers')
        return
      }
      
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
      try {
        placeEntitiesRef.current.forEach(entity => {
          viewer.entities.remove(entity)
        })
        placeEntitiesRef.current = []
      } catch (error) {
        console.error('Error clearing markers:', error)
      }
    },

    isReady() {
      return (
        isInitializedRef.current &&
        viewerRef.current !== null &&
        viewerRef.current.scene !== undefined
      )
    },
    
    getViewer() {
      return viewerRef.current
    }
  }))

  useEffect(() => {
    if (isInitializedRef.current) return

    let isMounted = true

    const initCesium = async () => {
      if (!mapContainerRef.current) return
      
      try {
        console.log('Starting Cesium initialization...')
        
        const Cesium = (await import(
          /* webpackChunkName: "cesium" */ 'cesium'
        )) as unknown as CesiumModule

        if (!isMounted) return

        cesiumRef.current = Cesium

        try {
          await import(
            /* webpackMode: "lazy" */
            'cesium/Build/Cesium/Widgets/widgets.css' as string
          )
        } catch {
          console.warn('Cesium CSS not loaded; using default styles')
        }

        const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN
        if (ionToken) {
          Cesium.Ion.defaultAccessToken = ionToken
        } else {
          Cesium.Ion.defaultAccessToken = undefined
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

        const viewer = new Cesium.Viewer(mapContainerRef.current, {
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
          requestRenderMode: false,
          imageryProvider: false as any
        })

        if (!isMounted) {
          viewer.destroy()
          return
        }

        viewerRef.current = viewer

        if (viewer.scene) {
          viewer.imageryLayers.removeAll()

          const creditContainer = viewer.cesiumWidget?.creditContainer
          if (creditContainer) {
            creditContainer.style.display = 'none'
          }

          if (viewer.scene.globe) {
            viewer.scene.globe.enableLighting = false
          }
          if (viewer.scene.debugShowFramesPerSecond !== undefined) {
            viewer.scene.debugShowFramesPerSecond = false
          }

          let tilesetLoaded = false

          if (apiKey && viewer.scene.primitives) {
            try {
              console.log('Attempting to load Google 3D tiles...')
              
              const google3DTilesUrl = `https://tile.googleapis.com/v1/3dtiles/root.json?key=${apiKey}`
              
              if (Cesium.Cesium3DTileset && Cesium.Cesium3DTileset.fromUrl) {
                const tileset = await Cesium.Cesium3DTileset.fromUrl(
                  google3DTilesUrl,
                  {
                    skipLevelOfDetail: true,
                    baseScreenSpaceError: 1024,
                    skipScreenSpaceErrorFactor: 16,
                    skipLevels: 1,
                    immediatelyLoadDesiredLevelOfDetail: false,
                    loadSiblings: false,
                    cullWithChildrenBounds: true
                  }
                )
                
                if (isMounted && viewer.scene?.primitives) {
                  tilesetRef.current = tileset
                  viewer.scene.primitives.add(tileset)
                  tilesetLoaded = true
                  console.log('Google 3D Tiles loaded successfully')
                }
              }
            } catch (error) {
              console.warn('Failed to load Google 3D tiles:', error)
            }
          }

          if (!tilesetLoaded) {
            console.log('Using OpenStreetMap imagery as fallback')
            try {
              const osmProvider = new Cesium.OpenStreetMapImageryProvider({
                url: 'https://tile.openstreetmap.org/'
              })
              viewer.imageryLayers.addImageryProvider(osmProvider)
            } catch (error) {
              console.error('Failed to load OpenStreetMap:', error)
            }
          }

          if (onMarkerClick && viewer.scene.canvas && Cesium.ScreenSpaceEventHandler) {
            try {
              const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
              eventHandlerRef.current = handler
              
              handler.setInputAction((movement: { position: { x: number; y: number } }) => {
                if (!viewer.scene?.pick) return
                
                try {
                  const pickedObject = viewer.scene.pick(movement) as any
                  if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject?.id)) {
                    if (typeof pickedObject.id === 'string') {
                      handleMarkerClick(pickedObject.id)
                    } else if (pickedObject.id && pickedObject.id.id) {
                      handleMarkerClick(pickedObject.id.id)
                    }
                  }
                } catch (error) {
                  console.error('Error handling click:', error)
                }
              }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
            } catch (error) {
              console.error('Failed to setup click handler:', error)
            }
          }
        }

        const initLat = initialLocation?.lat ?? 37.7759
        const initLng = initialLocation?.lng ?? -122.4175
        const initAltitude = initialLocation?.altitude ?? 1500
        const initHeading = initialLocation?.heading ?? 0
        const initPitch = initialLocation?.pitch ?? -45

        try {
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
        } catch (error) {
          console.error('Error setting initial camera view:', error)
        }

        isInitializedRef.current = true

        if (isMounted) {
          console.log('Cesium initialization complete')
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
      console.log('Cleaning up Cesium viewer...')
      isMounted = false
      
      if (orbitTickListener.current && viewerRef.current) {
        try {
          viewerRef.current.clock.onTick.removeEventListener(orbitTickListener.current)
        } catch (error) {
          console.error('Error removing orbit listener:', error)
        }
      }
      
      if (eventHandlerRef.current && eventHandlerRef.current.destroy) {
        try {
          eventHandlerRef.current.destroy()
        } catch (error) {
          console.error('Error destroying event handler:', error)
        }
      }
      
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        try {
          viewerRef.current.destroy()
        } catch (error) {
          console.error('Error destroying viewer:', error)
        }
      }
      
      viewerRef.current = null
      cesiumRef.current = null
      eventHandlerRef.current = null
      isInitializedRef.current = false
    }
  }, [])

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
