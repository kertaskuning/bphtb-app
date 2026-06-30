import './globals.css'

export const metadata = {
  title: 'Pendataan Nilai Wajar',
  description: 'Aplikasi Pendataan Nilai Wajar',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
          </main>
          <footer style={{ position: 'fixed', bottom: 0, width: '100%', backgroundColor: '#3b82f6', color: 'white', textAlign: 'center', padding: '0.5rem', fontSize: '0.85rem', zIndex: 1000, boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
            Pendataan Nilai Wajar | Dikembangkan Oleh MSN | versi 1.0
          </footer>
        </div>
      </body>
    </html>
  )
}
