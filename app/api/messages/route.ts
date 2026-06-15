// app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// GET /api/messages
export async function GET() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/messages — Cualquier visitante puede dejar mensaje
export async function POST(request: NextRequest) {
  const { author, city, body } = await request.json()
  if (!author || !body) {
    return NextResponse.json({ error: 'Nombre y mensaje son requeridos' }, { status: 400 })
  }

  // Rate limiting básico: máx 3 mensajes por IP por hora
  // (en producción usar Redis o Upstash)

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('messages')
    .insert({ author: author.slice(0, 80), city: city?.slice(0, 50), body: body.slice(0, 500) })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
