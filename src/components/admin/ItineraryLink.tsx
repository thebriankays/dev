'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export const ItineraryLink: React.FC = () => {
  const documentInfo = useDocumentInfo()
  const slug = (documentInfo as any)?.slug // Type assertion since slug might not be in types

  if (!slug) {
    return null
  }

  const href = `/itinerary/${slug}`

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
        backgroundColor: '#4285f4',
        color: 'white',
        borderRadius: '4px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#357ae8'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#4285f4'
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      View 3D Story
    </a>
  )
}
