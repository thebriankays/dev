'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { usePlacesWidget } from 'react-google-autocomplete'
import { CesiumViewer, CesiumViewerHandle } from '@/components/CesiumViewer'
import { useDebounce } from '@/hooks/useDebounce'
import './area-explorer.scss'

// List of available place types for the user to select
const POI_TYPES = [
  { value: 'restaurant', label: 'Restaurants', icon: '🍴' },
  { value: 'cafe', label: 'Cafes', icon: '☕' },
  { value: 'park', label: 'Parks', icon: '🌳' },
  { value: 'museum', label: 'Museums', icon: '🏛️' },
  { value: 'lodging', label: 'Hotels', icon: '🏨' },
  { value: 'shopping_mall', label: 'Shopping', icon: '🛍️' },
  { value: 'tourist_attraction', label: 'Attractions', icon: '📸' },
  { value: 'bank', label: 'Banks', icon: '🏦' },
  { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { value: 'hospital', label: 'Hospital', icon: '🏥' },
  { value: 'gas_station', label: 'Gas Station', icon: '⛽' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
];

export function AreaExplorer() {
  const viewerRef = useRef<CesiumViewerHandle>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const [isMapReady, setMapReady] = useState(false);
  
  // Camera State
  const [orbitType, setOrbitType] = useState<'dynamic' | 'fixed'>('dynamic');
  const [cameraSpeed, setCameraSpeed] = useState(20);
  const debouncedSpeed = useDebounce(cameraSpeed, 100);
  const [isOrbiting, setIsOrbiting] = useState(false);

  // Places State
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedPois, setSelectedPois] = useState<string[]>([]);
  const [density, setDensity] = useState(50); // 0-100 scale
  const [radius, setRadius] = useState(2000); // meters
  const debouncedRadius = useDebounce(radius, 500);
  
  // Initialize Google Places Service
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && !placesServiceRef.current) {
      const mapDiv = document.createElement('div');
      placesServiceRef.current = new google.maps.places.PlacesService(mapDiv);
    }
  }, []);
  
  // Google Places Autocomplete Hook
  const { ref: placesRef } = usePlacesWidget<HTMLInputElement>({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    onPlaceSelected: (place) => {
      const location = place.geometry?.location;
      if (location && viewerRef.current?.isReady()) {
        const newLocation = { lat: location.lat(), lng: location.lng() };
        setSelectedLocation(newLocation);
        viewerRef.current.flyTo(newLocation);
      }
    },
    options: {
      types: ['(cities)'],
    }
  });

  // Effect to control camera orbit
  useEffect(() => {
    if (!isMapReady || !viewerRef.current?.isReady()) return;
    
    if (isOrbiting) {
      viewerRef.current.startOrbit(orbitType, debouncedSpeed);
    } else {
      viewerRef.current.stopOrbit();
    }
  }, [isMapReady, isOrbiting, orbitType, debouncedSpeed]);

  // Fetch and display places
  const fetchPlaces = useCallback(() => {
    if (!placesServiceRef.current || !selectedLocation || selectedPois.length === 0) {
      viewerRef.current?.clearMarkers();
      return;
    }

    // Clear existing markers
    viewerRef.current?.clearMarkers();

    // Calculate limit based on density
    const maxPlaces = Math.floor((density / 100) * 60); // Max 60 places at 100% density

    selectedPois.forEach((poiType) => {
      placesServiceRef.current?.nearbySearch({
        location: selectedLocation,
        radius: debouncedRadius,
        type: poiType as google.maps.places.PlaceType,
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Limit results based on density
          const limitedResults = results.slice(0, Math.ceil(maxPlaces / selectedPois.length));
          viewerRef.current?.addPlaceMarkers(limitedResults);
        }
      });
    });
  }, [selectedLocation, selectedPois, debouncedRadius, density]);

  // Effect to fetch places when parameters change
  useEffect(() => {
    if (isMapReady && selectedLocation && selectedPois.length > 0) {
      fetchPlaces();
    } else if (isMapReady) {
      viewerRef.current?.clearMarkers();
    }
  }, [isMapReady, selectedLocation, selectedPois, debouncedRadius, density, fetchPlaces]);

  const handlePoiToggle = (poiType: string) => {
    setSelectedPois(prev => 
      prev.includes(poiType)
        ? prev.filter(p => p !== poiType)
        : [...prev, poiType]
    );
  };

  const handleClearAll = () => {
    setSelectedPois([]);
    viewerRef.current?.clearMarkers();
  };

  return (
    <div className="area-explorer__container">
      <CesiumViewer ref={viewerRef} onLoad={() => setMapReady(true)} />

      <div className="area-explorer__controls">
        <div className="area-explorer__header">
          <h2>3D Area Explorer</h2>
          <p>Choose your location and select the place types you want to show in the surrounding.</p>
        </div>

        <div className="area-explorer__search-section">
          <input
            ref={placesRef}
            className="area-explorer__search-input"
            placeholder="🔍 Enter a location"
            disabled={!isMapReady}
          />
        </div>

        <div className="area-explorer__camera-section">
          <h3>Camera Settings</h3>
          
          <div className="area-explorer__camera-type">
            <span>Type:</span>
            <div className="area-explorer__radio-group">
              <label>
                <input 
                  type="radio" 
                  value="dynamic" 
                  checked={orbitType === 'dynamic'} 
                  onChange={() => setOrbitType('dynamic')} 
                  disabled={!isMapReady} 
                />
                <span>Dynamic orbit</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  value="fixed" 
                  checked={orbitType === 'fixed'} 
                  onChange={() => setOrbitType('fixed')} 
                  disabled={!isMapReady}
                />
                <span>Fixed orbit</span>
              </label>
            </div>
          </div>
          
          <div className="area-explorer__slider-group">
            <label className="area-explorer__slider-label">
              <span>Speed:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={cameraSpeed}
                onChange={(e) => setCameraSpeed(Number(e.target.value))}
                className="area-explorer__slider"
                disabled={!isMapReady}
              />
              <span className="area-explorer__slider-value">{cameraSpeed}</span>
            </label>
          </div>

          <button 
            onClick={() => setIsOrbiting(prev => !prev)}
            className={`area-explorer__orbit-btn ${isOrbiting ? 'active' : ''}`}
            disabled={!isMapReady}
          >
            {isOrbiting ? '⏸ Stop Auto-Rotate' : '▶ Start Auto-Rotate'}
          </button>
        </div>

        <div className="area-explorer__poi-section">
          <div className="area-explorer__poi-header">
            <h3>Place Types</h3>
            {selectedPois.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="area-explorer__clear-btn"
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="area-explorer__poi-filter">
            <span>Filter:</span>
          </div>
          
          <div className="area-explorer__poi-types">
            {POI_TYPES.map(poi => (
              <button 
                key={poi.value}
                onClick={() => handlePoiToggle(poi.value)}
                className={`area-explorer__poi-btn ${selectedPois.includes(poi.value) ? 'active' : ''}`}
                disabled={!selectedLocation || !isMapReady}
                title={poi.label}
              >
                <span className="area-explorer__poi-icon">{poi.icon}</span>
                <span className="area-explorer__poi-label">{poi.label}</span>
              </button>
            ))}
          </div>

          {selectedLocation && (
            <>
              <div className="area-explorer__slider-group">
                <label className="area-explorer__slider-label">
                  <span>Density</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={density}
                    onChange={(e) => setDensity(Number(e.target.value))}
                    className="area-explorer__slider area-explorer__slider--density"
                    disabled={!isMapReady || selectedPois.length === 0}
                  />
                  <div className="area-explorer__slider-markers">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </label>
              </div>

              <div className="area-explorer__slider-group">
                <label className="area-explorer__slider-label">
                  <span>Radius:</span>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="500"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="area-explorer__slider area-explorer__slider--radius"
                    disabled={!isMapReady || selectedPois.length === 0}
                  />
                  <div className="area-explorer__slider-markers">
                    <span>0.5 km</span>
                    <span>{(radius / 1000).toFixed(1)} km</span>
                    <span>5 km</span>
                  </div>
                </label>
              </div>
            </>
          )}
        </div>

        {selectedLocation && (
          <div className="area-explorer__status">
            <p>📍 {selectedPois.length} type{selectedPois.length !== 1 ? 's' : ''} selected</p>
            <p>📏 Searching within {(radius / 1000).toFixed(1)}km</p>
          </div>
        )}
      </div>
    </div>
  );
}
