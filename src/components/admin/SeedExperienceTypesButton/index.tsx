'use client'

import React, { useState } from 'react'
import { Button } from '@payloadcms/ui'
import { toast } from '@payloadcms/ui'

export const SeedExperienceTypesButton: React.FC = () => {
  const [loading, setLoading] = useState(false)

  const handleSeed = async () => {
    if (loading) return

    setLoading(true)

    try {
      const response = await fetch('/api/seed-experience-types', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        // Reload the page to show the new data
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        toast.error(result.message || 'Failed to seed experience types')
      }
    } catch (error) {
      console.error('Error seeding experience types:', error)
      toast.error('An error occurred while seeding experience types')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <Button
        onClick={handleSeed}
        disabled={loading}
        buttonStyle="primary"
        size="small"
      >
        {loading ? 'Seeding...' : 'Seed Experience Types'}
      </Button>
      <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
        This will create sample experience types for your travel agency.
      </p>
    </div>
  )
}

export default SeedExperienceTypesButton