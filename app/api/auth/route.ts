// app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, SESSION_COOKIE, SESSION_VALUE } from '@/lib/auth'

// POST /api/auth — Login del Capitán
export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: '/'
  })
  return response
}

// DELETE /api/auth — Logout
export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}
