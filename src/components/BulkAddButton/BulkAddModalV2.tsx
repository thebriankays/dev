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
  formattedAddress?: string | null
  googleMapsUri?: string | null
  rating?: number | null
  priceLevel?: number | null
  displayName?: string | null
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
  const [addedMessage, setAddedMessage] = useState('')
  
  const autocompleteRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null)
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

    const initAutocomplete = async () => {
      try {
        console.log('Creating PlaceAutocompleteElement...')
        
        // Create the PlaceAutocompleteElement
        const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement({
          types: ['(cities)']
        })
        
        // Append to container
        containerRef.current!.appendChild(placeAutocomplete)
        
        // The event is actually 'gmp-select' not 'gmp-placeselect'
        placeAutocomplete.addEventListener('gmp-select', async (event: any) => {
          console.log('gmp-select event fired!', event)
          
          // The place might be in different locations in the event
          console.log('Event structure:', {
            event,
            eventKeys: Object.keys(event),
            targetKeys: event.target ? Object.keys(event.target) : [],
            Dg: (event as any).Dg
          })
          
          // Try to get the place ID from the event - check all possible locations
          const place = (event as any).place || (event as any).Dg
          // The place ID is directly on the place object
          const placeId = place?.placeId || 
                         place?.id || 
                         place?.place_id || 
                         (event as any).placeId ||
                         (event as any).id
          
          console.log('Place data:', place)
          console.log('Place ID found:', placeId)
          
          if (!placeId) {
            console.error('No place ID found in event', { 
              event, 
              place,
              placePq: place?.Pq,
              placeKeys: place ? Object.keys(place) : [],
              pqKeys: place?.Pq ? Object.keys(place.Pq) : []
            })
            return
          }
          
          try {
            // Use modern Place API instead of deprecated PlacesService
            const { Place } = await window.google.maps.importLibrary("places") as google.maps.PlacesLibrary
            
            // Create a place request
            const placeRequest = {
              id: placeId,
              fields: ['displayName', 'formattedAddress', 'location', 'addressComponents', 'rating', 'priceLevel', 'googleMapsURI', 'id']
            }
            
            // Fetch the place details
            const place = new Place(placeRequest)
            await place.fetchFields(placeRequest.fields)
            
            console.log('Place details fetched:', place)
            
            // Convert modern Place object to PlaceResult format for compatibility
            const placeResult: google.maps.places.PlaceResult = {
              name: place.displayName || '',
              formatted_address: place.formattedAddress || '',
              geometry: place.location ? {
                location: new window.google.maps.LatLng(place.location.lat(), place.location.lng())
              } : undefined,
              address_components: place.addressComponents,
              rating: place.rating || undefined,
              price_level: place.priceLevel || undefined,
              url: place.googleMapsURI || undefined,
              place_id: place.id || placeId
            }
            
            // Process the place
            await handlePlaceFromAutocomplete(placeResult)
            
            // Clear the input
            const input = placeAutocomplete.querySelector('input')
            if (input) {
              input.value = ''
            }
          } catch (error) {
            console.error('Error processing place:', error)
            // If modern API fails, fall back to PlacesService
            console.log('Falling back to PlacesService...')
            
            try {
              const service = new window.google.maps.places.PlacesService(document.createElement('div'))
              
              service.getDetails({
                placeId: placeId,
                fields: ['name', 'formatted_address', 'geometry', 'address_components', 'rating', 'price_level', 'url', 'place_id']
              }, async (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                  console.log('Place details fetched (fallback):', place)
                  await handlePlaceFromAutocomplete(place)
                } else {
                  console.error('Failed to fetch place details:', status)
                  setErrorMessage('Failed to fetch place details')
                }
              })
              
              // Clear the input
              const input = placeAutocomplete.querySelector('input')
              if (input) {
                input.value = ''
              }
            } catch (fallbackError) {
              console.error('Fallback also failed:', fallbackError)
              setErrorMessage('Failed to process selected place')
            }
          }
        })
        
        // Remove these debug listeners since we found the correct event
        
        autocompleteRef.current = placeAutocomplete
        console.log('PlaceAutocompleteElement created and configured')
      } catch (error) {
        console.error('Error creating PlaceAutocompleteElement:', error)
        setLoadError(error as Error)
      }
    }
    
    initAutocomplete()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded])

  // Handle place from autocomplete
  const handlePlaceFromAutocomplete = useCallback((place: google.maps.places.PlaceResult) => {
    console.log('handlePlaceFromAutocomplete called with place:', place)

    try {

      // Extract location components
      const addressComponents = place.address_components || []
      
      const countryComp = addressComponents.find((c: google.maps.GeocoderAddressComponent) => 
        c.types.includes('country')
      )
      const countryName = countryComp?.long_name || ''
      const countryCode = countryComp?.short_name || ''
      
      const cityComp = addressComponents.find((c: google.maps.GeocoderAddressComponent) =>
        ['locality', 'administrative_area_level_3', 'administrative_area_level_2'].some(t => c.types.includes(t))
      )
      const city = cityComp?.long_name || place.name || ''
      
      // Determine continent based on country
      const continent = getContinent(countryCode)
      
      const destination: SelectedDestination = {
        title: place.name || `${city}, ${countryName}`,
        city,
        country: countryName,
        continent,
        lat: place.geometry?.location?.lat() || 0,
        lng: place.geometry?.location?.lng() || 0,
        placeId: place.place_id || '',
        countryCode,
        formattedAddress: place.formatted_address || null,
        googleMapsUri: place.url || null,
        rating: place.rating || null,
        priceLevel: place.price_level || null,
        displayName: place.name || null
      }

      // Add to selected destinations if not already present
      setSelectedDestinations(prev => {
        const exists = prev.some(d => d.placeId === destination.placeId)
        if (!exists) {
          // Show success message
          setAddedMessage(`Added "${destination.displayName || destination.city}" to the list`)
          setTimeout(() => setAddedMessage(''), 3000)
          return [...prev, destination]
        } else {
          // Show error if already exists
          setErrorMessage(`"${destination.displayName || destination.city}" is already in the list`)
          setTimeout(() => setErrorMessage(''), 3000)
        }
        return prev
      })
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
        <p>Search for cities below. Each selected city will be automatically added to your list.</p>

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

        {/* Added message */}
        {addedMessage && <div className="added-message">{addedMessage}</div>}

        {/* Selected Destinations */}
        {selectedDestinations.length > 0 ? (
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
        ) : (
          <div className="empty-state">
            <p>No destinations selected yet. Search for cities above to add them to your list.</p>
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