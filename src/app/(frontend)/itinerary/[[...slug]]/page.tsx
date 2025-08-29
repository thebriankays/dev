import React, { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Storytelling } from '@/components/Storytelling'
import { notFound } from 'next/navigation'

// Default itinerary for testing when no slug is provided
const defaultItinerary = {
  title: 'Paris Highlights Tour',
  description: 'Experience the magic of Paris through its most iconic landmarks',
  storyChapters: [
    {
      title: 'Eiffel Tower',
      content: 'The iron lady of Paris, standing tall since 1889. This architectural marvel has become the symbol of France.',
      location: { lat: 48.8584, lng: 2.2945 },
      camera: { range: 1000, tilt: 75, heading: 0 },
      duration: 10
    },
    {
      title: 'Louvre Museum',
      content: 'Home to thousands of works of art, including the Mona Lisa. The world\'s largest art museum.',
      location: { lat: 48.8606, lng: 2.3376 },
      camera: { range: 1200, tilt: 65, heading: 120 },
      duration: 10
    },
    {
      title: 'Notre-Dame Cathedral',
      content: 'A masterpiece of French Gothic architecture, dating back to the 12th century.',
      location: { lat: 48.8530, lng: 2.3499 },
      camera: { range: 800, tilt: 70, heading: 270 },
      duration: 10
    },
    {
      title: 'Arc de Triomphe',
      content: 'Standing at the center of Place Charles de Gaulle, honoring those who fought for France.',
      location: { lat: 48.8738, lng: 2.2950 },
      camera: { range: 1000, tilt: 60, heading: 180 },
      duration: 10
    },
    {
      title: 'Sacré-Cœur',
      content: 'Perched atop Montmartre hill, offering panoramic views of Paris.',
      location: { lat: 48.8867, lng: 2.3431 },
      camera: { range: 1500, tilt: 65, heading: 200 },
      duration: 10
    }
  ],
  storytellingConfig: {
    autoPlay: false,
    showNavigation: true,
    showTimeline: true,
    theme: 'dark' as 'dark' | 'light'
  }
}

// Cache the data fetching function
const getItineraryBySlug = cache(async (slug: string) => {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'travel-itineraries',
    where: {
      slug: {
        equals: slug,
      },
      enable3DStorytelling: {
        equals: true,
      },
    },
    limit: 1,
  })

  return result.docs[0] || null
})

export default async function ItineraryPage({ params }: { params: { slug?: string[] } }) {
  const slug = params.slug?.[0]
  let itineraryData = defaultItinerary

  if (slug) {
    const itinerary = await getItineraryBySlug(slug)
    if (!itinerary) {
      return notFound()
    }
    
    // Transform the itinerary data to match the component format
    itineraryData = {
      title: itinerary.title,
      description: itinerary.description || '',
      storyChapters: itinerary.storyChapters?.map((chapter: any) => ({
        title: chapter.title,
        content: chapter.content,
        location: chapter.coordinates || chapter.location,
        camera: chapter.cameraOptions?.useCustomCamera ? {
          range: 1500,
          tilt: chapter.cameraOptions.pitch || 65,
          heading: chapter.cameraOptions.heading || 0,
        } : {
          range: 1500,
          tilt: 65,
          heading: 0,
        },
        duration: chapter.duration || 10,
        focusOptions: chapter.focusOptions,
      })) || [],
      storytellingConfig: {
        autoPlay: itinerary.storytellingConfig?.autoPlay ?? false,
        showNavigation: itinerary.storytellingConfig?.showNavigation ?? true,
        showTimeline: itinerary.storytellingConfig?.showTimeline ?? true,
        theme: (itinerary.storytellingConfig?.theme ?? 'dark') as 'light' | 'dark'
      }
    }
  }

  return <Storytelling itinerary={itineraryData} />
}
