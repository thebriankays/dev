'use client'

import React, { useState, useCallback } from 'react'
import { gsap } from 'gsap'

interface FlightSearchProps {
  onSearch: (query: string) => void
}

export const FlightSearch: React.FC<FlightSearchProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('')

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }, [query, onSearch])

  const handleClear = useCallback(() => {
    setQuery('')
    onSearch('')
    
    // Animate clear button
    const btn = document.querySelector('.flight-tracker__search-btn')
    if (btn) {
      gsap.to(btn, {
        rotation: 360,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          gsap.set(btn, { rotation: 0 })
        }
      })
    }
  }, [onSearch])

  return (
    <form className="flight-tracker__search" onSubmit={handleSubmit}>
      <input
        type="text"
        className="flight-tracker__search-input"
        placeholder="Search flight (e.g., AA123, DL456)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {}}
        onBlur={() => {}}
      />
      <button
        type={query ? 'button' : 'submit'}
        className="flight-tracker__search-btn"
        onClick={query ? handleClear : undefined}
        aria-label={query ? 'Clear search' : 'Search'}
      >
        {query ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        )}
      </button>
    </form>
  )
}

export default FlightSearch