// lib/auth.ts
// Autenticación simple para el Capitán usando cookies firmadas

import { cookies } from 'next/headers'

const SESSION_COOKIE = 'don-leon-captain'
const SESSION_VALUE = 'authenticated'

// Verifica si el request tiene sesión válida de capitán
export function isCaptainAuthenticated(): boolean {
  const cookieStore = cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  return session?.value === SESSION_VALUE
}

// Verifica la contraseña contra la variable de entorno
export function verifyPassword(password: string): boolean {
  const correctPassword = process.env.CAPTAIN_PASSWORD
  if (!correctPassword) {
    console.error('CAPTAIN_PASSWORD no está configurada en .env.local')
    return false
  }
  return password === correctPassword
}

export { SESSION_COOKIE, SESSION_VALUE }
