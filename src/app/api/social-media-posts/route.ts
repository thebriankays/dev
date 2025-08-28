import { NextRequest, NextResponse } from 'next/server'

// Mock data for social media posts
const mockPosts = [
  {
    id: '1',
    title: 'Summer Travel Destinations',
    content: 'Check out these amazing summer destinations for 2024!',
    platforms: ['facebook', 'instagram'],
    status: 'scheduled',
    scheduledDate: new Date(Date.now() + 86400000).toISOString(),
    analytics: {
      impressions: 1500,
      engagements: 250,
      clicks: 45,
    }
  },
  {
    id: '2',
    title: 'Bali Travel Guide',
    content: 'Everything you need to know about visiting Bali',
    platforms: ['instagram', 'tiktok'],
    status: 'published',
    publishedDate: new Date(Date.now() - 86400000).toISOString(),
    analytics: {
      impressions: 3500,
      engagements: 580,
      clicks: 120,
    }
  },
  {
    id: '3',
    title: 'Paris Tips',
    content: 'Top 10 tips for your Paris vacation',
    platforms: ['facebook'],
    status: 'draft',
  },
  {
    id: '4',
    title: 'Video: Beach Paradise',
    content: 'Experience the most beautiful beaches in the world',
    platforms: ['tiktok', 'youtube'],
    status: 'failed',
    errors: [
      { platform: 'tiktok', error: 'Video file too large' }
    ]
  }
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '10')
  
  return NextResponse.json({
    docs: mockPosts.slice(0, limit),
    totalDocs: mockPosts.length,
    limit,
    totalPages: Math.ceil(mockPosts.length / limit),
    page: 1,
    pagingCounter: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const newPost = {
    id: Date.now().toString(),
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  return NextResponse.json(newPost, { status: 201 })
}