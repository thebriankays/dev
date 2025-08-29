'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export const ItineraryLink: React.FC = () => {
  const documentInfo = useDocumentInfo()
  const id = documentInfo?.id

  if (!id) {
    return null
  }

  const href = `/itinerary/${id}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        backgroundColor: '#2196f3',
        color: 'white',
        borderRadius: '4px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#1976d2'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#2196f3'
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14" />
        <path d="M12 5l7 7-7 7" />
      </svg>
      View Itinerary
    </a>
  )
}