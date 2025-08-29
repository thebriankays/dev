'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export const ExploreView: React.FC = () => {
  const documentInfo = useDocumentInfo()
  const slug = (documentInfo as any)?.slug

  if (!slug) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Save the document to generate a slug and view the 3D map.</p>
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 200px)', width: '100%', position: 'relative' }}>
      <iframe
        src={`/explore/${slug}`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="3D Map Explorer"
      />
      <a
        href={`/explore/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
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
          <polyline points="7 17 2 12 7 7" />
          <polyline points="12 17 7 12 12 7" />
          <path d="M22 18v-2a4 4 0 0 0-4-4H7" />
        </svg>
        Open in New Tab
      </a>
    </div>
  )
}

export default ExploreView