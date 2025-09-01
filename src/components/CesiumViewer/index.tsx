'use client'

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import '@/styles/cesium.css'
import './cesium-viewer.scss'

// Extend window type
declare global {
  interface Window {
    Cesium: any;
    CESIUM_BASE_URL: string;
  }
}

// Dynamically load Cesium to avoid build issues
let Cesium: any = null;

// Set Cesium's base URL for assets
if (typeof window !== 'undefined') {
  window.CESIUM_BASE_URL = 'https://cesium.com/downloads/cesiumjs/releases/1.132/Build/Cesium';
}

// Function to load Cesium from CDN
const loadCesiumFromCDN = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Cannot load Cesium on server side'));
      return;
    }
    
    // Check if already loaded
    if (window.Cesium) {
      Cesium = window.Cesium;
      resolve();
      return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.132/Build/Cesium/Cesium.js';
    script.async = true;
    
    script.onload = () => {
      Cesium = window.Cesium;
      resolve();
    };
    
    script.onerror = (error) => {
      reject(new Error('Failed to load Cesium from CDN'));
    };
    
    document.head.appendChild(script);
  });
};

interface CesiumViewerProps {
  onViewerReady?: (viewer: Cesium.Viewer) => void
  initialLocation?: {
    lat: number
    lng: number
    altitude?: number
    heading?: number
    pitch?: number
    roll?: number
  }
}

export interface CesiumViewerRef {
  viewer: Cesium.Viewer | null
  flyTo: (location: {
    lat: number
    lng: number
    altitude?: number
    heading?: number
    pitch?: number
    duration?: number
  }) => void
}

export const CesiumViewer = forwardRef<CesiumViewerRef, CesiumViewerProps>(
  ({ onViewerReady, initialLocation }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewerRef = useRef<Cesium.Viewer | null>(null)
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
    const [errorMessage, setErrorMessage] = useState<string>('')

    // Expose methods to parent components
    useImperativeHandle(ref, () => ({
      viewer: viewerRef.current,
      flyTo: (location) => {
        if (!viewerRef.current || !Cesium) return
        
        viewerRef.current.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            location.lng,
            location.lat,
            location.altitude || 1500
          ),
          orientation: {
            heading: Cesium.Math.toRadians(location.heading || 0),
            pitch: Cesium.Math.toRadians(location.pitch || -45),
            roll: 0.0
          },
          duration: location.duration || 2,
          easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT
        })
      }
    }))

    useEffect(() => {
      let viewer: Cesium.Viewer | null = null
      let mounted = true

      const initCesium = async () => {
        if (!containerRef.current || !mounted) return

        try {
          // Load Cesium from CDN if not already loaded
          if (!Cesium) {
            await loadCesiumFromCDN();
          }
          
          // Get Google Maps API key
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          if (!apiKey) {
            throw new Error('Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.')
          }

          // Create the Cesium viewer with minimal UI
          viewer = new Cesium.Viewer(containerRef.current, {
            animation: false,
            baseLayerPicker: false,
            fullscreenButton: false,
            vrButton: false,
            geocoder: false,
            homeButton: false,
            infoBox: false,
            sceneModePicker: false,
            selectionIndicator: false,
            timeline: false,
            navigationHelpButton: false,
            creditContainer: document.createElement('div'), // Hide credits
            scene3DOnly: true,
            skyBox: false,
            skyAtmosphere: false,
          })

          // Hide Cesium logo
          const viewerWithWidget = viewer as unknown as { _cesiumWidget?: { creditContainer?: HTMLElement } };
          const creditContainer = viewerWithWidget._cesiumWidget?.creditContainer;
          if (creditContainer) {
            creditContainer.style.display = 'none'
          }

          // Set up the scene
          if (viewer) {
            viewer.scene.globe.enableLighting = true
            viewer.scene.globe.depthTestAgainstTerrain = true
          }
          
          // Add Google Photorealistic 3D Tiles
          try {
            const tileset = await Cesium.createGooglePhotorealistic3DTileset({
              key: apiKey
            })
            if (viewer) {
              viewer.scene.primitives.add(tileset)
            }
            console.log('Google Photorealistic 3D Tiles loaded successfully')
          } catch (tileError) {
            console.error('Failed to load 3D tiles:', tileError)
            // Continue without 3D tiles - will show terrain instead
          }

          // Set initial camera position
          const defaultLocation = initialLocation || { lat: 37.7749, lng: -122.4194, altitude: 1500 }
          if (viewer) {
            viewer.camera.setView({
              destination: Cesium.Cartesian3.fromDegrees(
                defaultLocation.lng,
                defaultLocation.lat,
                defaultLocation.altitude || 1500
              ),
              orientation: {
                heading: Cesium.Math.toRadians(defaultLocation.heading || 0),
                pitch: Cesium.Math.toRadians(defaultLocation.pitch || -45),
                roll: 0.0
              }
            })
          }

          viewerRef.current = viewer

          if (mounted && viewer) {
            setStatus('ready')
            if (onViewerReady) {
              onViewerReady(viewer)
            }
          }
        } catch (error) {
          console.error('Failed to initialize Cesium viewer:', error)
          setErrorMessage(error instanceof Error ? error.message : 'Unknown error')
          if (mounted) {
            setStatus('error')
          }
        }
      }

      // Only initialize on client side
      if (typeof window !== 'undefined') {
        initCesium()
      }

      return () => {
        mounted = false
        if (viewer) {
          viewer.destroy()
        }
      }
    }, [initialLocation, onViewerReady])

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div ref={containerRef} style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%'
        }} />
        
        {status === 'loading' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            fontSize: '1.5rem',
            zIndex: 10
          }}>
            Loading Photorealistic 3D Map...
          </div>
        )}
        
        {status === 'error' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            fontSize: '1.2rem',
            padding: '20px',
            zIndex: 10
          }}>
            <div>Failed to load map</div>
            <div style={{ fontSize: '0.9rem', marginTop: '10px', opacity: 0.8 }}>
              {errorMessage}
            </div>
          </div>
        )}
      </div>
    )
  }
)

CesiumViewer.displayName = 'CesiumViewer'
