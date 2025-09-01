'use client'

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

// Cesium shares a global context, so we only need to set the API key once.
let cesiumApiKeySet = false;

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

export const CesiumViewer = forwardRef<CesiumViewerHandle, CesiumViewerProps>(({ onLoad }, ref) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const orbitTickListener = useRef<(() => void) | null>(null);
  const placeEntities = useRef<Cesium.Entity[]>([]);

  // Expose the component's API to the parent via the ref
  useImperativeHandle(ref, () => ({
    flyTo(location) {
      const viewer = viewerRef.current;
      if (!viewer) return;
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
      this.stopOrbit(); // Stop any existing orbit first
      const viewer = viewerRef.current;
      if (!viewer) return;

      const orbitSpeed = speed / 100; // Convert slider value to a usable speed

      const tickFunction = () => {
        const heading = viewer.camera.heading + Cesium.Math.toRadians(orbitSpeed);
        let pitch = viewer.camera.pitch;
        
        if (type === 'dynamic') {
          // Create a sine wave for smooth up-and-down motion
          const time = viewer.clock.currentTime.secondsOfDay;
          const sine = Math.sin(time * 0.1 * speed);
          pitch = Cesium.Math.toRadians(-45 + sine * 10); // Oscillate between -35 and -55 degrees
        }
        
        viewer.camera.setView({
          orientation: { heading, pitch }
        });
      };
      
      viewer.clock.onTick.addEventListener(tickFunction);
      orbitTickListener.current = tickFunction; // Store listener to remove it later
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
      const location = place.geometry?.location;
      if (!viewer || !location) return;

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
    const initCesium = async () => {
      if (!mapContainerRef.current || viewerRef.current) return;

      if (!cesiumApiKeySet) {
        Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5ZjBiZDY5Ny04M2M0LTRmNjktOGQxYy02NWE1YzY3N2U3NGIiLCJpZCI6MTE1NDgzLCJpYXQiOjE2NzA5NTI5ODh9.xJb_sqXA3Ey7nfZEBdZffBe6A3GpQ_2YQpZJKV1Kgaw';
        cesiumApiKeySet = true;
      }
      
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key is missing.');
        return;
      }

      const viewer = new Cesium.Viewer(mapContainerRef.current, {
        infoBox: false, 
        selectionIndicator: false, 
        shadows: true,
        shouldAnimate: true, 
        baseLayerPicker: false, 
        geocoder: false,
        homeButton: false, 
        sceneModePicker: false, 
        navigationHelpButton: false,
        animation: false, 
        timeline: false, 
        fullscreenButton: false,
      });
      viewerRef.current = viewer;

      try {
        const tileset = await Cesium.createGooglePhotorealistic3DTileset({ key: apiKey });
        viewer.scene.primitives.add(tileset);
      } catch (error) {
        console.error('Failed to load Google Photorealistic 3D Tileset:', error);
      }

      // Fly to a default location on load
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-122.4175, 37.7759, 1500),
        orientation: new Cesium.HeadingPitchRoll(0, Cesium.Math.toRadians(-45), 0),
        duration: 0,
      });

      if (isMounted && onLoad) {
        onLoad();
      }
    };

    initCesium();

    return () => {
      isMounted = false;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [onLoad]);

  return <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />;
});

CesiumViewer.displayName = 'CesiumViewer';
