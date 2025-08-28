'use client'

import React, { useState } from 'react'
import { useModal, toast } from '@payloadcms/ui'
import { Button } from '../ui/button'

export const CurrencyAdmin: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false)
  const { toggleModal } = useModal()

  const handleUpdateExchangeRates = async () => {
    setIsUpdating(true)
    
    try {
      const response = await fetch('/api/currencies/update-rates', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to update exchange rates')
      }
      
      const result = await response.json()
      
      toast.success(`Successfully updated ${result.updated || 0} exchange rates`)
    } catch (error) {
      console.error('Error updating exchange rates:', error)
      toast.error('Failed to update exchange rates')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>Currency Management</h3>
        <Button
          onClick={handleUpdateExchangeRates}
          disabled={isUpdating}
          size="sm"
          className={isUpdating ? 'btn--disabled' : ''}
        >
          {isUpdating ? 'Updating...' : 'Update Exchange Rates'}
        </Button>
        <Button
          onClick={() => {
            // You can add a modal for bulk import here
            toast.info('Bulk import feature coming soon')
          }}
          size="sm"
          variant="secondary"
        >
          Bulk Import
        </Button>
      </div>
      <p style={{ 
        fontSize: '0.875rem', 
        color: 'var(--theme-text-light)', 
        marginTop: '0.5rem' 
      }}>
        Update exchange rates from external API or import currency data in bulk.
      </p>
    </div>
  )
}

export default CurrencyAdmin