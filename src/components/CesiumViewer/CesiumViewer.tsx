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
    moveForward: (amount: number) => void
    moveBackward: (amount: number) => void
    moveLeft: (amount: number) => void
    moveRight: (amount: number) => void
    moveUp: (amount: number) => void
    moveDown: (amount: number) => void
    zoomIn: (amount?: number) => void
    zoomOut: (amount?: number) => void
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
    screenSpaceCameraController?: {
      enableRotate: boolean
      enableTranslate: boolean
      enableZoom: boolean
      enableTilt: boolean
      enableLook: boolean
    }
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
    fromDegreesArrayHeights?: (
      coordinates: number[]
    ) => unknown
  }
  Cartesian2: new (x: number, y: number) => unknown
  Math: {
    toRadians: (degrees: number) => number
    toDegrees: (radians: number) => number
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
  NearFarScalar?: new (near: number, nearValue: number, far: number, farValue: number) => unknown
  Billboard?: unknown
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
  getCameraInfo: () => {
    lat: number
    lng: number
    altitude: number
    heading: number
    pitch: number
  } | null
  setCameraView: (opts: {
    heading?: number
    pitch?: number
    altitude?: number
  }) => void
  moveCamera: (direction: 'forward' | 'backward' | 'left' | 'right', distance: number) => void
  zoomCamera: (factor: number) => void
  highlightMarker: (id: string) => void
  unhighlightMarkers: () => void
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
  const placeEntitiesRef = useRef<any[]>([])
  const isInitializedRef = useRef(false)
  const eventHandlerRef = useRef<any>(null)
  const tilesetRef = useRef<any>(null)
  const selectedEntityRef = useRef<any>(null)

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
        
        // Create a more prominent marker
        const entity = viewer.entities.add({
          id: id,
          position: Cesium.Cartesian3.fromDegrees(
            location.lng(),
            location.lat(),
            25  // Raise it a bit higher
          ),
          point: {
            pixelSize: 20,  // Larger size
            color: cesiumColor,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 3,  // Thicker outline
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          // Store the place info
          properties: {
            name: place.name,
            rating: place.rating,
            vicinity: place.vicinity,
            placeId: id,
            originalColor: color  // Store original color for restoration
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
    },
    
    getCameraInfo() {
      const viewer = viewerRef.current
      const Cesium = cesiumRef.current
      if (!viewer || !Cesium) return null
      
      try {
        const pos = viewer.camera.positionCartographic
        return {
          lat: Cesium.Math.toDegrees(pos.latitude),
          lng: Cesium.Math.toDegrees(pos.longitude),
          altitude: pos.height,
          heading: Cesium.Math.toDegrees(viewer.camera.heading),
          pitch: Cesium.Math.toDegrees(viewer.camera.pitch)
        }
      } catch (error) {
        console.error('Error getting camera info:', error)
        return null
      }
    },
    
    setCameraView(opts) {
      const viewer = viewerRef.current
      const Cesium = cesiumRef.current
      if (!viewer || !Cesium) return
      
      try {
        const currentPos = viewer.camera.positionCartographic
        const newOptions: Record<string, unknown> = {}
        
        if (opts.heading !== undefined) {
          newOptions.heading = Cesium.Math.toRadians(opts.heading)
        }
        if (opts.pitch !== undefined) {
          newOptions.pitch = Cesium.Math.toRadians(opts.pitch)
        }
        
        if (opts.altitude !== undefined) {
          newOptions.destination = Cesium.Cartesian3.fromRadians(
            currentPos.longitude,
            currentPos.latitude,
            opts.altitude
          )
        }
        
        viewer.camera.setView({
          orientation: newOptions.heading !== undefined || newOptions.pitch !== undefined ? {
            heading: newOptions.heading ?? viewer.camera.heading,
            pitch: newOptions.pitch ?? viewer.camera.pitch,
            roll: 0
          } : undefined,
          destination: newOptions.destination
        })
      } catch (error) {
        console.error('Error setting camera view:', error)
      }
    },
    
    moveCamera(direction, distance) {
      const viewer = viewerRef.current
      const Cesium = cesiumRef.current
      if (!viewer || !Cesium) return
      
      try {
        switch (direction) {
          case 'forward':
            viewer.camera.moveForward(distance)
            break
          case 'backward':
            viewer.camera.moveBackward(distance)
            break
          case 'left':
            viewer.camera.moveLeft(distance)
            break
          case 'right':
            viewer.camera.moveRight(distance)
            break
        }
      } catch (error) {
        console.error('Error moving camera:', error)
      }
    },
    
    zoomCamera(factor) {
      const viewer = viewerRef.current
      const Cesium = cesiumRef.current
      if (!viewer || !Cesium) return
      
      try {
        if (factor < 1) {
          // Zoom in
          viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.2)
        } else {
          // Zoom out
          viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 0.2)
        }
      } catch (error) {
        console.error('Error zooming camera:', error)
      }
    },
    
    highlightMarker(id) {
      const viewer = viewerRef.current
      const Cesium = cesiumRef.current
      if (!viewer || !Cesium) return
      
      try {
        // First unhighlight any previously selected marker
        this.unhighlightMarkers()
        
        // Find the entity with this ID
        const entity = placeEntitiesRef.current.find((e) => {
          const ent = e as any
          return ent.id === id
        })
        if (entity && (entity as any).point) {
          selectedEntityRef.current = entity
          
          // Make the selected marker larger and add pulsing effect
          const ent = entity as any
          ent.point.pixelSize = 35  // Much larger when selected
          ent.point.outlineWidth = 5
          ent.point.color = Cesium.Color.YELLOW
          ent.point.outlineColor = Cesium.Color.RED
        }
      } catch (error) {
        console.error('Error highlighting marker:', error)
      }
    },
    
    unhighlightMarkers() {
      const viewer = viewerRef.current
      const Cesium = cesiumRef.current
      if (!viewer || !Cesium) return
      
      try {
        if (selectedEntityRef.current) {
          const entity = selectedEntityRef.current as any
          
          // Restore original appearance
          if (entity?.point) {
            entity.point.pixelSize = 20
            entity.point.outlineWidth = 3
            // Restore original color based on place type
            const properties = entity.properties
            if (properties && properties.originalColor) {
              const color = properties.originalColor.getValue
                ? properties.originalColor.getValue()
                : properties.originalColor
              entity.point.color = Cesium.Color.fromCssColorString(color)
              entity.point.outlineColor = Cesium.Color.WHITE
            }
          }
          
          selectedEntityRef.current = null
        }
      } catch (error) {
        console.error('Error unhighlighting markers:', error)
      }
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
          // Enable camera controls
          if (viewer.scene.screenSpaceCameraController) {
            viewer.scene.screenSpaceCameraController.enableRotate = true
            viewer.scene.screenSpaceCameraController.enableTranslate = true
            viewer.scene.screenSpaceCameraController.enableZoom = true
            viewer.scene.screenSpaceCameraController.enableTilt = true
            viewer.scene.screenSpaceCameraController.enableLook = true
          }
          
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
                if (!viewer.scene?.pick || !movement.position) return
                
                try {
                  // Ensure position is valid before picking
                  if (movement.position.x !== undefined && movement.position.y !== undefined) {
                    const pickedObject = viewer.scene.pick(movement) as any
                    if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject?.id)) {
                    const entity = pickedObject.id
                      if (typeof entity === 'string') {
                        handleMarkerClick(entity)
                      } else if (entity && entity.id) {
                        handleMarkerClick(entity.id)
                      } else if (entity && entity.properties && entity.properties.placeId) {
                        const placeId = entity.properties.placeId.getValue
                          ? entity.properties.placeId.getValue()
                          : entity.properties.placeId
                        if (placeId) {
                          handleMarkerClick(placeId)
                        }
                      }
                    }
                  }
                } catch (error: unknown) {
                  // Silently handle pick errors - these can happen during camera movement
                  if (error instanceof Error && !error.message.includes('normalized result')) {
                    console.error('Error handling click:', error)
                  }
                }
              }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
            } catch (error) {
              console.error('Failed to setup click handler:', error)
            }
          }
        }

        const initLat = initialLocation?.lat ?? 37.7759
        const initLng = initialLocation?.lng ?? -122.4175
        const initAltitude = initialLocation?.altitude ?? 500  // Lower default altitude
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
      
      if (eventHandlerRef.current && (eventHandlerRef.current as any).destroy) {
        try {
          (eventHandlerRef.current as any).destroy()
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Dependencies intentionally omitted - we only want to initialize Cesium once on mount

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
