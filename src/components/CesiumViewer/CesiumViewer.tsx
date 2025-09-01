'use client'

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'

// Type definitions for Cesium
interface CesiumViewer {
  camera: {
    flyTo: (options: Record<string, unknown>) => void;
    setView: (options: Record<string, unknown>) => void;
    heading: number;
    pitch: number;
    positionCartographic: {
      longitude: number;
      latitude: number;
      height: number;
    };
  };
  scene: {
    globe: {
      enableLighting: boolean;
    };
    primitives: {
      add: (primitive: unknown) => void;
    };
    debugShowFramesPerSecond: boolean;
  };
  entities: {
    add: (entity: Record<string, unknown>) => unknown;
    remove: (entity: unknown) => void;
  };
  imageryLayers: {
    removeAll: () => void;
    addImageryProvider: (provider: unknown) => void;
  };
  cesiumWidget?: {
    creditContainer?: HTMLElement;
  };
  destroy: () => void;
  isDestroyed: () => boolean;
}

interface CesiumModule {
  Ion: {
    defaultAccessToken?: string;
  };
  Viewer: new (container: HTMLElement, options?: Record<string, unknown>) => CesiumViewer;
  Cartesian3: {
    fromDegrees: (lng: number, lat: number, height?: number) => unknown;
    fromRadians: (lng: number, lat: number, height?: number) => unknown;
  };
  Cartesian2: new (x: number, y: number) => unknown;
  Math: {
    toRadians: (degrees: number) => number;
  };
  Color: {
    WHITE: unknown;
    BLACK: unknown;
  };
  VerticalOrigin: {
    BOTTOM: unknown;
    TOP: unknown;
  };
  HeightReference: {
    CLAMP_TO_GROUND: unknown;
  };
  LabelStyle: {
    FILL_AND_OUTLINE: unknown;
  };
  EllipsoidTerrainProvider: new () => unknown;
  OpenStreetMapImageryProvider: new (options: { url: string }) => unknown;
  createGooglePhotorealistic3DTileset: (options: { key: string }) => Promise<unknown>;
}

// Define the API that the parent component can call
export interface CesiumViewerHandle {
  flyTo: (location: { lat: number; lng: number }) => void;
  startOrbit: (type: 'dynamic' | 'fixed', speed: number) => void;
  stopOrbit: () => void;
  addPlaceMarkers: (places: google.maps.places.PlaceResult[]) => void;
  clearMarkers: () => void;
  isReady: () => boolean;
}

interface CesiumViewerProps {
  onLoad?: () => void;
}

export const CesiumViewer = forwardRef<CesiumViewerHandle, CesiumViewerProps>(({ onLoad }, ref) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const cesiumRef = useRef<CesiumModule | null>(null);
  const orbitAnimationRef = useRef<number | null>(null);
  const placeEntitiesRef = useRef<unknown[]>([]);
  const isInitializedRef = useRef(false);

  // Memoize onLoad callback to satisfy ESLint
  const handleLoad = useCallback(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  // Expose the component's API to the parent via the ref
  useImperativeHandle(ref, () => ({
    flyTo(location) {
      const viewer = viewerRef.current;
      const Cesium = cesiumRef.current;
      if (!viewer || !Cesium) return;
      
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(location.lng, location.lat, 1500),
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: Cesium.Math.toRadians(-45.0),
          roll: 0.0
        },
        duration: 2.5,
      });
    },
    
    startOrbit(type, speed) {
      this.stopOrbit();
      const viewer = viewerRef.current;
      const Cesium = cesiumRef.current;
      if (!viewer || !Cesium) return;

      const camera = viewer.camera;
      
      // Get the current camera target
      const center = camera.positionCartographic;
      const _centerCartesian = Cesium.Cartesian3.fromRadians(
        center.longitude,
        center.latitude,
        0
      );

      let lastTime = Date.now();
      const animate = () => {
        const currentTime = Date.now();
        const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
        lastTime = currentTime;

        // Calculate rotation angle based on speed
        const rotationAngle = Cesium.Math.toRadians(speed * 0.5 * deltaTime);
        
        // Get current camera position
        const currentHeading = camera.heading;
        let currentPitch = camera.pitch;
        
        // For dynamic orbit, vary the pitch
        if (type === 'dynamic') {
          const time = currentTime / 1000;
          const sine = Math.sin(time * 0.5);
          currentPitch = Cesium.Math.toRadians(-45 + sine * 15);
        }
        
        // Update camera
        camera.setView({
          orientation: {
            heading: currentHeading + rotationAngle,
            pitch: currentPitch,
            roll: 0
          }
        });

        orbitAnimationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    },
    
    stopOrbit() {
      if (orbitAnimationRef.current) {
        cancelAnimationFrame(orbitAnimationRef.current);
        orbitAnimationRef.current = null;
      }
    },
    
    addPlaceMarkers(places) {
      const viewer = viewerRef.current;
      const Cesium = cesiumRef.current;
      if (!viewer || !Cesium) return;

      // Clear existing markers first
      this.clearMarkers();

      places.forEach(place => {
        const location = place.geometry?.location;
        if (!location) return;

        const entity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(location.lng(), location.lat(), 10),
          billboard: {
            image: place.icon || 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scale: 0.8,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
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
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });
        
        placeEntitiesRef.current.push(entity);
      });
    },
    
    clearMarkers() {
      const viewer = viewerRef.current;
      if (!viewer) return;
      
      placeEntitiesRef.current.forEach(entity => {
        viewer.entities.remove(entity);
      });
      placeEntitiesRef.current = [];
    },
    
    isReady() {
      return isInitializedRef.current && viewerRef.current !== null;
    }
  }));

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) return;
    
    let isMounted = true;
    
    const initCesium = async () => {
      if (!mapContainerRef.current) return;

      try {
        // Dynamically import Cesium
        const Cesium = await import('cesium') as unknown as CesiumModule;
        
        if (!isMounted) return;
        
        cesiumRef.current = Cesium;

        // Import CSS - wrap in try-catch as it may fail in some environments
        try {
          await import('cesium/Build/Cesium/Widgets/widgets.css' as string);
        } catch {
          // CSS import may fail, continue without it
          console.log('Cesium CSS not loaded, using default styles');
        }

        // CRITICAL: Completely disable Cesium Ion to prevent 401 errors
        Cesium.Ion.defaultAccessToken = undefined;
        
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        // Create viewer with NO Cesium Ion dependencies
        const viewer = new Cesium.Viewer(mapContainerRef.current, {
          // Don't specify imageryProvider - will be added later
          terrainProvider: new Cesium.EllipsoidTerrainProvider(), // Flat earth, no Ion
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
          requestRenderMode: false, // Keep rendering active for smooth orbit
        });

        viewerRef.current = viewer;
        
        // Remove any default imagery layers
        viewer.imageryLayers.removeAll();
        
        // Hide Cesium logo
        const creditContainer = (viewer as CesiumViewer & { cesiumWidget?: { creditContainer?: HTMLElement } })
          ?.cesiumWidget?.creditContainer;
        if (creditContainer) {
          creditContainer.style.display = 'none';
        }

        // Configure scene
        viewer.scene.globe.enableLighting = false;
        viewer.scene.debugShowFramesPerSecond = false;

        // Add Google Photorealistic 3D Tiles if API key is available
        if (apiKey) {
          try {
            const tileset = await Cesium.createGooglePhotorealistic3DTileset({ 
              key: apiKey
            });
            
            viewer.scene.primitives.add(tileset);
            console.log('Google 3D Tiles loaded successfully');
          } catch (_tileError) {
            console.warn('3D tiles not available, using OpenStreetMap');
            // Add a basic imagery provider as fallback
            const osmProvider = new Cesium.OpenStreetMapImageryProvider({
              url: 'https://a.tile.openstreetmap.org/'
            });
            viewer.imageryLayers.addImageryProvider(osmProvider);
          }
        } else {
          // No API key, use OpenStreetMap
          const osmProvider = new Cesium.OpenStreetMapImageryProvider({
            url: 'https://a.tile.openstreetmap.org/'
          });
          viewer.imageryLayers.addImageryProvider(osmProvider);
        }

        // Set initial position
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(-122.4175, 37.7759, 1500),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-45),
            roll: 0
          }
        });

        isInitializedRef.current = true;
        
        if (isMounted) {
          handleLoad();
        }
      } catch (_error) {
        console.error('Cesium initialization error');
      }
    };

    initCesium();

    return () => {
      isMounted = false;
      if (orbitAnimationRef.current) {
        cancelAnimationFrame(orbitAnimationRef.current);
      }
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
      viewerRef.current = null;
      cesiumRef.current = null;
      isInitializedRef.current = false;
    };
  }, [handleLoad]); // Include handleLoad in dependencies

  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }} 
    />
  );
});

CesiumViewer.displayName = 'CesiumViewer';
