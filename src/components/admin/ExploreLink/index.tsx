'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export const ExploreLink: React.FC = () => {
  const documentInfo = useDocumentInfo()
  const slug = (documentInfo as any)?.slug // Type assertion since slug might not be in types

  if (!slug) {
    return null
  }

  const href = `/explore/${slug}`

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
        backgroundColor: '#34a853',
        color: 'white',
        borderRadius: '4px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#2e7d32'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#34a853'
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="10" r="3" />
        <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" />
      </svg>
      Explore 3D Map
    </a>
  )
}
