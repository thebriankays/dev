'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Modal } from '@payloadcms/ui'
import { Button } from '../ui/button'
import { loadGoogleMaps } from '@/lib/google-maps/loader'
import { getContinent } from '@/utilities/getContinent'
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
  formattedAddress?: string
  googleMapsUri?: string
  rating?: number
  priceLevel?: number
  displayName?: string
}

interface BulkAddModalProps {
  isOpen: boolean
  onClose: () => void
  collectionSlug?: string
}


export const BulkAddModalV2: React.FC<BulkAddModalProps> = ({ 
  isOpen, 
  onClose, 
  collectionSlug = 'destinations' 
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedDestinations, setSelectedDestinations] = useState<SelectedDestination[]>([])
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  const autocompleteRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load Google Maps
  useEffect(() => {
    if (!mapsLoaded && isOpen) {
      loadGoogleMaps()
        .then(async () => {
          // Import the places library
          await window.google.maps.importLibrary("places")
          setMapsLoaded(true)
        })
        .catch((err) => setLoadError(err))
    }
  }, [mapsLoaded, isOpen])

  // Initialize PlaceAutocompleteElement
  useEffect(() => {
    if (!mapsLoaded || !containerRef.current || autocompleteRef.current) return

    try {
      // Create the PlaceAutocompleteElement
      const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement({
        types: ['(cities)'],
      })
      
      placeAutocomplete.id = 'bulk-add-autocomplete'
      
      // Add custom styling
      placeAutocomplete.classList.add('bulk-add-autocomplete-input')
      
      // Append to container
      containerRef.current.appendChild(placeAutocomplete)
      
      // Add event listener for place selection
      placeAutocomplete.addEventListener('gmp-placeselect', handlePlaceSelect)
      
      autocompleteRef.current = placeAutocomplete
    } catch (error) {
      console.error('Error creating PlaceAutocompleteElement:', error)
      setLoadError(error as Error)
    }

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        autocompleteRef.current.removeEventListener('gmp-placeselect', handlePlaceSelect)
      }
    }
  }, [mapsLoaded])

  // Handle place selection from autocomplete
  const handlePlaceSelect = useCallback(async (event: any) => {
    const { placePrediction } = event
    if (!placePrediction) return

    try {
      // Convert prediction to place and fetch details
      const place = placePrediction.toPlace()
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'addressComponents', 'rating', 'priceLevel', 'googleMapsUri', 'id']
      })

      // Extract location components
      const addressComponents = place.addressComponents || []
      
      const countryComp = addressComponents.find((c: any) => 
        c.types.includes('country')
      )
      const countryName = countryComp?.longName || ''
      const countryCode = countryComp?.shortName || ''
      
      const cityComp = addressComponents.find((c: any) =>
        ['locality', 'administrative_area_level_3', 'administrative_area_level_2'].some(t => c.types.includes(t))
      )
      const city = cityComp?.longName || place.displayName || ''
      
      // Determine continent based on country
      const continent = getContinent(countryCode)
      
      const destination: SelectedDestination = {
        title: place.displayName || `${city}, ${countryName}`,
        city,
        country: countryName,
        continent,
        lat: place.location?.lat() || 0,
        lng: place.location?.lng() || 0,
        placeId: place.id || '',
        countryCode,
        formattedAddress: place.formattedAddress,
        googleMapsUri: place.googleMapsUri,
        rating: place.rating,
        priceLevel: place.priceLevel,
        displayName: place.displayName
      }

      // Add to selected destinations if not already present
      setSelectedDestinations(prev => {
        const exists = prev.some(d => d.placeId === destination.placeId)
        if (!exists) {
          return [...prev, destination]
        }
        return prev
      })

      // Clear the input
      if (autocompleteRef.current) {
        autocompleteRef.current.value = ''
      }
    } catch (error) {
      console.error('Error processing place selection:', error)
      setErrorMessage('Failed to process selected place')
    }
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
              address: dest.formattedAddress || dest.title,
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
              tempCountryData: {
                countryCode: dest.countryCode,
              },
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
          window.location.reload()
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

  if (loadError) {
    return (
      <Modal slug="bulk-add-modal" className="bulk-add-modal">
        <div className="modal-content">
          <h2>Error</h2>
          <p className="error-message">Failed to load Google Maps API: {loadError.message}</p>
          <div className="modal-actions">
            <Button onClick={onClose} variant="secondary">Close</Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal slug="bulk-add-modal" className="bulk-add-modal">
      <div className="modal-content">
        <h2>Bulk Add Destinations</h2>
        <p>Search and select multiple cities to add at once</p>

        {/* Autocomplete Container */}
        <div className="autocomplete-container" ref={containerRef}>
          {!mapsLoaded && (
            <input
              type="text"
              placeholder="Loading Google Places..."
              className="search-input"
              disabled
            />
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
                    <strong>{dest.displayName || dest.city}</strong>
                    {dest.country && dest.country !== dest.city && (
                      <span>, {dest.country}</span>
                    )}
                    <div className="destination-details">
                      <span className="continent-tag">{dest.continent}</span>
                      <span className="destination-coords">
                        {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
                      </span>
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

export default BulkAddModalV2