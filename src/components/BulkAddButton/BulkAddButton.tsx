'use client'

import React, { useState } from 'react'
import { useModal } from '@payloadcms/ui'
import { Button } from '../ui/button'
import dynamic from 'next/dynamic'
import './bulk-add.scss'

// Dynamically import the modal to avoid SSR issues with Google Maps
const BulkAddModal = dynamic(() => import('./BulkAddModalV2'), {
  ssr: false,
})

export const BulkAddButton: React.FC = () => {
  const { openModal } = useModal()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
    openModal('bulk-add-modal')
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <div className="bulk-add-button-wrapper">
        <Button
          onClick={handleOpenModal}
          variant="secondary"
          size="sm"
        >
          Bulk Add Destinations
        </Button>
      </div>
      
      {isModalOpen && (
        <BulkAddModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}

export default BulkAddButton