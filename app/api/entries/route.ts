import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isCaptainAuthenticated } from '@/lib/auth'

function getDB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function getAdminDB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  const db = getDB()
  const { data, error } = await db
    .from('entries')
    .select('*')
    .eq('published', true)
    .order('day_number', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  if (!isCaptainAuthenticated()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const body = await request.json()
  const { day_number, title, body: entryBody, lat, lng, location_name,
    wind_speed, wind_dir, wave_height, temperature, weather,
    heading, miles_today, photos, published } = body

  if (!title || !entryBody || !lat || !lng || !day_number) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const db = getAdminDB()
  const { data, error } = await db
    .from('entries')
    .insert({
      day_number: Number(day_number),
      title, body: entryBody,
      lat: Number(lat), lng: Number(lng), location_name,
      wind_speed, wind_dir, wave_height, temperature, weather,
      heading, miles_today,
      photos: photos || [],
      published: published !== false
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await db.from('checkins').insert({
    lat: Number(lat), lng: Number(lng),
    note: `Entrada publicada: ${title}`
  })

  return NextResponse.json(data, { status: 201 })
}
