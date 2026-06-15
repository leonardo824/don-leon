# ⛵ DON LEÓN — Bitácora Vuelta al Mundo

Aplicación web para seguir en tiempo real la vuelta al mundo del Capitán León.

---

## 🚀 Guía de instalación paso a paso

### PASO 1 — Crea la cuenta en Supabase (base de datos + fotos)

1. Ve a [supabase.com](https://supabase.com) → **Start for free**
2. Crea un proyecto nuevo (elige región: South America São Paulo o US East)
3. Guarda bien la contraseña del proyecto
4. Ve a **Settings → API** y copia:
   - `Project URL` → es tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → es tu `SUPABASE_SERVICE_ROLE_KEY`

5. Ve a **SQL Editor** → copia y pega todo el contenido de `supabase/migrations/001_schema.sql` → **Run**

---

### PASO 2 — Crea la cuenta en Mapbox (mapas)

1. Ve a [account.mapbox.com](https://account.mapbox.com) → crea cuenta gratis
2. En el dashboard, copia tu **Default public token**
   → es tu `NEXT_PUBLIC_MAPBOX_TOKEN`

> El tier gratuito de Mapbox incluye 50,000 cargas de mapa/mes, más que suficiente.

---

### PASO 3 — Configura las variables de entorno

```bash
cp .env.example .env.local
```

Abre `.env.local` y llena todos los valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
CAPTAIN_PASSWORD=LeonDeLaMar2025!   ← elige una contraseña segura
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### PASO 4 — Instala y corre en local

```bash
# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — deberías ver la bitácora con datos de ejemplo.

Para entrar al panel del Capitán: [http://localhost:3000/login](http://localhost:3000/login)

---

### PASO 5 — Deploy en Vercel (producción)

1. Sube el código a GitHub:
   ```bash
   git init
   git add .
   git commit -m "Don León — launch 🚀"
   git remote add origin https://github.com/tu-usuario/don-leon.git
   git push -u origin main
   ```

2. Ve a [vercel.com](https://vercel.com) → **New Project** → importa tu repo de GitHub

3. En Vercel, ve a **Settings → Environment Variables** y agrega todas las variables de `.env.local`

4. Click **Deploy** → en 2 minutos tienes tu URL pública (ej: `don-leon.vercel.app`)

5. (Opcional) Conecta tu dominio personalizado en **Settings → Domains**

---

## 📱 Cómo lo usa el Capitán

1. Abrir el navegador y ir a `tudominio.com/login`
2. Ingresar la contraseña de capitán
3. Llenar el formulario con coordenadas, texto, condiciones y fotos
4. Dar click en **Publicar** → aparece inmediatamente en el mapa público

**Tip para coordenadas:** Google Maps → click derecho en tu posición → las coordenadas decimales aparecen arriba del menú.

**Modo offline:** Si el Capitán tiene mala señal, puede escribir la entrada en notas y publicarla cuando tenga conexión.

---

## 🔐 Sistema de autenticación

El acceso del Capitán funciona así:
- La contraseña se guarda solo en las variables de entorno del servidor (nunca en el código)
- Al entrar, se crea una cookie `httpOnly` que dura 30 días
- El middleware de Next.js protege todas las rutas `/admin/*`
- Las API routes que crean/modifican datos verifican la cookie en el servidor
- Los visitantes solo pueden leer entradas y dejar mensajes

Para cambiar la contraseña: actualiza `CAPTAIN_PASSWORD` en Vercel → Redeploy.

---

## 🗺️ Estructura del proyecto

```
don-leon/
├── app/
│   ├── page.tsx              ← Página pública (mapa + bitácora)
│   ├── login/page.tsx        ← Login del Capitán
│   ├── admin/page.tsx        ← Panel del Capitán (protegido)
│   └── api/
│       ├── auth/route.ts     ← Login/logout API
│       ├── entries/route.ts  ← CRUD de entradas
│       ├── entries/upload/   ← Subida de fotos
│       └── messages/route.ts ← Libro de visitas
├── lib/
│   ├── supabase.ts           ← Cliente de base de datos
│   └── auth.ts               ← Utilidades de autenticación
├── middleware.ts              ← Protección de rutas
├── supabase/migrations/
│   └── 001_schema.sql        ← Schema completo de BD
├── .env.example              ← Template de variables
└── README.md                 ← Esta guía
```

---

## 💰 Costos estimados

| Servicio | Tier | Costo |
|----------|------|-------|
| Vercel | Hobby | **Gratis** |
| Supabase | Free (500MB DB, 1GB storage) | **Gratis** |
| Mapbox | Free (50k cargas/mes) | **Gratis** |
| Dominio (.com) | — | ~$12 USD/año |

**Total: prácticamente $0** hasta que tengas miles de visitantes diarios.

---

## 🆘 Funcionalidades futuras (Fase 2)

- [ ] Notificaciones por WhatsApp/email cuando el Capitán publica
- [ ] Integración con AIS (rastreo automático de barco por satélite)
- [ ] App móvil para que el Capitán publique más fácil
- [ ] Modo offline con sincronización automática
- [ ] Galería de fotos por etapa
- [ ] Sistema de likes en los mensajes

---

*Buen viento y mar bella, Capitán.* ⛵
