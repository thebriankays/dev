'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConfig } from '@payloadcms/ui'
import './destination-list-table.scss'

export const DestinationListTable: React.FC = () => {
  const router = useRouter()
  const config = useConfig()
  const adminRoute = (config as any)?.admin?.routes?.admin || '/admin'

  useEffect(() => {
    // Add click handlers to table rows after they're rendered
    const addRowClickHandlers = () => {
      const tableRows = document.querySelectorAll('.collection-list__table tbody tr')
      
      tableRows.forEach((row) => {
        const htmlRow = row as HTMLElement
        
        // Skip if already has handler
        if (htmlRow.dataset.hasClickHandler === 'true') return
        
        htmlRow.dataset.hasClickHandler = 'true'
        htmlRow.classList.add('clickable-row')
        
        htmlRow.addEventListener('click', (e) => {
          const target = e.target as HTMLElement
          
          // Don't navigate if clicking on interactive elements
          if (
            target.tagName === 'A' || 
            target.tagName === 'BUTTON' || 
            target.tagName === 'INPUT' ||
            target.closest('a') || 
            target.closest('button') ||
            target.closest('input') ||
            target.closest('.cell-checkbox') ||
            target.closest('.popup-button')
          ) {
            return
          }
          
          // Find the ID from the row data
          const checkbox = row.querySelector('input[type="checkbox"][name*="selection-"]')
          if (checkbox) {
            const id = (checkbox as HTMLInputElement).value
            if (id) {
              router.push(`${adminRoute}/collections/destinations/${id}`)
            }
          }
        })
      })
    }
    
    // Initial setup
    addRowClickHandlers()
    
    // Watch for DOM changes (when data loads or pagination changes)
    const observer = new MutationObserver(() => {
      addRowClickHandlers()
    })
    
    const tableContainer = document.querySelector('.collection-list__wrap')
    if (tableContainer) {
      observer.observe(tableContainer, {
        childList: true,
        subtree: true
      })
    }
    
    return () => {
      observer.disconnect()
    }
  }, [router, adminRoute])

  return null // This component doesn't render anything, it just adds behavior
}

export default DestinationListTable