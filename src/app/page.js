'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok) {
        if (!data.user.isPasswordChanged) {
          router.push('/dashboard/change-password');
        } else {
          if (data.user.role === 'KOLEKTOR') {
            router.push('/dashboard/kolektor');
          } else if (data.user.role === 'KECAMATAN') {
            router.push('/dashboard/kecamatan');
          } else {
            router.push('/dashboard/verifikator');
          }
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-card">
        <h1 className="auth-title">PENDATAAN NILAI WAJAR</h1>
        <p className="auth-subtitle">BAPENDA KABUPATEN PURWAKARTA</p>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              className="input-field" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              placeholder="Masukkan username"
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ marginBottom: 0 }}>Password</label>
              <a 
                href="https://wa.me/628515123059?text=Halo%20Admin,%20saya%20lupa%20password%20akun%20Aplikasi%20Nilai%20Wajar%20saya.%20Mohon%20bantuannya%20untuk%20reset%20password." 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}
              >
                Lupa password?
              </a>
            </div>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="Masukkan password"
            />
          </div>
            <button type="submit" disabled={loading} className="btn btn-auth" style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
        </form>
      </div>
    </div>
  );
}
