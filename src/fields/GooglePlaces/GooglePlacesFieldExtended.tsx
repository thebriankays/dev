/* -------------------------------------------------------------------------- */
/* GooglePlacesFieldExtended – Using Google Maps Extended Component Library   */
/* -------------------------------------------------------------------------- */

'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useField, useAllFormFields } from '@payloadcms/ui'
import regionToContinentMap from '@/utilities/continentMap'
import { getByCountryName } from '@/lib/countries/countriesUtils'
import Image from 'next/image'
import { loadGoogleMaps } from '@/lib/google-maps/loader'

// Don't import Extended Components at the top level - will load dynamically
let ExtendedComponentsLoaded = false

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type Coordinates = { lat: number; lng: number }

export type LocationDataValue = {
  address?: string
  coordinates?: Coordinates | null
  placeID?: string
  country?: string
  continent?: string
  city?: string
  isGoodForChildren?: boolean | null
  isGoodForGroups?: boolean | null
  priceLevel?: number | null
  rating?: number | null
  user_ratings_total?: number | null
  reviews?: Array<{
    author_name: string
    rating: number
    text: string
    language?: string
    profile_photo_url?: string
    relative_time_description?: string
    time?: number
  }> | null
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
    html_attributions: string[]
  }>
  mediaGallery?: string[]
  tempCountryData?: {
    countryName?: string
    countryCode?: string
    currencyCode?: string
    languageCode?: string
    region?: string
  }
}

type Props = {
  path: string
  label?: string
  required?: boolean
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function GooglePlacesFieldExtended({
  path,
  label = 'Location',
  required = false,
}: Props) {
  /* ---------- form/context hooks -------------------------------- */
  const { value, setValue } = useField<LocationDataValue>({ path })
  const [_allFields, dispatch] = useAllFormFields()
  const [showPreview, setShowPreview] = useState(false)
  const placePickerRef = useRef<any>(null)
  const [isApiLoaded, setIsApiLoaded] = useState(false)
  const [componentsLoaded, setComponentsLoaded] = useState(false)

  /* ---------- Load Google Maps API and Extended Components ------ */
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if API is already loaded
    if (window.google?.maps?.places) {
      setIsApiLoaded(true)
      
      // Load Extended Components only on client side
      if (!ExtendedComponentsLoaded && !componentsLoaded) {
        // Load via script tags instead
        const loadScript = (src: string) => {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = src
            script.type = 'module'
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }
        
        Promise.all([
          loadScript('https://unpkg.com/@googlemaps/extended-component-library@0.6.11/api_loader.js'),
          loadScript('https://unpkg.com/@googlemaps/extended-component-library@0.6.11/place_picker.js'),
          loadScript('https://unpkg.com/@googlemaps/extended-component-library@0.6.11/place_overview.js')
        ]).then(() => {
          ExtendedComponentsLoaded = true
          setComponentsLoaded(true)
        }).catch(err => {
          console.error('Failed to load Extended Components:', err)
        })
      }
      return
    }

    // Use our existing loader to ensure consistency
    loadGoogleMaps().then(() => {
      setIsApiLoaded(true)
      
      // Load Extended Components after API is ready
      if (!ExtendedComponentsLoaded && !componentsLoaded) {
        const loadScript = (src: string) => {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = src
            script.type = 'module'
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }
        
        Promise.all([
          loadScript('https://unpkg.com/@googlemaps/extended-component-library@0.6.11/api_loader.js'),
          loadScript('https://unpkg.com/@googlemaps/extended-component-library@0.6.11/place_picker.js'),
          loadScript('https://unpkg.com/@googlemaps/extended-component-library@0.6.11/place_overview.js')
        ]).then(() => {
          ExtendedComponentsLoaded = true
          setComponentsLoaded(true)
        }).catch(err => {
          console.error('Failed to load Extended Components:', err)
        })
      }
    }).catch((err) => {
      console.error('Failed to load Google Maps:', err)
    })
  }, [componentsLoaded])

  /* ---------- helper: upload photo through Next proxy ----------- */
  const uploadImageFromPhotoReference = useCallback(
    async (photoRef: string): Promise<string> => {
      try {
        const res = await fetch(
          `/api/google-places/photo?photo_reference=${encodeURIComponent(
            photoRef,
          )}&maxwidth=800&maxheight=600`,
        )
        const json = await res.json()
        return json.success && json.id ? (json.id as string) : ''
      } catch (err) {
        console.error('upload image error', err)
        return ''
      }
    },
    [],
  )

  /* ---------- Handle place selection ---------------------------- */
  const handlePlaceChange = useCallback(async (event: any) => {
    const place = event.target.value
    if (!place || !place.location) return

    console.log('Place selected:', place)

    // Extract location details
    const lat = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat
    const lng = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng

    // Get address components
    const countryComp = place.addressComponents?.find((c: any) =>
      c.types.includes('country'),
    )
    const countryName = countryComp?.longText || countryComp?.long_name || ''
    const staticData = getByCountryName(countryName)
    const continent =
      staticData ? regionToContinentMap[staticData.code] || staticData.region : ''

    const cityComp = place.addressComponents?.find((c: any) =>
      ['locality',
       'administrative_area_level_3',
       'administrative_area_level_2'].some(t => c.types.includes(t)),
    )
    const city = cityComp ? (cityComp.longText || cityComp.long_name) : (place.displayName || '')

    /* main value -------------------------------------------------- */
    const nextVal: LocationDataValue = {
      address: place.formattedAddress || '',
      coordinates: { lat, lng },
      placeID: place.id || '',
      country: staticData ? staticData.label : countryName,
      continent,
      city,
      priceLevel: place.priceLevel || null,
      rating: place.rating || null,
      user_ratings_total: place.userRatingCount || null,
      reviews: place.reviews || null,
      photos: place.photos?.map((p: any) => ({
        photo_reference: p.photo_reference || '',
        height: p.height || 0,
        width: p.width || 0,
        html_attributions: p.html_attributions || [],
      })),
      tempCountryData: staticData ? {
        countryName: staticData.label,
        countryCode: staticData.code,
        currencyCode: staticData.currency?.code,
        languageCode: staticData.language?.code || undefined,
        region: staticData.region,
      } : undefined,
    }

    setValue(nextVal)
    
    // Dispatch custom event for BulkAddModal (if needed)
    try {
      const updateEvent = new CustomEvent('payload-field-update', {
        detail: { path: 'locationData', value: nextVal },
        bubbles: false,
        cancelable: true
      });
      window.dispatchEvent(updateEvent);
    } catch (e) {
      console.error('Error dispatching custom event:', e)
    }

    /* mirror to flat fields -------------------------------------- */
    dispatch({ type: 'UPDATE', path: 'continent', value: continent })
    dispatch({ type: 'UPDATE', path: 'city', value: city })

    /* set title nicely */
    const titleVal =
      city && (staticData ? staticData.label : countryName)
        ? `${city}, ${staticData ? staticData.label : countryName}`
        : ''
    dispatch({ type: 'UPDATE', path: 'title', value: titleVal })

    /* optional media upload -------------------------------------- */
    if (nextVal.photos?.length && nextVal.photos[0]?.photo_reference) {
      const ids = await Promise.all(
        nextVal.photos.map(ph =>
          ph.photo_reference
            ? uploadImageFromPhotoReference(ph.photo_reference)
            : '',
        ),
      )
      const ok = ids.filter(Boolean)
      if (ok.length) {
        setValue((v: LocationDataValue) => ({ ...v, mediaGallery: ok }))
        dispatch({ type: 'UPDATE', path: 'mediaGallery', value: ok })
      }
    }
  }, [setValue, dispatch, uploadImageFromPhotoReference])

  /* ---------- Reset handler for field --------------------------- */
  useEffect(() => {
    const handleResetField = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.path === path) {
        setValue(undefined)
        if (placePickerRef.current) {
          placePickerRef.current.value = null
        }
      }
    }
    
    window.addEventListener('payload-reset-field', handleResetField)
    
    return () => {
      window.removeEventListener('payload-reset-field', handleResetField)
    }
  }, [path, setValue])

  // Don't render Extended Components until they're loaded
  if (!componentsLoaded) {
    return (
      <div className="google-places-field-extended">
        <label className="google-places-field-extended__label">
          {label}
          {required && ' *'}
        </label>
        <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
          Loading Google Places...
        </div>
      </div>
    )
  }

  /* ---------- JSX ----------------------------------------------- */
  return (
    <div className="google-places-field-extended">
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Theme the Extended Components */
        :root {
          --gmpx-color-surface: #ffffff;
          --gmpx-color-on-surface: #212121;
          --gmpx-color-on-surface-variant: #757575;
          --gmpx-color-primary: #1976d2;
          --gmpx-color-on-primary: #ffffff;
          --gmpx-font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --gmpx-font-size-base: 14px;
          --gmpx-border-radius: 4px;
        }

        .google-places-field-extended {
          margin-bottom: 20px;
        }

        .google-places-field-extended__label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: var(--theme-text);
        }

        .google-places-field-extended__picker {
          width: 100%;
          min-height: 38px;
          border: 1px solid var(--theme-elevation-150);
          border-radius: 4px;
          background: var(--theme-elevation-0);
          padding: 8px 12px;
        }

        .google-places-field-extended__details {
          margin-top: 16px;
          padding: 16px;
          background: var(--theme-elevation-50);
          border-radius: 4px;
        }

        .google-places-field-extended__detail-row {
          margin-bottom: 8px;
          font-size: 14px;
        }

        .google-places-field-extended__preview-button {
          margin-top: 12px;
          padding: 8px 16px;
          background: var(--theme-success-500);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .google-places-field-extended__preview-button:hover {
          background: var(--theme-success-600);
        }

        .google-places-field-extended__preview {
          margin-top: 16px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        gmpx-place-overview {
          width: 100%;
        }
        `
      }} />

      {/* API Loader - only render if API isn't already loaded */}
      {!isApiLoaded && (
        // @ts-ignore
        <gmpx-api-loader 
          key={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
          solution-channel="GMP_extended_component_library_v0"
        />
      )}

      <label htmlFor={path} className="google-places-field-extended__label">
        {label}
        {required && ' *'}
      </label>

      {/* Place Picker */}
      {/* @ts-ignore */}
      <gmpx-place-picker
        ref={placePickerRef}
        id={path}
        className="google-places-field-extended__picker"
        placeholder="Search for a location"
        type="(cities)"
        onchange={handlePlaceChange}
      />

      {/* Display selected location details */}
      {value && (
        <div className="google-places-field-extended__details">
          {value.address && (
            <div className="google-places-field-extended__detail-row">
              <strong>Address:</strong> {value.address}
            </div>
          )}
          {value.coordinates && (
            <div className="google-places-field-extended__detail-row">
              <strong>Coordinates:</strong>{' '}
              {value.coordinates.lat.toFixed(6)}, {value.coordinates.lng.toFixed(6)}
            </div>
          )}
          {value.country && (
            <div className="google-places-field-extended__detail-row">
              <strong>Country:</strong> {value.country}
            </div>
          )}
          {value.continent && (
            <div className="google-places-field-extended__detail-row">
              <strong>Continent:</strong> {value.continent}
            </div>
          )}
          {value.city && (
            <div className="google-places-field-extended__detail-row">
              <strong>City:</strong> {value.city}
            </div>
          )}
          {value.rating !== null && (
            <div className="google-places-field-extended__detail-row">
              <strong>Rating:</strong> {value.rating} ⭐
            </div>
          )}
          {value.user_ratings_total !== null && (
            <div className="google-places-field-extended__detail-row">
              <strong>Reviews:</strong> {value.user_ratings_total}
            </div>
          )}
          
          {/* Media Gallery */}
          {value.mediaGallery?.length ? (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '12px' }}>
              {value.mediaGallery.map(id => (
                <div key={id} style={{ position: 'relative', width: 150, height: 150 }}>
                  <Image
                    src={`/api/media/${id}?thumbnail=true`}
                    alt="uploaded"
                    fill
                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                  />
                </div>
              ))}
            </div>
          ) : null}

          {/* Place Overview Preview */}
          {value.placeID && (
            <>
              <button
                className="google-places-field-extended__preview-button"
                onClick={() => setShowPreview(!showPreview)}
                type="button"
              >
                {showPreview ? 'Hide' : 'Show'} Place Details
              </button>
              
              {showPreview && (
                <div className="google-places-field-extended__preview">
                  {/* @ts-ignore */}
                  <gmpx-place-overview
                    place={value.placeID}
                    size="large"
                    google-logo-already-displayed
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}