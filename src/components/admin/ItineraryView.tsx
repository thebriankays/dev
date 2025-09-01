'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'
import Link from 'next/link'

interface StoryChapter {
  title?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export const ItineraryView: React.FC = () => {
  const { slug, enable3DStorytelling, storyChapters, title } = useFormFields(([fields]) => ({
    slug: fields.slug?.value as string | undefined,
    enable3DStorytelling: fields.enable3DStorytelling?.value as boolean | undefined,
    storyChapters: fields.storyChapters?.value as StoryChapter[] | undefined,
    title: fields.title?.value as string | undefined,
  }))

  if (!enable3DStorytelling || !slug) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center' 
        }}>
          <h3 style={{ marginBottom: '10px' }}>3D Storytelling View</h3>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            {!enable3DStorytelling 
              ? 'Enable &quot;3D Storytelling View&quot; in the sidebar to use this feature.'
              : 'Save this itinerary first to generate a preview link.'}
          </p>
          {!enable3DStorytelling && (
            <p style={{ fontSize: '14px', color: '#999' }}>
              Once enabled, you can create an immersive 3D journey through your travel destinations.
            </p>
          )}
        </div>
      </div>
    )
  }

  const hasChapters = storyChapters && storyChapters.length > 0
  const previewUrl = `/itinerary/${slug}`

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>3D Storytelling Preview</h3>
        
        {hasChapters ? (
          <div>
            <div style={{ 
              background: '#f9f9f9', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '20px' 
            }}>
              <p style={{ marginBottom: '10px', color: '#333' }}>
                <strong>Itinerary:</strong> {title || 'Untitled'}
              </p>
              <p style={{ marginBottom: '10px', color: '#666' }}>
                <strong>Chapters:</strong> {storyChapters.length} location{storyChapters.length !== 1 ? 's' : ''}
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Your 3D storytelling experience is ready to view.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                href={previewUrl}
                target="_blank"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  backgroundColor: '#4285f4',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#357ae8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4285f4'
                }}
              >
                🗺️ View 3D Storytelling
              </Link>

              <Link
                href={previewUrl}
                target="_blank"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  backgroundColor: '#34a853',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2d8e45'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#34a853'
                }}
              >
                📱 Test on Mobile
              </Link>
            </div>

            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              background: '#fff3cd', 
              borderRadius: '8px',
              border: '1px solid #ffecd1'
            }}>
              <p style={{ fontSize: '14px', color: '#856404', marginBottom: '8px' }}>
                <strong>Tips for the best experience:</strong>
              </p>
              <ul style={{ fontSize: '13px', color: '#856404', marginLeft: '20px', margin: '0' }}>
                <li>Use Chrome or Edge browser for best performance</li>
                <li>Allow location permissions if prompted</li>
                <li>Ensure all chapters have valid coordinates</li>
                <li>Test on different devices before sharing</li>
              </ul>
            </div>

            {/* Chapter List Preview */}
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '10px' }}>Chapter Overview:</h4>
              <div style={{ 
                background: '#f9f9f9', 
                padding: '10px', 
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {storyChapters.map((chapter: StoryChapter, index: number) => (
                  <div key={index} style={{ 
                    padding: '8px',
                    borderBottom: index < storyChapters.length - 1 ? '1px solid #e0e0e0' : 'none'
                  }}>
                    <span style={{ fontWeight: '500', color: '#333' }}>
                      {index + 1}. {chapter.title || `Chapter ${index + 1}`}
                    </span>
                    {chapter.coordinates && (
                      <span style={{ fontSize: '12px', color: '#999', marginLeft: '10px' }}>
                        📍 Location set
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            background: '#fff3cd', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #ffecd1'
          }}>
            <p style={{ color: '#856404', marginBottom: '10px' }}>
              No chapters added yet. Add at least one chapter in the &quot;Story Chapters&quot; tab to create your 3D journey.
            </p>
            <p style={{ fontSize: '14px', color: '#856404' }}>
              Each chapter represents a location in your travel story with its own narrative and camera position.
            </p>
          </div>
        )}
      </div>

      {/* Share Options */}
      {hasChapters && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#e8f4fd', 
          borderRadius: '8px',
          border: '1px solid #bee5eb'
        }}>
          <h4 style={{ marginBottom: '10px', color: '#004085' }}>Share Your Journey</h4>
          <p style={{ fontSize: '14px', color: '#004085', marginBottom: '10px' }}>
            Share this immersive 3D experience with your clients or travel companions:
          </p>
          <div style={{ 
            background: 'white', 
            padding: '10px', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '13px',
            wordBreak: 'break-all'
          }}>
            {typeof window !== 'undefined' ? `${window.location.origin}${previewUrl}` : previewUrl}
          </div>
        </div>
      )}
    </div>
  )
}

export default ItineraryView
