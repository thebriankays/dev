'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Modal } from '@payloadcms/ui'
import { Button } from '../ui/button'
import { loadGoogleMaps } from '@/lib/google-maps/loader'
import regionToContinentMap from '@/utilities/continentMap'
import { getByCountryName } from '@/lib/countries/countriesUtils'
import './bulk-add.scss'


interface SelectedDestination {
  title: string
  city: string
  country: string
  continent: string
  lat: number
  lng: number
  placeId: string
  countryCode?: string
  currencyCode?: string
  languageCode?: string
  region?: string
  googleMapsUri?: string
  rating?: number
  priceLevel?: number
  tempCountryData?: {
    countryName?: string
    countryCode?: string
    currencyCode?: string
    languageCode?: string
    region?: string
  }
}

interface BulkAddModalProps {
  isOpen: boolean
  onClose: () => void
  collectionSlug?: string
}

// Type for Google Maps autocomplete predictions
type AutocompletePrediction = any // google.maps.places.AutocompletePrediction
type AutocompleteService = any // google.maps.places.AutocompleteService  
type PlacesService = any // google.maps.places.PlacesService

// Cache for autocomplete results
const autocompleteCache = new Map<string, AutocompletePrediction[]>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const BulkAddModal: React.FC<BulkAddModalProps> = ({ isOpen, onClose, collectionSlug = 'destinations' }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([])
  const [selectedDestinations, setSelectedDestinations] = useState<SelectedDestination[]>([])
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  const autocompleteServiceRef = useRef<AutocompleteService | null>(null)
  const placesServiceRef = useRef<PlacesService | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const cacheTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Load Google Maps
  useEffect(() => {
    if (!mapsLoaded) {
      loadGoogleMaps()
        .then(() => {
          setMapsLoaded(true)
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
          // Create a dummy div for PlacesService
          const mapDiv = document.createElement('div')
          placesServiceRef.current = new window.google.maps.places.PlacesService(mapDiv)
        })
        .catch((err) => setLoadError(err))
    }
  }, [mapsLoaded])

  // Debounced search
  const searchPlaces = useCallback((query: string) => {
    if (!autocompleteServiceRef.current || query.length < 2) {
      setPredictions([])
      return
    }

    // Check cache first
    const cacheKey = query.toLowerCase()
    const cached = autocompleteCache.get(cacheKey)
    if (cached) {
      setPredictions(cached)
      return
    }

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      autocompleteServiceRef.current?.getPlacePredictions(
        {
          input: query,
          types: ['(cities)'],
        },
        (results: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results)
            
            // Cache the results
            autocompleteCache.set(cacheKey, results)
            
            // Clear cache after TTL
            const existingTimer = cacheTimersRef.current.get(cacheKey)
            if (existingTimer) clearTimeout(existingTimer)
            
            const timer = setTimeout(() => {
              autocompleteCache.delete(cacheKey)
              cacheTimersRef.current.delete(cacheKey)
            }, CACHE_TTL)
            
            cacheTimersRef.current.set(cacheKey, timer)
          } else {
            setPredictions([])
          }
        }
      )
    }, 300) // 300ms debounce
  }, [])

  useEffect(() => {
    searchPlaces(searchInput)
  }, [searchInput, searchPlaces])

  // Handle place selection
  const selectPlace = useCallback(async (prediction: AutocompletePrediction) => {
    if (!placesServiceRef.current) return

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: [
          'formatted_address',
          'geometry',
          'place_id',
          'address_components',
          'name',
          'rating',
          'price_level',
          'url',
        ],
      },
      (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
          // Extract location components
          const countryComp = place.address_components?.find((c: any) =>
            c.types.includes('country')
          )
          const countryName = countryComp?.long_name ?? ''
          const countryCode = countryComp?.short_name ?? ''
          const staticData = getByCountryName(countryName)
          const continent = staticData ? regionToContinentMap[staticData.code] || staticData.region : ''

          const cityComp = place.address_components?.find((c: any) =>
            ['locality', 'administrative_area_level_3', 'administrative_area_level_2'].some(t => c.types.includes(t))
          )
          const city = cityComp ? cityComp.long_name : place.name ?? ''

          const destination: SelectedDestination = {
            title: `${city}, ${countryName}`,
            city,
            country: staticData ? staticData.label : countryName,
            continent,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: place.place_id ?? '',
            countryCode,
            currencyCode: staticData?.currency?.code,
            languageCode: staticData?.language?.code,
            region: staticData?.region,
            googleMapsUri: place.url,
            rating: place.rating,
            priceLevel: place.price_level,
            tempCountryData: staticData ? {
              countryName: staticData.label,
              countryCode: staticData.code,
              currencyCode: staticData.currency?.code,
              languageCode: staticData.language?.code || undefined,
              region: staticData.region,
            } : undefined,
          }

          // Add to selected destinations if not already present
          setSelectedDestinations(prev => {
            const exists = prev.some(d => d.placeId === destination.placeId)
            if (!exists) {
              return [...prev, destination]
            }
            return prev
          })

          // Clear search input
          setSearchInput('')
          setPredictions([])
        }
      }
    )
  }, [])

  // Remove destination from selection
  const removeDestination = useCallback((placeId: string) => {
    setSelectedDestinations(prev => prev.filter(d => d.placeId !== placeId))
  }, [])

  // Handle bulk add
  const handleBulkAdd = async () => {
    if (selectedDestinations.length === 0) return

    setIsProcessing(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`/api/${collectionSlug}/bulk-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinations: selectedDestinations.map(dest => ({
            title: dest.title,
            locationData: {
              address: dest.title,
              coordinates: {
                lat: dest.lat,
                lng: dest.lng,
              },
              placeID: dest.placeId,
              country: dest.country,
              continent: dest.continent,
              city: dest.city,
              rating: dest.rating ?? null,
              priceLevel: dest.priceLevel ?? null,
              tempCountryData: dest.tempCountryData,
            },
            city: dest.city,
            continent: dest.continent,
            lat: dest.lat,
            lng: dest.lng,
            googleMapsUri: dest.googleMapsUri,
          })),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccessMessage(`Successfully added ${result.created} destinations`)
        setSelectedDestinations([])
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose()
          window.location.reload() // Refresh to show new destinations
        }, 2000)
      } else {
        setErrorMessage(result.error || 'Failed to add destinations')
      }
    } catch (error) {
      console.error('Bulk add error:', error)
      setErrorMessage('An error occurred while adding destinations')
    } finally {
      setIsProcessing(false)
    }
  }

  if (loadError) return <div>Failed to load Google Maps API</div>

  return (
    <Modal slug="bulk-add-modal" className="bulk-add-modal">
      <div className="modal-content">
        <h2>Bulk Add Destinations</h2>
        <p>Search and select multiple destinations to add at once</p>

        {/* Search Input */}
        <div className="search-container">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search for cities..."
            className="search-input"
            disabled={!mapsLoaded || isProcessing}
          />
          
          {/* Autocomplete Results */}
          {predictions.length > 0 && (
            <div className="predictions-dropdown">
              {predictions.map((prediction) => (
                <div
                  key={prediction.place_id}
                  className="prediction-item"
                  onClick={() => selectPlace(prediction)}
                >
                  <span className="prediction-main">{prediction.structured_formatting.main_text}</span>
                  <span className="prediction-secondary">{prediction.structured_formatting.secondary_text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Destinations */}
        {selectedDestinations.length > 0 && (
          <div className="selected-destinations">
            <h3>Selected Destinations ({selectedDestinations.length})</h3>
            <div className="destinations-list">
              {selectedDestinations.map((dest) => (
                <div key={dest.placeId} className="destination-item">
                  <div className="destination-info">
                    <strong>{dest.city}</strong>, {dest.country} ({dest.continent})
                    <div className="destination-coords">
                      {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
                    </div>
                  </div>
                  <Button
                    onClick={() => removeDestination(dest.placeId)}
                    variant="secondary"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {successMessage && <div className="success-message">{successMessage}</div>}
        {errorMessage && <div className="error-message">{errorMessage}</div>}

        {/* Actions */}
        <div className="modal-actions">
          <Button onClick={onClose} variant="secondary" disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkAdd}
            disabled={isProcessing || selectedDestinations.length === 0}
          >
            {isProcessing ? 'Processing...' : `Add ${selectedDestinations.length} Destinations`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default BulkAddModal