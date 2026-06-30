'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push('/');
        }
      });
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (!user) return <div>Loading layout...</div>;

  return (
    <div className="dashboard-layout">
      {/* Mobile Header (Hidden on Desktop) */}
      <div className="mobile-header">
        <div className="sidebar-title" style={{ margin: 0, fontSize: '1.25rem' }}>Pendataan Nilai Wajar</div>
        <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(true)}>
          ☰
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-title">Pendataan Nilai Wajar</div>
        <div className="user-info">
          <div style={{ marginBottom: '0.25rem', opacity: 0.8, fontSize: '0.8rem' }}>Logged in as:</div>
          {(() => {
            if (user.role === 'KOLEKTOR' && user.username.includes('_')) {
              const [village, district] = user.username.split('_');
              const formatName = (str) => str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              return (
                <>
                  <strong style={{ color: 'var(--primary)', display: 'block' }}>Kolektor Desa {formatName(village)}</strong>
                  <span style={{ opacity: 0.9, fontSize: '0.85rem' }}>Kecamatan {formatName(district)}</span>
                </>
              );
            }
            return (
              <>
                <strong style={{ color: 'var(--primary)', display: 'block' }}>{user.username}</strong>
                <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>{user.role}</span>
              </>
            );
          })()}
        </div>

        <nav className="sidebar-nav">
          {user.role === 'KOLEKTOR' && (
            <Link href="/dashboard/kolektor" className={`sidebar-link ${pathname === '/dashboard/kolektor' ? 'active' : ''}`}>
              Dashboard Input
            </Link>
          )}

          {user.role === 'VERIFIKATOR' && (
            <Link href="/dashboard/verifikator" className={`sidebar-link ${pathname === '/dashboard/verifikator' ? 'active' : ''}`}>
              Cek Progres & Verifikasi
            </Link>
          )}

          {user.role === 'SUPERADMIN' && (
            <>
              <Link href="/dashboard/verifikator" className={`sidebar-link ${pathname === '/dashboard/verifikator' ? 'active' : ''}`}>
                Cek Progres
              </Link>
              <Link href="/dashboard/accounts" className={`sidebar-link ${pathname === '/dashboard/accounts' ? 'active' : ''}`}>
                Manajemen Akun
              </Link>
            </>
          )}

          {user.role === 'KECAMATAN' && (
            <Link href="/dashboard/kecamatan" className={`sidebar-link ${pathname === '/dashboard/kecamatan' ? 'active' : ''}`}>
              Pantau Progres
            </Link>
          )}

          <Link href="/dashboard/change-password" className={`sidebar-link ${pathname === '/dashboard/change-password' ? 'active' : ''}`}>
            Ganti Password
          </Link>
        </nav>

        <button onClick={handleLogout} className="btn btn-danger" style={{ marginTop: 'auto' }}>
          Logout
        </button>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
