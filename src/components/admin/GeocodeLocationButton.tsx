'use client'

import React, { useState } from 'react'
import { useFormFields, useForm } from '@payloadcms/ui'
import { toast } from '@payloadcms/ui'

export default function GeocodeLocationButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { dispatchFields } = useForm()
  
  const formFields = useFormFields(([fields]) => {
    return {
      city: fields.city?.value || '',
      country: fields.country?.value || '',
      address: fields.address?.value || '',
    }
  })

  const handleGeocode = async () => {
    try {
      setIsLoading(true)
      
      // Construct search query from available fields
      const searchParts = []
      if (formFields.city) searchParts.push(formFields.city)
      if (formFields.country) searchParts.push(formFields.country)
      if (formFields.address) searchParts.push(formFields.address)
      
      const searchQuery = searchParts.join(', ')
      
      if (!searchQuery) {
        toast.error('Please enter a city, country, or address to geocode')
        return
      }

      // Call geocoding API
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Geocoding failed')
      }
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        
        // Update location fields
        dispatchFields({
          type: 'UPDATE',
          path: 'location',
          value: {
            type: 'Point',
            coordinates: [result.lng, result.lat]
          }
        })
        
        // Update other fields if available
        if (result.formatted_address) {
          dispatchFields({
            type: 'UPDATE',
            path: 'formattedAddress',
            value: result.formatted_address
          })
        }
        
        toast.success('Location geocoded successfully')
      } else {
        toast.error('No results found for the given location')
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to geocode location')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGeocode}
      disabled={isLoading}
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.6 : 1,
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      {isLoading ? 'Geocoding...' : 'Geocode Location'}
    </button>
  )
}