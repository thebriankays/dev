'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import './login-form.scss'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to admin dashboard on successful login
        router.push('/admin')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (_err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-form">
      <form className="login-form__container" onSubmit={handleSubmit}>
        <h2 className="login-form__title">ALIEN LOGIN</h2>
        
        <div className="login-form__fields">
          <div className="login-form__field">
            <input
              className="login-form__input"
              name="email"
              type="email"
              placeholder="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <div className="login-form__line"></div>
          </div>
          
          <div className="login-form__field">
            <input
              className="login-form__input"
              name="password"
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <div className="login-form__line"></div>
          </div>
        </div>
        
        {error && (
          <div className="login-form__error">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          className="login-form__button"
          disabled={isLoading}
        >
          {isLoading ? 'LOGGING IN...' : 'ENTER'}
        </button>
        
        <Link href="/admin/forgot" className="login-form__forgot">
          Forgot password?
        </Link>
      </form>
    </div>
  )
}