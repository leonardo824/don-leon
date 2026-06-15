// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente público (para lecturas desde el browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin con service role (solo en server-side / API routes)
export const supabaseAdmin = () =>
  createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

// Tipos TypeScript
export type Entry = {
  id: string
  created_at: string
  day_number: number
  title: string
  body: string
  lat: number
  lng: number
  location_name: string | null
  wind_speed: string | null
  wind_dir: string | null
  wave_height: string | null
  temperature: string | null
  weather: string | null
  heading: string | null
  miles_today: string | null
  photos: string[]
  published: boolean
}

export type Message = {
  id: string
  created_at: string
  author: string
  city: string | null
  body: string
  likes: number
  approved: boolean
}

export type Checkin = {
  id: string
  created_at: string
  lat: number
  lng: number
  note: string
}
