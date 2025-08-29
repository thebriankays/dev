import React from 'react'

export default function ItineraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {children}
    </div>
  )
}
