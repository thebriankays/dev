import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const range = searchParams.get('range') || '7d'
  
  // Mock analytics data
  const analyticsData = {
    overview: {
      totalPosts: 45,
      totalEngagement: 12500,
      totalReach: 85000,
      totalClicks: 3200,
      conversionRate: 3.76
    },
    platformBreakdown: {
      facebook: { posts: 15, engagement: 5000, reach: 35000 },
      instagram: { posts: 20, engagement: 6000, reach: 40000 },
      tiktok: { posts: 10, engagement: 1500, reach: 10000 }
    },
    timeSeriesData: {
      dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      engagement: [1200, 1900, 1500, 2000, 1700, 2200, 1900],
      reach: [10000, 15000, 12000, 18000, 14000, 20000, 16000],
      clicks: [400, 600, 450, 700, 550, 750, 650]
    },
    topPosts: [
      {
        id: '1',
        content: 'Discover the hidden gems of Bali with our comprehensive travel guide',
        platform: 'instagram',
        engagement: 2500,
        reach: 15000,
        clicks: 450,
        scheduledDate: new Date().toISOString()
      },
      {
        id: '2',
        content: 'Top 10 travel destinations for 2024 - You won\'t believe #3!',
        platform: 'facebook',
        engagement: 1800,
        reach: 12000,
        clicks: 380,
        scheduledDate: new Date().toISOString()
      }
    ],
    hashtagPerformance: [
      { hashtag: '#travel', usage: 25, avgEngagement: 1200 },
      { hashtag: '#wanderlust', usage: 20, avgEngagement: 950 },
      { hashtag: '#vacation', usage: 15, avgEngagement: 800 },
      { hashtag: '#adventure', usage: 18, avgEngagement: 1100 },
      { hashtag: '#explore', usage: 12, avgEngagement: 750 }
    ]
  }
  
  return NextResponse.json(analyticsData)
}