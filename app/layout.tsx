// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DON LEÓN · Bitácora Vuelta al Mundo',
  description: 'Sigue en tiempo real la vuelta al mundo del Capitán León a bordo del velero Don León.',
  openGraph: {
    title: 'DON LEÓN · Vuelta al Mundo en Velero',
    description: 'Sigue la ruta, lee los diarios de a bordo y deja un mensaje de aliento.',
    type: 'website',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600&family=Courier+Prime:ital@0;1&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
