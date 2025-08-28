'use client'

import React from 'react'
import { useField, useAllFormFields, SelectInput } from '@payloadcms/ui'

export const DestinationSelect: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })
  const [allFields] = useAllFormFields()
  
  // Debug log to understand structure
  console.log('All fields:', allFields)
  console.log('Destinations field:', allFields?.destinations)
  
  // Get destinations - handle different data structures from array fields
  const destinationsField = allFields?.destinations
  let destinationsArray: any[] = []
  
  if (destinationsField) {
    if (Array.isArray(destinationsField)) {
      destinationsArray = destinationsField
    } else if (destinationsField.value && Array.isArray(destinationsField.value)) {
      destinationsArray = destinationsField.value
    } else if (destinationsField.rows && Array.isArray(destinationsField.rows)) {
      // Array fields often store data in rows
      destinationsArray = destinationsField.rows
    }
  }
  
  if (destinationsArray.length === 0) {
    return (
      <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
          No destinations available. Add destinations in the Destinations tab first.
        </p>
      </div>
    )
  }
  
  const options = destinationsArray.map((dest: any, index: number) => {
    let label = `Destination ${index + 1}`
    
    if (dest.destination) {
      // If populated, use the title
      if (typeof dest.destination === 'object' && dest.destination.title) {
        label = `${index + 1}. ${dest.destination.title}`
      } else {
        label = `${index + 1}. Destination (loading...)`
      }
    } else if (dest.customLocation?.title) {
      label = `${index + 1}. ${dest.customLocation.title} (Custom)`
    }
    
    return {
      label,
      value: String(index), // Convert to string for SelectInput compatibility
    }
  })
  
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
        Select Destination
      </label>
      <SelectInput
        path={path}
        name={path}
        options={options}
        value={value || ''}
        onChange={(option) => {
          if (option && typeof option === 'object' && 'value' in option) {
            setValue(option.value)
          }
        }}
      />
      <p style={{ marginTop: '4px', fontSize: '11px', color: '#666' }}>
        Which destination from your list this chapter should display
      </p>
    </div>
  )
}

export default DestinationSelect