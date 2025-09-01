import React from 'react'
import type { Metadata } from 'next'
import { LoginPageClient } from './page.client'

export const metadata: Metadata = {
  title: 'Login | Alien Integrations',
  description: 'Login to access the admin portal',
}

export default function LoginPage() {
  return <LoginPageClient />
}