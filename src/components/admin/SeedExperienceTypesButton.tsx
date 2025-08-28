'use client'

import React, { useState } from 'react'
import { toast } from '@payloadcms/ui'

const defaultExperienceTypes = [
  { name: 'Adventure', icon: 'mountain', color: '#ff6b6b' },
  { name: 'Cultural', icon: 'cultural', color: '#4ecdc4' },
  { name: 'Wildlife', icon: 'wildlife', color: '#95e1d3' },
  { name: 'Beach', icon: 'beach', color: '#ffd93d' },
  { name: 'Food & Wine', icon: 'food-wine', color: '#f38181' },
  { name: 'Wellness', icon: 'wellness', color: '#aa96da' },
  { name: 'Luxury', icon: 'luxury', color: '#fcbad3' },
  { name: 'Photography', icon: 'photography', color: '#a8d8ea' },
  { name: 'History', icon: 'history', color: '#d4a574' },
  { name: 'Sports', icon: 'sports', color: '#83c9ff' },
]

export default function SeedExperienceTypesButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSeed = async () => {
    try {
      setIsLoading(true)
      
      // Call API to seed experience types
      const response = await fetch('/api/seed/experience-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ types: defaultExperienceTypes }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to seed experience types')
      }
      
      toast.success(`Successfully created ${data.created} experience types`)
      
      // Refresh the page to show new data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Seed error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to seed experience types')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={handleSeed}
        disabled={isLoading}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        {isLoading ? 'Seeding...' : 'Seed Default Experience Types'}
      </button>
      <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
        This will create default experience type categories if they don't already exist.
      </p>
    </div>
  )
}