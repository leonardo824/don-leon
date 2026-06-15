// app/api/entries/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isCaptainAuthenticated } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

// POST /api/entries/upload — Subir foto a Supabase Storage
export async function POST(request: NextRequest) {
  if (!isCaptainAuthenticated()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const fileName = `${uuidv4()}.${ext}`
  const buffer = await file.arrayBuffer()

  const db = supabaseAdmin()
  const { error } = await db.storage
    .from('entry-photos')
    .upload(fileName, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = db.storage.from('entry-photos').getPublicUrl(fileName)
  return NextResponse.json({ url: publicUrl })
}
