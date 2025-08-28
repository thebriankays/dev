'use client'

import React, { useState } from 'react'
import { Modal, useModal } from '@payloadcms/ui'
import { Button } from '../ui/button'
import './bulk-add.scss'

export const BulkAddButton: React.FC = () => {
  const { openModal, closeModal } = useModal()
  const [isProcessing, setIsProcessing] = useState(false)
  const [bulkData, setBulkData] = useState('')

  const handleBulkAdd = async () => {
    setIsProcessing(true)
    try {
      // Parse CSV or JSON data
      const lines = bulkData.trim().split('\n')
      const destinations = []
      
      for (const line of lines) {
        const [city, country, continent, lat, lng] = line.split(',').map(s => s.trim())
        if (city && country) {
          destinations.push({
            title: `${city}, ${country}`,
            city,
            country,
            continent,
            lat: parseFloat(lat) || 0,
            lng: parseFloat(lng) || 0,
          })
        }
      }

      // TODO: Implement bulk add API
      console.log('Bulk adding destinations:', destinations)
      
      closeModal('bulk-add-modal')
      setBulkData('')
    } catch (error) {
      console.error('Bulk add error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="bulk-add-button-wrapper">
        <Button
          onClick={() => openModal('bulk-add-modal')}
          variant="secondary"
          size="sm"
        >
          Bulk Add Destinations
        </Button>
      </div>
      
      <Modal
        slug="bulk-add-modal"
        className="bulk-add-modal"
      >
        <div className="modal-content">
          <h2>Bulk Add Destinations</h2>
          <p>Add multiple destinations at once. Format: city, country, continent, latitude, longitude</p>
          <textarea
            value={bulkData}
            onChange={(e) => setBulkData(e.target.value)}
            placeholder="Paris, France, Europe, 48.8566, 2.3522
Tokyo, Japan, Asia, 35.6762, 139.6503
New York, USA, North America, 40.7128, -74.0060"
            rows={10}
            className="bulk-add-textarea"
          />
          <div className="modal-actions">
            <Button
              onClick={() => closeModal('bulk-add-modal')}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAdd}
              disabled={isProcessing || !bulkData.trim()}
            >
              {isProcessing ? 'Processing...' : 'Add Destinations'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default BulkAddButton