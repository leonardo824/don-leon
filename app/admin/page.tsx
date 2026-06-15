'use client'
// app/admin/page.tsx — Panel del Capitán para registrar entradas

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0a1628', fontFamily: 'Inter, sans-serif', color: '#f0e6c8' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: 'rgba(10,22,40,0.95)', borderBottom: '1px solid rgba(45,125,210,0.3)', position: 'sticky', top: 0, zIndex: 100 },
  logo: { fontFamily: '"Playfair Display", serif', fontSize: '1.4rem', fontWeight: 900, color: '#f0e6c8' },
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 24px' },
  card: { background: 'rgba(13,37,69,0.8)', border: '1px solid rgba(45,125,210,0.2)', borderRadius: '12px', padding: '32px', marginBottom: '24px' },
  sectionTitle: { fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: '#f0e6c8', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(45,125,210,0.15)' },
  label: { display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#a8c4e0', marginBottom: '5px' },
  input: { width: '100%', background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(45,125,210,0.2)', borderRadius: '6px', color: '#f0e6c8', fontFamily: '"Courier Prime", monospace', fontSize: '0.9rem', padding: '10px 12px', outline: 'none', boxSizing: 'border-box' as const },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' },
  submitBtn: { background: 'linear-gradient(135deg, #1a4a7a, #2d7dd2)', color: 'white', border: 'none', borderRadius: '8px', padding: '14px 24px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: '8px' },
  logoutBtn: { background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', padding: '7px 14px', fontSize: '0.75rem', cursor: 'pointer' },
  dropzone: { border: '1.5px dashed rgba(45,125,210,0.4)', borderRadius: '8px', padding: '24px', textAlign: 'center' as const, cursor: 'pointer', transition: 'all 0.2s', color: '#a8c4e0', fontSize: '0.85rem' },
  successBanner: { background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '8px', padding: '14px 18px', color: '#86efac', marginBottom: '20px', fontSize: '0.85rem' },
  errorBanner: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '14px 18px', color: '#fca5a5', marginBottom: '20px', fontSize: '0.85rem' },
  photoPreview: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px' },
  photoThumb: { aspectRatio: '1', borderRadius: '6px', objectFit: 'cover' as const, width: '100%' },
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const [form, setForm] = useState({
    day_number: '',
    title: '',
    body: '',
    lat: '',
    lng: '',
    location_name: '',
    wind_speed: '',
    wind_dir: '',
    wave_height: '',
    temperature: '',
    weather: '',
    heading: '',
    miles_today: '',
    published: true,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadingPhotos(true)
    const urls: string[] = []
    const previews: string[] = []

    for (const file of acceptedFiles) {
      // Preview local
      previews.push(URL.createObjectURL(file))

      // Upload
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/entries/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const { url } = await res.json()
        urls.push(url)
      }
    }

    setPreviewUrls(p => [...p, ...previews])
    setUploadedPhotos(p => [...p, ...urls])
    setUploadingPhotos(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'video/*': ['.mp4', '.mov'] },
    maxSize: 50 * 1024 * 1024
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, photos: uploadedPhotos })
    })

    if (res.ok) {
      setSuccess(true)
      setForm({ day_number: '', title: '', body: '', lat: '', lng: '', location_name: '', wind_speed: '', wind_dir: '', wave_height: '', temperature: '', weather: '', heading: '', miles_today: '', published: true })
      setUploadedPhotos([])
      setPreviewUrls([])
      window.scrollTo(0, 0)
    } else {
      const data = await res.json()
      setError(data.error || 'Error al publicar')
    }
    setLoading(false)
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/')
    router.refresh()
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div>
          <div style={styles.logo}>DON <span style={{ color: '#c8863a' }}>LEÓN</span></div>
          <div style={{ fontSize: '0.65rem', color: '#a8c4e0', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '2px' }}>
            Panel del Capitán
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/" style={{ color: '#7eb8f7', fontSize: '0.8rem', textDecoration: 'none' }}>← Ver bitácora</a>
          <button onClick={handleLogout} style={styles.logoutBtn}>Salir</button>
        </div>
      </nav>

      <div style={styles.container}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.8rem', marginBottom: '8px' }}>
          ✍️ Nueva entrada de bitácora
        </h1>
        <p style={{ color: '#a8c4e0', fontSize: '0.85rem', marginBottom: '32px' }}>
          Solo tú puedes ver y usar esta página, Capitán.
        </p>

        {success && (
          <div style={styles.successBanner}>
            ✅ ¡Entrada publicada con éxito! Aparece ya en la bitácora pública.
            <div style={{ marginTop: '6px' }}>
              <a href="/" style={{ color: '#4ade80' }}>Ver en la bitácora →</a>
            </div>
          </div>
        )}

        {error && <div style={styles.errorBanner}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* POSICIÓN */}
          <div style={styles.card}>
            <div style={styles.sectionTitle}>📍 Posición</div>
            <div style={styles.grid3}>
              <div>
                <label style={styles.label}>Día # del viaje *</label>
                <input style={styles.input} name="day_number" value={form.day_number} onChange={handleChange} type="number" placeholder="47" required />
              </div>
              <div>
                <label style={styles.label}>Latitud *</label>
                <input style={styles.input} name="lat" value={form.lat} onChange={handleChange} placeholder="9.3703" required />
              </div>
              <div>
                <label style={styles.label}>Longitud *</label>
                <input style={styles.input} name="lng" value={form.lng} onChange={handleChange} placeholder="-84.7167" required />
              </div>
            </div>
            <div>
              <label style={styles.label}>Nombre del lugar</label>
              <input style={styles.input} name="location_name" value={form.location_name} onChange={handleChange} placeholder="Golfo de Tehuantepec, México" />
            </div>
            <p style={{ fontSize: '0.68rem', color: 'rgba(168,196,224,0.5)', marginTop: '8px' }}>
              💡 Tip: usa Google Maps → click derecho en tu posición → copia las coordenadas decimales
            </p>
          </div>

          {/* DIARIO */}
          <div style={styles.card}>
            <div style={styles.sectionTitle}>📖 Diario del día</div>
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Título *</label>
              <input style={styles.input} name="title" value={form.title} onChange={handleChange} placeholder="Ej: Vientos del norte y mar de 3 metros" required />
            </div>
            <div>
              <label style={styles.label}>Bitácora del día *</label>
              <textarea
                style={{ ...styles.input, minHeight: '180px', resize: 'vertical', lineHeight: '1.6', fontStyle: 'italic' }}
                name="body"
                value={form.body}
                onChange={handleChange}
                placeholder="Escribe sobre el día: qué pasó, cómo te sentiste, qué viste, dónde fondearon, qué comieron, qué animales vieron..."
                required
              />
            </div>
          </div>

          {/* CONDICIONES */}
          <div style={styles.card}>
            <div style={styles.sectionTitle}>🌊 Condiciones náuticas</div>
            <div style={styles.grid3}>
              <div><label style={styles.label}>💨 Viento (kts)</label><input style={styles.input} name="wind_speed" value={form.wind_speed} onChange={handleChange} placeholder="12" /></div>
              <div><label style={styles.label}>🧭 Dirección viento</label><input style={styles.input} name="wind_dir" value={form.wind_dir} onChange={handleChange} placeholder="NE" /></div>
              <div><label style={styles.label}>🌊 Altura olas (m)</label><input style={styles.input} name="wave_height" value={form.wave_height} onChange={handleChange} placeholder="2.5" /></div>
              <div><label style={styles.label}>🌡️ Temperatura (°C)</label><input style={styles.input} name="temperature" value={form.temperature} onChange={handleChange} placeholder="28" /></div>
              <div><label style={styles.label}>☁️ Clima</label><input style={styles.input} name="weather" value={form.weather} onChange={handleChange} placeholder="Parcial nublado" /></div>
              <div><label style={styles.label}>🧭 Rumbo (°)</label><input style={styles.input} name="heading" value={form.heading} onChange={handleChange} placeholder="275" /></div>
            </div>
            <div>
              <label style={styles.label}>⚓ Millas navegadas hoy</label>
              <input style={{ ...styles.input, maxWidth: '200px' }} name="miles_today" value={form.miles_today} onChange={handleChange} placeholder="142" />
            </div>
          </div>

          {/* FOTOS */}
          <div style={styles.card}>
            <div style={styles.sectionTitle}>📷 Fotos y videos</div>
            <div {...getRootProps()} style={{ ...styles.dropzone, borderColor: isDragActive ? '#2d7dd2' : undefined, background: isDragActive ? 'rgba(45,125,210,0.08)' : undefined }}>
              <input {...getInputProps()} />
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📷</div>
              {uploadingPhotos ? 'Subiendo archivos...' : isDragActive ? '¡Suelta las fotos aquí!' : 'Arrastra fotos aquí o toca para seleccionar'}
              <div style={{ fontSize: '0.68rem', marginTop: '6px', color: 'rgba(168,196,224,0.4)' }}>JPG, PNG, MP4, MOV · máx 50MB por archivo</div>
            </div>
            {previewUrls.length > 0 && (
              <div style={styles.photoPreview}>
                {previewUrls.map((url, i) => (
                  <img key={i} src={url} alt={`foto ${i+1}`} style={styles.photoThumb} />
                ))}
              </div>
            )}
          </div>

          {/* PUBLICAR */}
          <div style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <input type="checkbox" id="published" name="published" checked={form.published} onChange={handleChange} />
              <label htmlFor="published" style={{ fontSize: '0.85rem', color: '#f0e6c8', cursor: 'pointer' }}>
                Publicar inmediatamente (visible para todos los seguidores)
              </label>
            </div>
            <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Publicando...' : '⛵ Publicar entrada en la bitácora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
