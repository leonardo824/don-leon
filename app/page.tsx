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
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const entriesRef = useRef<Entry[]>([])
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetch('/api/entries')
      .then(r => r.json())
      .then((res) => {
        const data: Entry[] = Array.isArray(res) ? res : []
        setEntries(data)
        entriesRef.current = data
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
    mapInstance.current = map
    return () => { map.remove(); mapInstance.current = null }
  }, [])

  useEffect(() => {
    if (!mapInstance.current || entries.length === 0) return
    const map = mapInstance.current
    const doRoute = () => drawRoute(map, entries)
    if (map.loaded()) doRoute()
    else map.on('load', doRoute)
  }, [entries])

  function drawRoute(map: mapboxgl.Map, entries: Entry[]) {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    if (tooltipRef.current) { tooltipRef.current.remove(); tooltipRef.current = null }

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

    // Tooltip flotante — uno solo, lo movemos con JS
    const tooltip = document.createElement('div')
    tooltip.style.cssText = `
      position:fixed;
      background:rgba(8,18,38,0.96);
      border:1px solid rgba(45,125,210,0.5);
      border-radius:8px;
      padding:8px 12px;
      pointer-events:none;
      opacity:0;
      transition:opacity 0.15s;
      box-shadow:0 6px 20px rgba(0,0,0,0.5);
      z-index:999;
      min-width:140px;
    `
    document.body.appendChild(tooltip)
    tooltipRef.current = tooltip

    sorted.forEach((entry, i) => {
      const isLast = i === sorted.length - 1
      const size = isLast ? 20 : 12
      const color = isLast ? '#4ade80' : '#c8863a'
      const glow = isLast ? '#4ade80' : '#c8863a'

      // Dot simple — es el elemento del marker directamente
      const dot = document.createElement('div')
      dot.style.cssText = `
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:${color};
        border:2px solid rgba(255,255,255,0.75);
        box-shadow:0 0 ${isLast?'12px':'6px'} ${glow};
        cursor:pointer;
        transition:transform 0.15s, box-shadow 0.15s;
      `

      dot.addEventListener('mouseenter', (e) => {
       
        dot.style.boxShadow = `0 0 ${isLast?'20px':'14px'} ${glow}`
        tooltip.innerHTML = `
          <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.12em;color:#a8c4e0;margin-bottom:3px;font-family:Inter,sans-serif">Día ${entry.day_number}</div>
          <div style="font-size:0.82rem;font-weight:700;color:#f0e6c8;font-family:'Playfair Display',serif;margin-bottom:${entry.wind_speed?'4px':'0'};line-height:1.25">${entry.title}</div>
          ${entry.wind_speed ? `<div style="font-size:0.68rem;color:#7eb8f7;font-family:monospace">💨 ${entry.wind_speed}kts ${entry.wind_dir||''}</div>` : ''}
          <div style="font-size:0.6rem;color:rgba(126,184,247,0.5);margin-top:4px;font-family:Inter,sans-serif">Click para leer →</div>
        `
        tooltip.style.opacity = '1'
        // Position tooltip above cursor
        const rect = dot.getBoundingClientRect()
        tooltip.style.left = (rect.left + rect.width/2 - tooltip.offsetWidth/2) + 'px'
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px'
      })

      dot.addEventListener('mousemove', () => {
        const rect = dot.getBoundingClientRect()
        tooltip.style.left = (rect.left + rect.width/2 - tooltip.offsetWidth/2) + 'px'
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px'
      })

      dot.addEventListener('mouseleave', () => {
        
        dot.style.boxShadow = `0 0 ${isLast?'12px':'6px'} ${glow}`
        tooltip.style.opacity = '0'
      })

      dot.addEventListener('click', (e) => {
        e.stopPropagation()
        tooltip.style.opacity = '0'
        const found = entriesRef.current.find(en => en.id === entry.id)
        if (found) setSelectedEntry(found)
      })

      // Usamos el dot directamente como elemento del marker, sin wrapper
      const marker = new mapboxgl.Marker({ element: dot, anchor: 'center' })
        .setLngLat([entry.lng, entry.lat])
        .addTo(map)

      markersRef.current.push(marker)
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

  const sortedEntries = [...entries].sort((a,b) => b.day_number - a.day_number)
  const latest = sortedEntries[0]
  const dayCount = latest?.day_number || 0
  const progress = Math.round((totalMiles / 35834) * 100)

  return (
    <div style={{ minHeight:'100vh', background:'#0a1628', fontFamily:'Inter,sans-serif', color:'#f0e6c8', display:'flex', flexDirection:'column' }}>

      {selectedEntry && (
        <div onClick={() => setSelectedEntry(null)}
          style={{ position:'fixed', inset:0, background:'rgba(4,10,22,0.88)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)', padding:'20px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'#0d2545', border:'1px solid rgba(45,125,210,0.35)', borderRadius:'14px', width:'100%', maxWidth:'620px', maxHeight:'88vh', overflowY:'auto', padding:'36px', position:'relative', boxShadow:'0 30px 80px rgba(0,0,0,0.6)' }}>
            <button onClick={() => setSelectedEntry(null)}
              style={{ position:'absolute', top:'16px', right:'18px', background:'transparent', border:'none', color:'#a8c4e0', fontSize:'1.4rem', cursor:'pointer', lineHeight:1 }}>✕</button>
            <div style={{ fontSize:'0.62rem', textTransform:'uppercase', letterSpacing:'0.14em', color:'#a8c4e0', marginBottom:'6px' }}>Día {selectedEntry.day_number} del viaje</div>
            <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.65rem', fontWeight:700, color:'#f0e6c8', marginBottom:'8px', lineHeight:1.25 }}>{selectedEntry.title}</div>
            <div style={{ display:'flex', gap:'12px', marginBottom:'22px', flexWrap:'wrap' }}>
              {selectedEntry.location_name && <span style={{ fontSize:'0.72rem', color:'#c8863a' }}>📍 {selectedEntry.location_name}</span>}
              <span style={{ fontSize:'0.68rem', color:'#a8c4e0', fontFamily:'monospace' }}>{format(new Date(selectedEntry.created_at), "d 'de' MMMM yyyy", { locale: es })}</span>
            </div>
            <div style={{ fontFamily:'"Courier Prime",monospace', fontSize:'0.95rem', color:'#c8d8e8', lineHeight:1.9, fontStyle:'italic', marginBottom:'26px', whiteSpace:'pre-line', borderLeft:'3px solid rgba(200,134,58,0.3)', paddingLeft:'16px' }}>
              {selectedEntry.body}
            </div>
            {(selectedEntry.wind_speed || selectedEntry.wave_height || selectedEntry.temperature || selectedEntry.weather || selectedEntry.heading || selectedEntry.miles_today) && (
              <div style={{ background:'rgba(45,125,210,0.06)', border:'1px solid rgba(45,125,210,0.15)', borderRadius:'10px', padding:'14px', marginBottom:'20px' }}>
                <div style={{ fontSize:'0.62rem', textTransform:'uppercase', letterSpacing:'0.12em', color:'#a8c4e0', marginBottom:'10px' }}>Condiciones náuticas</div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {selectedEntry.wind_speed && <span style={{ background:'rgba(45,125,210,0.12)', border:'1px solid rgba(45,125,210,0.2)', borderRadius:'5px', padding:'5px 11px', fontSize:'0.72rem', color:'#7eb8f7' }}>💨 {selectedEntry.wind_speed}kts {selectedEntry.wind_dir}</span>}
                  {selectedEntry.wave_height && <span style={{ background:'rgba(45,125,210,0.12)', border:'1px solid rgba(45,125,210,0.2)', borderRadius:'5px', padding:'5px 11px', fontSize:'0.72rem', color:'#7eb8f7' }}>🌊 {selectedEntry.wave_height}m</span>}
                  {selectedEntry.temperature && <span style={{ background:'rgba(45,125,210,0.12)', border:'1px solid rgba(45,125,210,0.2)', borderRadius:'5px', padding:'5px 11px', fontSize:'0.72rem', color:'#7eb8f7' }}>🌡️ {selectedEntry.temperature}°C</span>}
                  {selectedEntry.weather && <span style={{ background:'rgba(45,125,210,0.12)', border:'1px solid rgba(45,125,210,0.2)', borderRadius:'5px', padding:'5px 11px', fontSize:'0.72rem', color:'#7eb8f7' }}>☁️ {selectedEntry.weather}</span>}
                  {selectedEntry.heading && <span style={{ background:'rgba(45,125,210,0.12)', border:'1px solid rgba(45,125,210,0.2)', borderRadius:'5px', padding:'5px 11px', fontSize:'0.72rem', color:'#7eb8f7' }}>🧭 {selectedEntry.heading}°</span>}
                  {selectedEntry.miles_today && selectedEntry.miles_today !== '0' && <span style={{ background:'rgba(45,125,210,0.12)', border:'1px solid rgba(45,125,210,0.2)', borderRadius:'5px', padding:'5px 11px', fontSize:'0.72rem', color:'#7eb8f7' }}>⚓ {selectedEntry.miles_today}nm</span>}
                </div>
              </div>
            )}
            {selectedEntry.photos?.length > 0 && (
              <div>
                <div style={{ fontSize:'0.62rem', textTransform:'uppercase', letterSpacing:'0.12em', color:'#a8c4e0', marginBottom:'10px' }}>Fotos</div>
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(selectedEntry.photos.length,3)},1fr)`, gap:'8px' }}>
                  {selectedEntry.photos.map((url,i) => <img key={i} src={url} alt="" style={{ width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:'8px', cursor:'pointer' }} onClick={() => window.open(url,'_blank')} />)}
                </div>
              </div>
            )}
            <div style={{ marginTop:'24px', textAlign:'center' }}>
              <button onClick={() => setSelectedEntry(null)} style={{ background:'transparent', border:'1px solid rgba(45,125,210,0.3)', color:'#a8c4e0', borderRadius:'6px', padding:'8px 20px', fontSize:'0.75rem', cursor:'pointer' }}>Cerrar ✕</button>
            </div>
          </div>
        </div>
      )}

      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 28px', background:'rgba(10,22,40,0.97)', borderBottom:'1px solid rgba(45,125,210,0.3)', position:'sticky', top:0, zIndex:100 }}>
        <div>
          <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.4rem', fontWeight:900 }}>DON <span style={{ color:'#c8863a' }}>LEÓN</span></div>
          <div style={{ fontSize:'0.6rem', color:'#a8c4e0', letterSpacing:'0.15em', textTransform:'uppercase', marginTop:'2px' }}>Bitácora · Vuelta al Mundo</div>
        </div>
        <div style={{ display:'flex', gap:'20px' }}>
          {[{label:'Días',val:dayCount},{label:'Millas',val:totalMiles.toLocaleString()},{label:'% Ruta',val:`${progress}%`}].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.1rem', color:'#c8863a', fontWeight:700 }}>{s.val}</div>
              <div style={{ fontSize:'0.58rem', color:'#a8c4e0', textTransform:'uppercase', letterSpacing:'0.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
          {(['feed','stats','guestbook'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:'7px 14px', border:`1px solid ${tab===t?'#2d7dd2':'transparent'}`, background:tab===t?'#1a4a7a':'transparent', color:tab===t?'#f0e6c8':'#a8c4e0', borderRadius:'6px', cursor:'pointer', fontSize:'0.78rem' }}>
              {t==='feed'?'📖 Bitácora':t==='stats'?'📊 Ruta':'💬 Mensajes'}
            </button>
          ))}
          <a href="/login" style={{ marginLeft:'8px', color:'#a8c4e0', fontSize:'0.7rem', textDecoration:'none', opacity:0.4 }}>⚓</a>
        </div>
      </nav>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', flex:1, height:'calc(100vh - 65px)' }}>
        <div ref={mapRef} style={{ width:'100%', height:'100%' }} />
        <div style={{ background:'#0d2545', borderLeft:'1px solid rgba(45,125,210,0.2)', overflowY:'auto', display:'flex', flexDirection:'column' }}>

          {tab === 'feed' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'18px 22px 12px', borderBottom:'1px solid rgba(45,125,210,0.15)' }}>
                <h2 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.15rem', marginBottom:'3px' }}>Bitácora del Capitán</h2>
                <p style={{ fontSize:'0.72rem', color:'#a8c4e0' }}>{entries.length} entradas publicadas</p>
              </div>
              {latest && (
                <div style={{ background:'rgba(74,222,128,0.06)', borderBottom:'1px solid rgba(74,222,128,0.15)', padding:'10px 22px', fontSize:'0.72rem', color:'#86efac' }}>
                  <span style={{ display:'inline-block', width:'7px', height:'7px', background:'#4ade80', borderRadius:'50%', marginRight:'7px', animation:'pulse 2s infinite', verticalAlign:'middle' }} />
                  Última posición: {latest.location_name || `${latest.lat}°, ${latest.lng}°`}
                </div>
              )}
              <div style={{ overflowY:'auto', flex:1 }}>
                {loadingEntries ? (
                  <div style={{ padding:'40px', textAlign:'center', color:'#a8c4e0' }}>Cargando entradas...</div>
                ) : sortedEntries.length === 0 ? (
                  <div style={{ padding:'40px', textAlign:'center', color:'#a8c4e0' }}>Aún no hay entradas publicadas.</div>
                ) : sortedEntries.map((entry, i) => (
                  <div key={entry.id}
                    onClick={() => { setSelectedEntry(entry); mapInstance.current?.flyTo({ center:[entry.lng, entry.lat], zoom:5 }) }}
                    style={{ padding:'18px 22px', borderBottom:'1px solid rgba(45,125,210,0.1)', borderLeft:i===0?'3px solid #c8863a':'3px solid transparent', cursor:'pointer', transition:'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background='rgba(45,125,210,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                    <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'8px', flexWrap:'wrap' }}>
                      <span style={{ background:'#1a4a7a', color:'#f0e6c8', fontSize:'0.58rem', padding:'2px 8px', borderRadius:'20px', fontWeight:600, textTransform:'uppercase' }}>Día {entry.day_number}</span>
                      <span style={{ fontSize:'0.68rem', color:'#a8c4e0', fontFamily:'monospace' }}>{format(new Date(entry.created_at), "d MMM yyyy", { locale: es })}</span>
                      {entry.location_name && <span style={{ marginLeft:'auto', fontSize:'0.65rem', color:'#c8863a' }}>📍 {entry.location_name}</span>}
                    </div>
                    <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'0.98rem', marginBottom:'6px', lineHeight:1.3 }}>{entry.title}</div>
                    <div style={{ fontFamily:'"Courier Prime",monospace', fontSize:'0.75rem', color:'#a8c4e0', lineHeight:1.6, fontStyle:'italic', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>"{entry.body}"</div>
                    <div style={{ display:'flex', gap:'7px', marginTop:'10px', flexWrap:'wrap' }}>
                      {entry.wind_speed && <span style={{ background:'rgba(45,125,210,0.12)', border:'1px solid rgba(45,125,210,0.2)', borderRadius:'4px', padding:'3px 7px', fontSize:'0.62rem', color:'#7eb8f7' }}>💨 {entry.wind_speed}kts {entry.wind_dir}</span>}
                      {entry.wave_height && <span style={{ background:'rgba(45,125,210,0.12)', border:'1px solid rgba(45,125,210,0.2)', borderRadius:'4px', padding:'3px 7px', fontSize:'0.62rem', color:'#7eb8f7' }}>🌊 {entry.wave_height}m</span>}
                      {entry.temperature && <span style={{ background:'rgba(45,125,210,0.12)', border:'1px solid rgba(45,125,210,0.2)', borderRadius:'4px', padding:'3px 7px', fontSize:'0.62rem', color:'#7eb8f7' }}>🌡️ {entry.temperature}°C</span>}
                      {entry.miles_today && entry.miles_today !== '0' && <span style={{ background:'rgba(45,125,210,0.12)', border:'1px solid rgba(45,125,210,0.2)', borderRadius:'4px', padding:'3px 7px', fontSize:'0.62rem', color:'#7eb8f7' }}>⚓ {entry.miles_today}nm</span>}
                    </div>
                    <div style={{ fontSize:'0.62rem', color:'rgba(126,184,247,0.5)', marginTop:'8px' }}>Toca para leer la entrada completa →</div>
                    {entry.photos?.length > 0 && (
                      <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(entry.photos.length,4)},1fr)`, gap:'4px', marginTop:'10px' }}>
                        {entry.photos.slice(0,4).map((url,pi) => <img key={pi} src={url} alt="" style={{ width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:'4px' }} />)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'stats' && (
            <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:'14px', overflowY:'auto' }}>
              <h2 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.15rem', paddingBottom:'12px', borderBottom:'1px solid rgba(45,125,210,0.15)' }}>📊 Estadísticas del viaje</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                {[{num:totalMiles.toLocaleString(),label:'millas náuticas'},{num:dayCount,label:'días navegando'},{num:entries.length,label:'entradas'},{num:`${progress}%`,label:'del mundo'}].map(s => (
                  <div key={s.label} style={{ background:'rgba(45,125,210,0.08)', border:'1px solid rgba(45,125,210,0.15)', borderRadius:'10px', padding:'16px', textAlign:'center' }}>
                    <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'2rem', fontWeight:900, color:'#c8863a', lineHeight:1 }}>{s.num}</div>
                    <div style={{ fontSize:'0.68rem', color:'#a8c4e0', marginTop:'4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'rgba(45,125,210,0.06)', border:'1px solid rgba(45,125,210,0.15)', borderRadius:'10px', padding:'16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', marginBottom:'8px', color:'#a8c4e0' }}>
                  <span>Progreso total</span><span style={{ color:'#c8863a', fontWeight:600 }}>{progress}%</span>
                </div>
                <div style={{ height:'6px', background:'rgba(45,125,210,0.15)', borderRadius:'3px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#1a4a7a,#2d7dd2)', borderRadius:'3px' }} />
                </div>
                <div style={{ fontSize:'0.65rem', color:'rgba(168,196,224,0.5)', marginTop:'8px' }}>~{(35834-totalMiles).toLocaleString()} millas restantes</div>
              </div>
              <div>
                <div style={{ fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.12em', color:'#a8c4e0', marginBottom:'10px' }}>Escalas registradas</div>
                {[...entries].sort((a,b)=>a.day_number-b.day_number).map((e,i) => (
                  <div key={e.id} onClick={() => setSelectedEntry(e)} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:'1px solid rgba(45,125,210,0.08)', cursor:'pointer' }}>
                    <div style={{ width:'22px', height:'22px', background:'#1a4a7a', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700, flexShrink:0 }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'0.82rem' }}>{e.location_name || `Día ${e.day_number}`}</div>
                      <div style={{ fontSize:'0.65rem', color:'#a8c4e0', fontFamily:'monospace' }}>Día {e.day_number}</div>
                    </div>
                    <span style={{ color:'#4ade80', fontSize:'0.7rem' }}>✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'guestbook' && (
            <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:'12px', overflowY:'auto' }}>
              <h2 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.15rem', paddingBottom:'12px', borderBottom:'1px solid rgba(45,125,210,0.15)' }}>💬 Mensajes para el Capitán</h2>
              {messages.map(msg => (
                <div key={msg.id} style={{ background:'rgba(45,125,210,0.05)', border:'1px solid rgba(45,125,210,0.12)', borderRadius:'8px', padding:'12px 14px' }}>
                  <div style={{ fontSize:'0.72rem', fontWeight:600, color:'#c8863a', marginBottom:'4px' }}>{msg.author}{msg.city?` — ${msg.city}`:''}</div>
                  <div style={{ fontFamily:'"Courier Prime",monospace', fontSize:'0.78rem', color:'#a8c4e0', lineHeight:1.5, fontStyle:'italic' }}>"{msg.body}"</div>
                  <div style={{ fontSize:'0.62rem', color:'rgba(168,196,224,0.4)', marginTop:'6px' }}>{format(new Date(msg.created_at), "d MMM yyyy", { locale: es })} · {msg.likes} 👍</div>
                </div>
              ))}
              <div style={{ borderTop:'1px solid rgba(45,125,210,0.15)', paddingTop:'14px' }}>
                {msgSent ? (
                  <div style={{ background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:'8px', padding:'14px', color:'#86efac', fontSize:'0.82rem', textAlign:'center' }}>✅ ¡Mensaje enviado!</div>
                ) : (
                  <form onSubmit={sendMessage} style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                      <input value={msgForm.author} onChange={e=>setMsgForm(f=>({...f,author:e.target.value}))} placeholder="Tu nombre" required maxLength={80} style={{ background:'rgba(10,22,40,0.6)', border:'1px solid rgba(45,125,210,0.2)', borderRadius:'6px', color:'#f0e6c8', fontSize:'0.8rem', padding:'8px 10px', outline:'none' }} />
                      <input value={msgForm.city} onChange={e=>setMsgForm(f=>({...f,city:e.target.value}))} placeholder="Ciudad" maxLength={50} style={{ background:'rgba(10,22,40,0.6)', border:'1px solid rgba(45,125,210,0.2)', borderRadius:'6px', color:'#f0e6c8', fontSize:'0.8rem', padding:'8px 10px', outline:'none' }} />
                    </div>
                    <textarea value={msgForm.body} onChange={e=>setMsgForm(f=>({...f,body:e.target.value}))} placeholder="Deja un mensaje de aliento para el Capitán..." required maxLength={500} style={{ background:'rgba(10,22,40,0.6)', border:'1px solid rgba(45,125,210,0.2)', borderRadius:'6px', color:'#f0e6c8', fontSize:'0.8rem', padding:'8px 10px', outline:'none', minHeight:'70px', resize:'vertical', width:'100%' }} />
                    <button type="submit" disabled={msgSending} style={{ background:'linear-gradient(135deg,#1a5a3a,#2d9e6a)', color:'white', border:'none', borderRadius:'6px', padding:'9px 16px', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', alignSelf:'flex-end' }}>
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
      `}</style>
    </div>
  )
}
