'use client'

import { useEffect, useState, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Entry, Message } from '@/lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Tab = 'feed' | 'stats' | 'guestbook'

export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<mapboxgl.Map | null>(null)
  const [tab, setTab] = useState<Tab>('feed')
  const [entries, setEntries] = useState<Entry[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [msgForm, setMsgForm] = useState({ author: '', city: '', body: '' })
  const [msgSending, setMsgSending] = useState(false)
  const [msgSent, setMsgSent] = useState(false)
  const [totalMiles, setTotalMiles] = useState(0)

  useEffect(() => {
    fetch('/api/entries')
      .then(r => r.json())
      .then((res) => {
        const data: Entry[] = Array.isArray(res) ? res : []
        setEntries(data)
        const miles = data.reduce((sum, e) => sum + (parseFloat(e.miles_today || '0') || 0), 0)
        setTotalMiles(Math.round(miles))
        setLoadingEntries(false)
      })
      .catch(() => setLoadingEntries(false))
  }, [])

  useEffect(() => {
    fetch('/api/messages')
      .then(r => r.json())
      .then((res) => { if (Array.isArray(res)) setMessages(res) })
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return
    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: [-90, 15],
      zoom: 3.5,
    })
    map.on('load', () => { if (entries.length > 0) drawRoute(map, entries) })
    mapInstance.current = map
    return () => { map.remove(); mapInstance.current = null }
  }, [])

  useEffect(() => {
    if (!mapInstance.current || entries.length === 0) return
    const map = mapInstance.current
    if (map.loaded()) drawRoute(map, entries)
    else map.on('load', () => drawRoute(map, entries))
  }, [entries])

  function drawRoute(map: mapboxgl.Map, entries: Entry[]) {
    const sorted = [...entries].sort((a, b) => a.day_number - b.day_number)
    const coords: [number, number][] = sorted.map(e => [e.lng, e.lat])
    if (map.getSource('route')) {
      (map.getSource('route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {}
      })
    } else {
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} }
      })
      map.addLayer({
        id: 'route-line', type: 'line', source: 'route',
        paint: { 'line-color': '#c8863a', 'line-width': 2.5, 'line-dasharray': [3, 2] }
      })
    }
    sorted.forEach((entry, i) => {
      const isLast = i === sorted.length - 1
      const el = document.createElement('div')
      el.style.cssText = `width:${isLast?'20px':'12px'};height:${isLast?'20px':'12px'};border-radius:50%;background:${isLast?'#4ade80':'#c8863a'};border:2px solid rgba(255,255,255,0.6);cursor:pointer;box-shadow:0 0 ${isLast?'12px':'6px'} ${isLast?'#4ade80':'#c8863a'};`
      new mapboxgl.Marker({ element: el })
        .setLngLat([entry.lng, entry.lat])
        .setPopup(new mapboxgl.Popup({ offset: 15 }).setHTML(`
          <div style="font-family:Inter,sans-serif;padding:4px;background:#0d2545;border-radius:6px">
            <div style="font-size:0.65rem;color:#a8c4e0;text-transform:uppercase">Día ${entry.day_number}</div>
            <div style="font-weight:700;color:#f0e6c8;margin:4px 0">${entry.title}</div>
            <div style="font-size:0.75rem;color:#7eb8f7">${entry.location_name || ''}</div>
            <div style="font-size:0.65rem;color:#a8c4e0;margin-top:4px">${entry.wind_speed ? '💨 '+entry.wind_speed+'kts' : ''} ${entry.temperature ? '🌡️ '+entry.temperature+'°C' : ''}</div>
          </div>
        `))
        .addTo(map)
    })
    const last = sorted[sorted.length - 1]
    map.flyTo({ center: [last.lng, last.lat], zoom: 4, duration: 2000 })
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    setMsgSending(true)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msgForm)
    })
    if (res.ok) { setMsgSent(true); setMsgForm({ author: '', city: '', body: '' }) }
    setMsgSending(false)
  }

  const latest = entries.sort((a,b) => b.day_number - a.day_number)[0]
  const dayCount = latest?.day_number || 0
  const progress = Math.round((totalMiles / 35834) * 100)

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', fontFamily: 'Inter, sans-serif', color: '#f0e6c8', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', background: 'rgba(10,22,40,0.97)', borderBottom: '1px solid rgba(45,125,210,0.3)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.4rem', fontWeight: 900 }}>
            DON <span style={{ color: '#c8863a' }}>LEÓN</span>
          </div>
          <div style={{ fontSize: '0.6rem', color: '#a8c4e0', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '2px' }}>Bitácora · Vuelta al Mundo</div>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[{label:'Días',val:dayCount},{label:'Millas',val:totalMiles.toLocaleString()},{label:'% Ruta',val:`${progress}%`}].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: '#c8863a', fontWeight: 700 }}>{s.val}</div>
              <div style={{ fontSize: '0.58rem', color: '#a8c4e0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {(['feed','stats','guestbook'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', border: `1px solid ${tab===t?'#2d7dd2':'transparent'}`, background: tab===t?'#1a4a7a':'transparent', color: tab===t?'#f0e6c8':'#a8c4e0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>
              {t==='feed'?'📖 Bitácora':t==='stats'?'📊 Ruta':'💬 Mensajes'}
            </button>
          ))}
          <a href="/login" style={{ marginLeft: '8px', color: '#a8c4e0', fontSize: '0.7rem', textDecoration: 'none', opacity: 0.4 }}>⚓</a>
        </div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', flex: 1, height: 'calc(100vh - 65px)' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        <div style={{ background: '#0d2545', borderLeft: '1px solid rgba(45,125,210,0.2)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {tab === 'feed' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '18px 22px 12px', borderBottom: '1px solid rgba(45,125,210,0.15)' }}>
                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.15rem', marginBottom: '3px' }}>Bitácora del Capitán</h2>
                <p style={{ fontSize: '0.72rem', color: '#a8c4e0' }}>{entries.length} entradas publicadas</p>
              </div>
              {latest && (
                <div style={{ background: 'rgba(74,222,128,0.06)', borderBottom: '1px solid rgba(74,222,128,0.15)', padding: '10px 22px', fontSize: '0.72rem', color: '#86efac' }}>
                  <span style={{ display: 'inline-block', width: '7px', height: '7px', background: '#4ade80', borderRadius: '50%', marginRight: '7px', animation: 'pulse 2s infinite', verticalAlign: 'middle' }} />
                  Última posición: {latest.location_name || `${latest.lat}°, ${latest.lng}°`}
                </div>
              )}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {loadingEntries ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#a8c4e0' }}>Cargando entradas...</div>
                ) : entries.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#a8c4e0' }}>Aún no hay entradas publicadas.</div>
                ) : entries.map((entry, i) => (
                  <div key={entry.id} style={{ padding: '18px 22px', borderBottom: '1px solid rgba(45,125,210,0.1)', borderLeft: i===0?'3px solid #c8863a':'3px solid transparent', cursor: 'pointer' }}
                    onClick={() => mapInstance.current?.flyTo({ center: [entry.lng, entry.lat], zoom: 5 })}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ background: '#1a4a7a', color: '#f0e6c8', fontSize: '0.58rem', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, textTransform: 'uppercase' }}>Día {entry.day_number}</span>
                      <span style={{ fontSize: '0.68rem', color: '#a8c4e0', fontFamily: 'monospace' }}>{format(new Date(entry.created_at), "d MMM yyyy", { locale: es })}</span>
                      {entry.location_name && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#c8863a' }}>📍 {entry.location_name}</span>}
                    </div>
                    <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.98rem', marginBottom: '6px', lineHeight: 1.3 }}>{entry.title}</div>
                    <div style={{ fontFamily: '"Courier Prime", monospace', fontSize: '0.75rem', color: '#a8c4e0', lineHeight: 1.6, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{entry.body}"</div>
                    <div style={{ display: 'flex', gap: '7px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {entry.wind_speed && <span style={{ background: 'rgba(45,125,210,0.12)', border: '1px solid rgba(45,125,210,0.2)', borderRadius: '4px', padding: '3px 7px', fontSize: '0.62rem', color: '#7eb8f7' }}>💨 {entry.wind_speed}kts {entry.wind_dir}</span>}
                      {entry.wave_height && <span style={{ background: 'rgba(45,125,210,0.12)', border: '1px solid rgba(45,125,210,0.2)', borderRadius: '4px', padding: '3px 7px', fontSize: '0.62rem', color: '#7eb8f7' }}>🌊 {entry.wave_height}m</span>}
                      {entry.temperature && <span style={{ background: 'rgba(45,125,210,0.12)', border: '1px solid rgba(45,125,210,0.2)', borderRadius: '4px', padding: '3px 7px', fontSize: '0.62rem', color: '#7eb8f7' }}>🌡️ {entry.temperature}°C</span>}
                      {entry.miles_today && entry.miles_today !== '0' && <span style={{ background: 'rgba(45,125,210,0.12)', border: '1px solid rgba(45,125,210,0.2)', borderRadius: '4px', padding: '3px 7px', fontSize: '0.62rem', color: '#7eb8f7' }}>⚓ {entry.miles_today}nm</span>}
                    </div>
                    {entry.photos?.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(entry.photos.length,4)},1fr)`, gap: '4px', marginTop: '10px' }}>
                        {entry.photos.slice(0,4).map((url,pi) => <img key={pi} src={url} alt="" style={{ width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:'4px' }} />)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'stats' && (
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
              <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.15rem', paddingBottom: '12px', borderBottom: '1px solid rgba(45,125,210,0.15)' }}>📊 Estadísticas del viaje</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[{num:totalMiles.toLocaleString(),label:'millas náuticas'},{num:dayCount,label:'días navegando'},{num:entries.length,label:'entradas'},{num:`${progress}%`,label:'del mundo'}].map(s => (
                  <div key={s.label} style={{ background: 'rgba(45,125,210,0.08)', border: '1px solid rgba(45,125,210,0.15)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', fontWeight: 900, color: '#c8863a', lineHeight: 1 }}>{s.num}</div>
                    <div style={{ fontSize: '0.68rem', color: '#a8c4e0', marginTop: '4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(45,125,210,0.06)', border: '1px solid rgba(45,125,210,0.15)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '8px', color: '#a8c4e0' }}>
                  <span>Progreso total</span><span style={{ color: '#c8863a', fontWeight: 600 }}>{progress}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(45,125,210,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#1a4a7a,#2d7dd2)', borderRadius: '3px' }} />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(168,196,224,0.5)', marginTop: '8px' }}>~{(35834-totalMiles).toLocaleString()} millas restantes</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a8c4e0', marginBottom: '10px' }}>Escalas registradas</div>
                {[...entries].sort((a,b)=>a.day_number-b.day_number).map((e,i) => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(45,125,210,0.08)' }}>
                    <div style={{ width:'22px',height:'22px',background:'#1a4a7a',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',fontWeight:700,flexShrink:0 }}>{i+1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem' }}>{e.location_name || `Día ${e.day_number}`}</div>
                      <div style={{ fontSize: '0.65rem', color: '#a8c4e0', fontFamily: 'monospace' }}>Día {e.day_number}</div>
                    </div>
                    <span style={{ color: '#4ade80', fontSize: '0.7rem' }}>✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'guestbook' && (
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
              <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.15rem', paddingBottom: '12px', borderBottom: '1px solid rgba(45,125,210,0.15)' }}>💬 Mensajes para el Capitán</h2>
              {messages.map(msg => (
                <div key={msg.id} style={{ background: 'rgba(45,125,210,0.05)', border: '1px solid rgba(45,125,210,0.12)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#c8863a', marginBottom: '4px' }}>{msg.author}{msg.city?` — ${msg.city}`:''}</div>
                  <div style={{ fontFamily: '"Courier Prime", monospace', fontSize: '0.78rem', color: '#a8c4e0', lineHeight: 1.5, fontStyle: 'italic' }}>"{msg.body}"</div>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(168,196,224,0.4)', marginTop: '6px' }}>{format(new Date(msg.created_at), "d MMM yyyy", { locale: es })} · {msg.likes} 👍</div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(45,125,210,0.15)', paddingTop: '14px' }}>
                {msgSent ? (
                  <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '8px', padding: '14px', color: '#86efac', fontSize: '0.82rem', textAlign: 'center' }}>✅ ¡Mensaje enviado!</div>
                ) : (
                  <form onSubmit={sendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input value={msgForm.author} onChange={e=>setMsgForm(f=>({...f,author:e.target.value}))} placeholder="Tu nombre" required maxLength={80} style={{ background:'rgba(10,22,40,0.6)',border:'1px solid rgba(45,125,210,0.2)',borderRadius:'6px',color:'#f0e6c8',fontSize:'0.8rem',padding:'8px 10px',outline:'none' }} />
                      <input value={msgForm.city} onChange={e=>setMsgForm(f=>({...f,city:e.target.value}))} placeholder="Ciudad" maxLength={50} style={{ background:'rgba(10,22,40,0.6)',border:'1px solid rgba(45,125,210,0.2)',borderRadius:'6px',color:'#f0e6c8',fontSize:'0.8rem',padding:'8px 10px',outline:'none' }} />
                    </div>
                    <textarea value={msgForm.body} onChange={e=>setMsgForm(f=>({...f,body:e.target.value}))} placeholder="Deja un mensaje de aliento para el Capitán..." required maxLength={500} style={{ background:'rgba(10,22,40,0.6)',border:'1px solid rgba(45,125,210,0.2)',borderRadius:'6px',color:'#f0e6c8',fontSize:'0.8rem',padding:'8px 10px',outline:'none',minHeight:'70px',resize:'vertical',width:'100%' }} />
                    <button type="submit" disabled={msgSending} style={{ background:'linear-gradient(135deg,#1a5a3a,#2d9e6a)',color:'white',border:'none',borderRadius:'6px',padding:'9px 16px',fontSize:'0.78rem',fontWeight:600,cursor:'pointer',alignSelf:'flex-end' }}>
                      {msgSending?'Enviando...':'Enviar mensaje ✉️'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.4)}}
        .mapboxgl-popup-content{background:#0d2545!important;border:1px solid rgba(45,125,210,0.3)!important;color:#f0e6c8!important;border-radius:8px!important;padding:8px!important}
        .mapboxgl-popup-tip{border-top-color:#0d2545!important}
      `}</style>
    </div>
  )
}
