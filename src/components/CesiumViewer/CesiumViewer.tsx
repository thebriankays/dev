'use client'

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

// Set Cesium base URL for assets
if (typeof window !== 'undefined' && !(window as any).CESIUM_BASE_URL) {
  (window as any).CESIUM_BASE_URL = '/cesium';
}

// Define the API that the parent component can call
export interface CesiumViewerHandle {
  flyTo: (location: { lat: number; lng: number }) => void;
  startOrbit: (type: 'dynamic' | 'fixed', speed: number) => void;
  stopOrbit: () => void;
  addPlaceMarker: (place: google.maps.places.PlaceResult) => void;
  clearMarkers: () => void;
}

interface CesiumViewerProps {
  onLoad?: () => void;
}

// Type definitions for Cesium (basic types to avoid any)
interface CesiumModule {
  Ion: {
    defaultAccessToken: string;
  };
  Viewer: new (container: HTMLElement, options?: Record<string, unknown>) => CesiumViewer;
  Cartesian3: {
    fromDegrees: (lng: number, lat: number, height?: number) => unknown;
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
  LabelStyle: {
    FILL_AND_OUTLINE: unknown;
  };
  createGooglePhotorealistic3DTileset: (options: { key: string }) => Promise<unknown>;
}

interface CesiumViewer {
  camera: {
    flyTo: (options: Record<string, unknown>) => void;
    setView: (options: Record<string, unknown>) => void;
    heading: number;
    pitch: number;
  };
  clock: {
    currentTime: { secondsOfDay: number };
    onTick: {
      addEventListener: (fn: () => void) => void;
      removeEventListener: (fn: () => void) => void;
    };
  };
  scene: {
    globe: {
      enableLighting: boolean;
    };
    primitives: {
      add: (primitive: unknown) => void;
    };
  };
  entities: {
    add: (entity: Record<string, unknown>) => unknown;
    remove: (entity: unknown) => void;
  };
  cesiumWidget?: {
    creditContainer?: HTMLElement;
  };
  destroy: () => void;
}

export const CesiumViewer = forwardRef<CesiumViewerHandle, CesiumViewerProps>(({ onLoad }, ref) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const orbitTickListener = useRef<(() => void) | null>(null);
  const placeEntities = useRef<unknown[]>([]);
  const cesiumRef = useRef<CesiumModule | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Expose the component's API to the parent via the ref
  useImperativeHandle(ref, () => ({
    flyTo(location) {
      const viewer = viewerRef.current;
      const Cesium = cesiumRef.current;
      if (!viewer || !Cesium) return;
      
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(location.lng, location.lat, 1000),
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: Cesium.Math.toRadians(-45.0),
        },
        duration: 2.5,
      });
    },
    startOrbit(type, speed) {
      this.stopOrbit();
      const viewer = viewerRef.current;
      const Cesium = cesiumRef.current;
      if (!viewer || !Cesium) return;

      const orbitSpeed = speed / 100;

      const tickFunction = () => {
        const heading = viewer.camera.heading + Cesium.Math.toRadians(orbitSpeed);
        let pitch = viewer.camera.pitch;
        
        if (type === 'dynamic') {
          const time = viewer.clock.currentTime.secondsOfDay;
          const sine = Math.sin(time * 0.1 * speed);
          pitch = Cesium.Math.toRadians(-45 + sine * 10);
        }
        
        viewer.camera.setView({
          orientation: { heading, pitch }
        });
      };
      
      viewer.clock.onTick.addEventListener(tickFunction);
      orbitTickListener.current = tickFunction;
    },
    stopOrbit() {
      const viewer = viewerRef.current;
      if (viewer && orbitTickListener.current) {
        viewer.clock.onTick.removeEventListener(orbitTickListener.current);
        orbitTickListener.current = null;
      }
    },
    addPlaceMarker(place) {
      const viewer = viewerRef.current;
      const Cesium = cesiumRef.current;
      const location = place.geometry?.location;
      if (!viewer || !location || !Cesium) return;

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(location.lng(), location.lat()),
        billboard: {
          image: place.icon || 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scale: 1.0,
          color: Cesium.Color.WHITE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        },
        label: {
          text: place.name,
          font: '14px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 8),
        },
      });
      placeEntities.current.push(entity);
    },
    clearMarkers() {
      const viewer = viewerRef.current;
      if (!viewer) return;
      placeEntities.current.forEach(entity => viewer.entities.remove(entity));
      placeEntities.current = [];
    }
  }));

  useEffect(() => {
    let isMounted = true;
    let viewer: CesiumViewer | null = null;

    const initCesium = async () => {
      if (!mapContainerRef.current) return;

      try {
        // Dynamically import Cesium
        const Cesium = await import('cesium') as unknown as CesiumModule;
        
        if (!isMounted) return;
        
        cesiumRef.current = Cesium;

        // Import CSS - wrap in try-catch as it may not be typed
        try {
          await import('cesium/Build/Cesium/Widgets/widgets.css' as string);
        } catch {
          // CSS import may fail in some environments, continue without it
          console.log('Cesium CSS not loaded, continuing with default styles');
        }

        // Set Ion token
        Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_API_KEY || 
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc3MzMsImlhdCI6MTYyNzg0NTE4Mn0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxk';
        
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        // Create viewer
        viewer = new Cesium.Viewer(mapContainerRef.current, {
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
        });

        viewerRef.current = viewer;

        // Remove Cesium logo if credit container exists
        const creditContainer = (viewer as CesiumViewer & { cesiumWidget?: { creditContainer?: HTMLElement } })
          ?.cesiumWidget?.creditContainer;
        if (creditContainer) {
          creditContainer.style.display = 'none';
        }

        // Configure scene
        viewer.scene.globe.enableLighting = true;

        // Try to load Google Photorealistic 3D Tiles if API key is available
        if (apiKey) {
          try {
            const tileset = await Cesium.createGooglePhotorealistic3DTileset({ 
              key: apiKey 
            });
            
            if (isMounted && viewer) {
              viewer.scene.primitives.add(tileset);
              console.log('Google 3D Tiles loaded');
            }
          } catch (_tileError) {
            console.warn('3D tiles not available, using default imagery');
          }
        } else {
          console.warn('Google Maps API key not found, using default Cesium imagery');
        }

        // Set initial position
        if (viewer && isMounted) {
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(-122.4175, 37.7759, 1500),
            orientation: {
              heading: 0,
              pitch: Cesium.Math.toRadians(-45),
              roll: 0
            }
          });
        }

        if (isMounted && onLoad) {
          onLoad();
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize 3D viewer';
        console.error('Cesium initialization error:', err);
        setError(errorMessage);
      }
    };

    initCesium();

    return () => {
      isMounted = false;
      if (viewer) {
        try {
          viewer.destroy();
        } catch (e) {
          console.warn('Error destroying viewer:', e);
        }
      }
      viewerRef.current = null;
      cesiumRef.current = null;
    };
  }, [onLoad]);

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        color: '#fff',
        flexDirection: 'column',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h3>Failed to load 3D viewer</h3>
        <p style={{ color: '#999', marginTop: '10px' }}>{error}</p>
        <p style={{ color: '#666', marginTop: '20px', fontSize: '14px' }}>
          Try refreshing the page or check your internet connection
        </p>
      </div>
    );
  }

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
