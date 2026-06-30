'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function AccountsManagement() {
  const [users, setUsers] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('VERIFIKATOR');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');

  // Derived state
  const districts = [...new Map(villages.map(v => [v.district.id, v.district])).values()].sort((a,b) => a.name.localeCompare(b.name));
  const filteredVillages = villages.filter(v => v.district.id === selectedDistrictId).sort((a,b) => a.name.localeCompare(b.name));

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch('/api/superadmin/accounts');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
      setVillages(data.villages || []);
    }
    setLoading(false);
  };

  const handleResetPassword = async (userId, role) => {
    if (!confirm('Anda yakin ingin mereset password akun ini ke default?')) return;
    
    setProcessingId(userId);
    const res = await fetch('/api/superadmin/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'RESET_PASSWORD' })
    });

    if (res.ok) {
      alert(`Password berhasil direset! Password baru: ${role === 'KOLEKTOR' ? '12345678' : 'admin123'}`);
      fetchUsers();
    } else {
      alert('Gagal mereset password.');
    }
    setProcessingId(null);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setProcessingId('CREATE');

    if (newRole === 'KOLEKTOR' && !selectedVillageId) {
      alert('Silakan pilih desa untuk akun Kolektor.');
      setProcessingId(null);
      return;
    }

    const res = await fetch('/api/superadmin/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CREATE_USER',
        newUsername,
        newPassword,
        newRole,
        villageId: selectedVillageId || null
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert('Akun berhasil dibuat!');
      setShowCreateForm(false);
      setNewUsername('');
      setNewPassword('');
      setNewRole('VERIFIKATOR');
      setSelectedVillageId('');
      fetchUsers();
    } else {
      alert(data.error || 'Gagal membuat akun.');
    }
    setProcessingId(null);
  };

  const handleDownloadExcel = () => {
    const rows = users.map((u, index) => ({
      'No.': index + 1,
      'Username': u.username,
      'Role': u.role,
      'Area / Desa': u.village ? `${u.village.name} - ${u.village.district.name}` : '-',
      'Desa/Kelurahan': u.village ? u.village.name : '-',
      'Kecamatan': u.village ? u.village.district.name : '-',
      'Status Password': u.isPasswordChanged ? 'Sudah Diganti' : 'Password Default',
      'Terakhir Login': u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }) : 'Belum Pernah'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Akun");
    XLSX.writeFile(workbook, "data_akun_pendataan_nilai_wajar.xlsx");
  };

  if (loading) return <div>Loading data akun...</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Manajemen Akun</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={handleDownloadExcel}>
            Unduh Data (Excel)
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Batal' : '+ Tambah Akun Baru'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', border: '2px solid var(--primary)' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Buat Akun Baru</h2>
          <form onSubmit={handleCreateUser}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newUsername} 
                  onChange={e => setNewUsername(e.target.value)} 
                  required 
                  placeholder="Contoh: Budi_Verifikator"
                />
              </div>
              <div className="form-group">
                <label>Password Awal</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  placeholder="Contoh: admin123"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select 
                  className="input-field" 
                  value={newRole} 
                  onChange={e => setNewRole(e.target.value)}
                >
                  <option value="VERIFIKATOR">Verifikator</option>
                  <option value="SUPERADMIN">Superadmin</option>
                  <option value="KOLEKTOR">Kolektor</option>
                </select>
              </div>
              {newRole === 'KOLEKTOR' && (
                <>
                  <div className="form-group">
                    <label>Pilih Kecamatan</label>
                    <select 
                      className="input-field" 
                      value={selectedDistrictId} 
                      onChange={e => {
                        setSelectedDistrictId(e.target.value);
                        setSelectedVillageId(''); // reset village when district changes
                      }}
                      required
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {districts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Pilih Desa/Kelurahan</label>
                    <select 
                      className="input-field" 
                      value={selectedVillageId} 
                      onChange={e => setSelectedVillageId(e.target.value)}
                      required
                      disabled={!selectedDistrictId}
                    >
                      <option value="">-- Pilih Desa --</option>
                      {filteredVillages.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            <button type="submit" className="btn btn-success" disabled={processingId === 'CREATE'}>
              {processingId === 'CREATE' ? 'Membuat...' : 'Simpan Akun'}
            </button>
          </form>
        </div>
      )}

      <div className="glass-card" style={{ padding: '2rem' }}>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
          Daftar seluruh pengguna sistem. Anda dapat melihat role dan mereset password mereka.
        </p>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Area / Desa</th>
                <th>Terakhir Login</th>
                <th>Status Password</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>
                    <span className="status-badge" style={{ background: '#e2e8f0', color: '#0f172a' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.village ? `${u.village.name} - ${u.village.district.name}` : '-'}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }) : 'Belum Pernah'}
                  </td>
                  <td>
                    {u.isPasswordChanged ? (
                      <span className="status-badge status-verified">Sudah Diganti</span>
                    ) : (
                      <span className="status-badge status-pending">Password Default</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleResetPassword(u.id, u.role)}
                      disabled={processingId === u.id}
                    >
                      {processingId === u.id ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
