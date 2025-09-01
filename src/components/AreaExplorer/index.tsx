'use client'

import React, { useState, useRef, useEffect } from 'react'
import { usePlacesWidget } from 'react-google-autocomplete'
import { CesiumViewer, CesiumViewerHandle } from '@/components/CesiumViewer'
import { useDebounce } from '@/hooks/useDebounce'
import './area-explorer.scss'

// List of available place types for the user to select
const POI_TYPES = [
  'restaurant', 'cafe', 'park', 'museum', 'lodging', 'store', 'tourist_attraction'
];

export function AreaExplorer() {
  const viewerRef = useRef<CesiumViewerHandle>(null);
  const [isMapReady, setMapReady] = useState(false);
  
  // Camera State
  const [orbitType, setOrbitType] = useState<'dynamic' | 'fixed'>('dynamic');
  const [cameraSpeed, setCameraSpeed] = useState(50);
  const debouncedSpeed = useDebounce(cameraSpeed, 200);
  const [isOrbiting, setIsOrbiting] = useState(false);

  // Places State
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedPois, setSelectedPois] = useState<string[]>([]);
  
  // Google Places Autocomplete Hook
  const { ref: placesRef } = usePlacesWidget<HTMLInputElement>({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    onPlaceSelected: (place: any) => {
      const location = place.geometry?.location;
      if (location) {
        const newLocation = { lat: location.lat(), lng: location.lng() };
        setSelectedLocation(newLocation);
        viewerRef.current?.flyTo(newLocation);
      }
    },
    options: {
      types: ['(cities)'],
    }
  });

  // Effect to control camera orbit
  useEffect(() => {
    if (isMapReady && isOrbiting) {
      viewerRef.current?.startOrbit(orbitType, debouncedSpeed);
    } else {
      viewerRef.current?.stopOrbit();
    }
  }, [isMapReady, isOrbiting, orbitType, debouncedSpeed]);

  // Effect to fetch and display places when POIs or location change
  useEffect(() => {
    if (!isMapReady || !selectedLocation || selectedPois.length === 0) {
      viewerRef.current?.clearMarkers();
      return;
    }

    // Use a dummy div to access the Google Places service
    const mapDiv = document.createElement('div');
    const placesService = new google.maps.places.PlacesService(mapDiv);

    viewerRef.current?.clearMarkers();

    placesService.nearbySearch({
      location: selectedLocation,
      radius: 2000, // 2km radius
      type: selectedPois[0] || 'restaurant', // Google Places API expects a single type, not an array
    }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        results.forEach(place => {
          viewerRef.current?.addPlaceMarker(place);
        });
      }
    });

  }, [isMapReady, selectedLocation, selectedPois]);


  const handlePoiToggle = (poiType: string) => {
    setSelectedPois(prev => 
      prev.includes(poiType)
        ? prev.filter(p => p !== poiType)
        : [...prev, poiType]
    );
  };

  return (
    <div className="area-explorer__container">
      <CesiumViewer ref={viewerRef} onLoad={() => setMapReady(true)} />

      <div className="area-explorer__controls">
        <div className="area-explorer__search-section">
          <h3>Choose Location</h3>
          <input
            ref={placesRef}
            className="area-explorer__search-input"
            placeholder="Enter a city or location"
          />
        </div>

        <div className="area-explorer__camera-section">
          <h3>Camera Settings</h3>
          <div className="area-explorer__orbit-toggle">
            <button 
              onClick={() => setIsOrbiting(prev => !prev)}
              className={`area-explorer__play-btn ${isOrbiting ? 'active' : ''}`}
            >
              {isOrbiting ? 'Stop Orbit' : 'Start Auto-Orbit'}
            </button>
          </div>

          <div className="area-explorer__radio-group">
            <label>
              <input type="radio" value="dynamic" checked={orbitType === 'dynamic'} onChange={() => setOrbitType('dynamic')} />
              Dynamic Orbit
            </label>
            <label>
              <input type="radio" value="fixed" checked={orbitType === 'fixed'} onChange={() => setOrbitType('fixed')} />
              Fixed Orbit
            </label>
          </div>
          
          <label className="area-explorer__slider-label">Speed</label>
          <input
            type="range"
            min="1"
            max="100"
            value={cameraSpeed}
            onChange={(e) => setCameraSpeed(Number(e.target.value))}
            className="area-explorer__slider"
          />
        </div>

        <div className="area-explorer__poi-section">
          <h3>Place Types</h3>
          <div className="area-explorer__poi-types">
            {POI_TYPES.map(poi => (
              <button 
                key={poi}
                onClick={() => handlePoiToggle(poi)}
                className={`area-explorer__poi-btn ${selectedPois.includes(poi) ? 'active' : ''}`}
              >
                {poi.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
