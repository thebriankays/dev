'use client'

import React from 'react'
import { AlienIntegrations } from '@/webgl/components/alien'
import { LoginForm } from '@/components/LoginForm'
import './login.scss'

export function LoginPageClient() {
  return (
    <div className="login-page">
      {/* AlienIntegrations provides the 3D background */}
      <AlienIntegrations showText={true} className="login-page__background" interactive={false} />
      
      {/* Login form overlay */}
      <div className="login-page__content">
        <LoginForm />
      </div>
    </div>
  )
}