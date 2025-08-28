'use client'

import React, { useState } from 'react'
import { useField, useAllFormFields, Button, toast } from '@payloadcms/ui'

export const GenerateChaptersButton: React.FC = () => {
  const [allFields, dispatchFields] = useAllFormFields()
  const { value: currentChapters, setValue: setChapters } = useField<any[]>({ path: 'storyChapters' })
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Get destinations - handle different data structures
  const destinationsField = allFields?.destinations
  let destinations: any[] = []
  
  if (destinationsField) {
    if (Array.isArray(destinationsField)) {
      destinations = destinationsField
    } else if (destinationsField.value && Array.isArray(destinationsField.value)) {
      destinations = destinationsField.value
    } else if (destinationsField.rows && Array.isArray(destinationsField.rows)) {
      destinations = destinationsField.rows
    }
  }
  
  console.log('Current form state:', {
    allFields,
    destinationsField,
    destinations,
    currentChapters
  })
  
  const handleGenerateChapters = async () => {
    console.log('Generate chapters clicked')
    setIsGenerating(true)
    
    if (!destinations || destinations.length === 0) {
      toast.error('Please add destinations first')
      setIsGenerating(false)
      return
    }

    try {
      // Generate chapters from destinations
      const newChapters = destinations.map((dest: any, index: number) => {
        console.log(`Processing destination ${index}:`, dest)
        
        // Try to get destination details
        let title = `Destination ${index + 1}`
        let description = dest.description || ''
        
        if (dest.destination) {
          // If destination is populated (object), use its data
          if (typeof dest.destination === 'object' && dest.destination.title) {
            title = dest.destination.title
            description = description || `Explore the wonders of ${title}`
          }
        } else if (dest.customLocation?.title) {
          title = dest.customLocation.title
          description = description || `Discover ${title}`
        }

        const chapter = {
          id: `chapter-${Date.now()}-${index}`, // Unique ID
          title: `Day ${index + 1}: ${title}`,
          content: description || `Experience the beauty of ${title}`,
          useDestination: true,
          destinationIndex: index,
          duration: 15,
        }
        
        console.log(`Generated chapter ${index}:`, chapter)
        return chapter
      })

      console.log('All generated chapters:', newChapters)
      
      // Update the chapters array field
      // For array fields, we need to update the rows
      const updatedField = {
        rows: newChapters,
        value: newChapters,
      }
      
      // Try multiple approaches to ensure the update works
      setChapters(newChapters)
      
      // Dispatch the update
      dispatchFields({
        type: 'UPDATE',
        path: 'storyChapters',
        value: updatedField,
      })
      
      // Alternative: dispatch individual row updates
      dispatchFields({
        type: 'REPLACE_STATE',
        state: {
          ...allFields,
          storyChapters: updatedField
        }
      })
      
      toast.success(`Generated ${newChapters.length} chapters from destinations!`)
    } catch (error) {
      console.error('Error generating chapters:', error)
      toast.error('Failed to generate chapters. Check console for details.')
    } finally {
      setIsGenerating(false)
    }
  }

  const hasDestinations = destinations && destinations.length > 0
  const hasChapters = currentChapters && currentChapters.length > 0

  if (!hasDestinations) {
    return (
      <div style={{ 
        padding: '16px', 
        background: '#f5f5f5', 
        borderRadius: '4px',
        marginBottom: '16px' 
      }}>
        <p style={{ margin: 0, color: '#666' }}>
          Add destinations in the Destinations tab first, then you can auto-generate story chapters.
        </p>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <Button
        onClick={handleGenerateChapters}
        disabled={isGenerating}
        buttonStyle={hasChapters ? 'secondary' : 'primary'}
        size="small"
      >
        {isGenerating 
          ? 'Generating...' 
          : hasChapters 
            ? 'Regenerate Chapters from Destinations' 
            : 'Generate Chapters from Destinations'
        }
      </Button>
      {hasChapters && !isGenerating && (
        <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          Warning: This will replace all existing chapters
        </p>
      )}
      <p style={{ marginTop: '8px', fontSize: '11px', color: '#999' }}>
        {destinations.length} destination(s) found
      </p>
    </div>
  )
}

export default GenerateChaptersButton