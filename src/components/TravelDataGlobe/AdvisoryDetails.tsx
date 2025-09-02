'use client'

import React from 'react'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import type { AdvisoryCountry } from '@/blocks/TravelDataGlobeBlock/types'

interface AdvisoryDetailsProps {
  advisory: AdvisoryCountry
  onClose: () => void
}

export const AdvisoryDetails: React.FC<AdvisoryDetailsProps> = ({
  advisory,
  onClose
}) => {
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } catch {
      return dateStr
    }
  }
  
  const getFlagUrl = (country: any): string | null => {
    if (country?.flag) return `/flags/${country.flag}`
    if (country?.iso2) return `/flags/${country.iso2.toLowerCase()}.svg`
    return null
  }
  
  const flagUrl = getFlagUrl(advisory)
  
  return (
    <div className="tdg-detail-overlay">
      <div className="tdg-detail-glass">
        <div className="tdg-detail-header">
          <div className="tdg-detail-header-left">
            {/* State Department Logo */}
            <Image 
              src="/department-of-state.png" 
              alt="U.S. Department of State" 
              width={40} 
              height={40} 
              style={{ opacity: 0.9 }}
            />
            
            {/* Country Flag */}
            {flagUrl && (
              <Image 
                src={flagUrl} 
                alt={`${advisory.country} flag`} 
                width={36} 
                height={24} 
                className="tdg-detail-flag"
                unoptimized
              />
            )}
            
            {/* Country Name */}
            <h2 className="tdg-detail-title">{advisory.country}</h2>
            
            {/* Level Badge */}
            <span className={`tdg-detail-level tdg-level-${advisory.level}`}>
              Level {advisory.level}
            </span>
          </div>
          
          <button
            className="tdg-detail-close"
            onClick={onClose}
            aria-label="Close details"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="tdg-detail-content" data-lenis-prevent>
          {/* Large watermark logo in background */}
          <div className="tdg-detail-logo-bg">
            <Image
              src="/department-of-state.png"
              alt="U.S. Department of State"
              width={400}
              height={400}
              style={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.05,
                pointerEvents: 'none',
                zIndex: 0
              }}
            />
          </div>
          
          <div className="tdg-prose" style={{ position: 'relative', zIndex: 1 }}>
            <h3>Travel Advisory for {advisory.country}</h3>
            
            <div className="tdg-advisory-meta">
              <p><strong>Current Level:</strong> {advisory.level} - {
                advisory.level === 1 ? 'Exercise Normal Precautions' :
                advisory.level === 2 ? 'Exercise Increased Caution' :
                advisory.level === 3 ? 'Reconsider Travel' :
                'Do Not Travel'
              }</p>
              
              {advisory.dateAdded && (
                <p><strong>Last Updated:</strong> {formatDate(advisory.dateAdded)}</p>
              )}
            </div>
            
            {advisory.advisoryText && (
              <div className="tdg-advisory-full-text">
                <h4>Advisory Details</h4>
                {/* Display full text without truncation */}
                <div className="tdg-advisory-text-content">
                  {advisory.advisoryText.split('\n').map((paragraph, idx) => (
                    paragraph.trim() && <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
            
            {/* Footer with State Department branding */}
            <div className="tdg-detail-footer">
              <Image
                src="/department-of-state.png"
                alt="U.S. Department of State"
                width={150}
                height={75}
                style={{ opacity: 0.6 }}
              />
              <p className="tdg-detail-source">
                Source: U.S. Department of State Travel Advisories
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
