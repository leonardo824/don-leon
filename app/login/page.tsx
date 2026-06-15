'use client'
// app/login/page.tsx — Página de login del Capitán

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })

    if (res.ok) {
      router.push(redirect)
      router.refresh()
    } else {
      const { error } = await res.json()
      setError(error || 'Contraseña incorrecta')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a1628 0%, #0d2545 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'rgba(13,37,69,0.95)',
        border: '1px solid rgba(45,125,210,0.3)',
        borderRadius: '16px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⛵</div>
          <h1 style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.8rem',
            fontWeight: 900,
            color: '#f0e6c8',
            letterSpacing: '0.05em'
          }}>
            DON <span style={{ color: '#c8863a' }}>LEÓN</span>
          </h1>
          <p style={{ color: '#a8c4e0', fontSize: '0.75rem', marginTop: '6px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Acceso del Capitán
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a8c4e0', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoFocus
              style={{
                width: '100%',
                background: 'rgba(10,22,40,0.8)',
                border: '1px solid rgba(45,125,210,0.3)',
                borderRadius: '8px',
                color: '#f0e6c8',
                fontSize: '1rem',
                padding: '12px 14px',
                outline: 'none',
                fontFamily: 'monospace',
                letterSpacing: '0.15em'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '6px',
              padding: '10px 12px',
              color: '#fca5a5',
              fontSize: '0.8rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'rgba(45,125,210,0.4)' : 'linear-gradient(135deg, #1a4a7a, #2d7dd2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '13px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
              letterSpacing: '0.05em'
            }}
          >
            {loading ? 'Verificando...' : '⚓ Entrar al puente de mando'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.7rem', color: 'rgba(168,196,224,0.4)' }}>
          Solo el Capitán tiene acceso a esta área
        </p>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <a href="/" style={{ color: '#7eb8f7', fontSize: '0.75rem', textDecoration: 'none' }}>
            ← Volver a la bitácora
          </a>
        </div>
      </div>
    </div>
  )
}
