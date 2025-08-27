import React from 'react'
import { Metadata } from 'next'
import { SplitTextDemo } from './page.client'

export const metadata: Metadata = {
  title: 'Split Text Animation Demo | GSAP & ScrollTrigger',
  description: 'Experience advanced text splitting animations with GSAP, ScrollTrigger, and smooth scrolling',
}

export default async function SplitTextDemoPage() {
  return <SplitTextDemo />
}