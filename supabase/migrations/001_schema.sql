-- ============================================
-- DON LEÓN — Esquema de Base de Datos
-- Ejecutar en: Supabase → SQL Editor
-- ============================================

-- 1. TABLA DE ENTRADAS DE BITÁCORA
create table if not exists entries (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  day_number   integer not null,
  title        text not null,
  body         text not null,
  lat          numeric(9,6) not null,
  lng          numeric(9,6) not null,
  location_name text,
  -- Condiciones náuticas
  wind_speed   text,
  wind_dir     text,
  wave_height  text,
  temperature  text,
  weather      text,
  heading      text,
  miles_today  text,
  -- Fotos (array de URLs de Supabase Storage)
  photos       text[] default '{}',
  -- Publicado o borrador
  published    boolean default true
);

-- 2. TABLA DE MENSAJES (libro de visitas)
create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  author     text not null,
  city       text,
  body       text not null,
  likes      integer default 0,
  approved   boolean default true
);

-- 3. TABLA DE CHECKINS DE SEGURIDAD
create table if not exists checkins (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  lat        numeric(9,6),
  lng        numeric(9,6),
  note       text default 'Todo bien a bordo'
);

-- 4. TABLA DE CONFIGURACIÓN DEL VIAJE
create table if not exists trip_config (
  key   text primary key,
  value text
);

-- Datos iniciales de configuración
insert into trip_config (key, value) values
  ('trip_name', 'Vuelta al Mundo'),
  ('boat_name', 'Don León'),
  ('start_date', '2025-05-26'),
  ('start_port', 'Mazatlán, México'),
  ('total_miles_planned', '35834'),
  ('captain_name', 'León')
on conflict (key) do nothing;

-- ============================================
-- SEGURIDAD: Row Level Security (RLS)
-- ============================================

-- Entradas: lectura pública, escritura solo con service_role (API protegida)
alter table entries enable row level security;
create policy "Entradas visibles para todos"
  on entries for select using (published = true);
create policy "Solo admin puede insertar"
  on entries for insert with check (false); -- bloqueado, solo via service_role

-- Mensajes: lectura pública, inserción pública (aprobados por defecto)
alter table messages enable row level security;
create policy "Mensajes visibles"
  on messages for select using (approved = true);
create policy "Cualquiera puede dejar mensaje"
  on messages for insert with check (true);

-- Checkins: solo lectura pública
alter table checkins enable row level security;
create policy "Checkins visibles"
  on checkins for select using (true);
create policy "Solo admin puede insertar checkin"
  on checkins for insert with check (false);

-- Trip config: solo lectura
alter table trip_config enable row level security;
create policy "Config visible"
  on trip_config for select using (true);

-- ============================================
-- STORAGE: Bucket para fotos
-- ============================================
insert into storage.buckets (id, name, public)
  values ('entry-photos', 'entry-photos', true)
  on conflict do nothing;

create policy "Fotos públicas"
  on storage.objects for select
  using (bucket_id = 'entry-photos');

create policy "Solo admin puede subir fotos"
  on storage.objects for insert
  with check (bucket_id = 'entry-photos' and auth.role() = 'service_role');

-- ============================================
-- DATOS DE EJEMPLO (puedes borrar esto después)
-- ============================================
insert into entries (day_number, title, body, lat, lng, location_name, wind_speed, wind_dir, wave_height, temperature, weather, heading, miles_today, photos, created_at)
values
(47, 'Vientos del norte y mar de 3 metros',
 'Salimos de Panamá con viento favorable pero al entrar al Golfo de Tehuantepec los vientos cambiaron radicalmente. La madrugada fue intensa, turnos de 3 horas cada uno. Amanecer espectacular, valió la pena cada minuto.',
 9.370278, -84.716667, 'Golfo de Tehuantepec',
 '12', 'NE', '3.2', '28', 'Parcial', '275', '142', '{}',
 now() - interval '0 days'),

(41, '¡Cruzamos el Canal!',
 'Un momento histórico para nosotros. 8 horas de esclusas, trámites y maniobras. El velero quedó perfecto. Del Atlántico al Pacífico, ahora sí empieza la aventura grande.',
 9.080278, -79.681944, 'Canal de Panamá',
 '5', 'S', '0.5', '32', 'Soleado', '090', '0', '{}',
 now() - interval '6 days'),

(28, 'Snorkel en Roatán y descanso merecido',
 '3 días de pausa en el paraíso. Corales increíbles, tortuga marina a 2 metros. El equipo de a bordo agradecido. Revisión de motor y avituallamiento para el tramo del Canal.',
 16.321944, -86.535278, 'Islas de la Bahía, Honduras',
 '8', 'E', '1.0', '30', 'Despejado', '000', '0', '{}',
 now() - interval '19 days');

insert into messages (author, city, body, likes)
values
('Familia Acha', 'Ciudad de México', 'Papá, estamos muy orgullosos de ti. Seguimos cada punto en el mapa. ¡El velero se ve increíble en el Canal de Panamá! Te amamos mucho.', 142),
('Club Náutico Vallarta', 'Puerto Vallarta', '¡Vientos a favor, Capitán! Desde el club te seguimos con mucho orgullo. Eres inspiración para todos los marineros.', 87),
('Roberto M.', 'Guadalajara', 'Qué aventura tan épica. El relato del Golfo de Tehuantepec me tuvo al borde del asiento. ¡Ánimo Capitán!', 54);

insert into checkins (lat, lng, note)
values (9.370278, -84.716667, 'Todo bien a bordo, vientos favorables');
