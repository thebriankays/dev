import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const mockCalendarEvents = {
    posts: [
      {
        id: '1',
        content: 'Summer destinations post',
        platforms: ['facebook', 'instagram'],
        scheduledDate: new Date().toISOString(),
        status: 'scheduled',
      },
      {
        id: '2',
        content: 'Beach travel tips',
        platforms: ['instagram'],
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        status: 'scheduled',
      },
      {
        id: '3',
        content: 'Travel vlog',
        platforms: ['youtube', 'tiktok'],
        scheduledDate: new Date(Date.now() + 172800000).toISOString(),
        status: 'scheduled',
      },
    ]
  }
  
  return NextResponse.json(mockCalendarEvents)
}