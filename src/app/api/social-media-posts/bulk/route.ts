import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { posts } = body
  
  // Simulate creating multiple posts
  const createdPosts = posts.map((post: any, index: number) => ({
    id: `bulk-${Date.now()}-${index}`,
    ...post,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))
  
  return NextResponse.json({
    created: createdPosts.length,
    posts: createdPosts,
  })
}