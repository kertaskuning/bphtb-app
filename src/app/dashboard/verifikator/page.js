'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function VerifikatorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [villageDetail, setVillageDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState({});
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [userRole, setUserRole] = useState(null);

  // Add Object State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newBlok, setNewBlok] = useState('');
  const [newMinValue, setNewMinValue] = useState('');
  const [newMaxValue, setNewMaxValue] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit Object State
  const [editObjectData, setEditObjectData] = useState(null);
  const [editing, setEditing] = useState(false);

  const formatCurrency = (val) => {
    if (!val) return '';
    const raw = val.replace(/[^0-9]/g, '');
    if (!raw) return '';
    return 'Rp ' + parseInt(raw, 10).toLocaleString('id-ID');
  };

  const parseCurrency = (val) => {
    if (!val) return null;
    const raw = val.replace(/[^0-9]/g, '');
    return raw ? parseFloat(raw) : null;
  };

  // Filter State
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [expandedDistricts, setExpandedDistricts] = useState({});

  const toggleDistrict = (districtName) => {
    setExpandedDistricts(prev => ({
      ...prev,
      [districtName]: !prev[districtName]
    }));
  };

  useEffect(() => {
    if (selectedDistrict !== 'ALL') {
      setExpandedDistricts(prev => ({
        ...prev,
        [selectedDistrict]: true
      }));
    }
  }, [selectedDistrict]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch user role first
      const authRes = await fetch('/api/auth/me');
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.user) setUserRole(authData.user.role);
      }

      const res = await fetch('/api/verifikator/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadVillageDetail = async (village) => {
    setSelectedVillage(village);
    setDetailLoading(true);
    const res = await fetch(`/api/verifikator/village-detail?villageId=${village.id}`);
    if (res.ok) {
      const result = await res.json();
      setVillageDetail(result.grouped);
      setCategories(result.categories || []);
    }
    setDetailLoading(false);
  };

  const handleVerify = async (action) => {
    if (!villageDetail) return;
    
    // gather all records that need action
    const records = [];
    Object.keys(villageDetail).forEach(cat => {
      villageDetail[cat].forEach(obj => {
        if (obj.record.status === 'SUBMITTED' || obj.record.status === 'PENDING') {
          records.push({
            id: obj.record.id,
            action,
            notes: verifyNotes[obj.record.id] || ''
          });
        }
      });
    });

    if (records.length === 0) {
      alert('Tidak ada data (SUBMITTED / PENDING) yang dapat diproses');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/verifikator/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records })
    });

    if (res.ok) {
      alert(`Data berhasil di-${action.toLowerCase()}`);
      loadVillageDetail(selectedVillage);
      fetchDashboard();
    } else {
      alert('Terjadi kesalahan saat verifikasi.');
    }
    setSaving(false);
  };

  const handleDownloadExcel = async (village) => {
    try {
      const res = await fetch(`/api/verifikator/village-detail?villageId=${village.id}`);
      if (!res.ok) throw new Error('Gagal memuat data desa');
      const result = await res.json();
      
      const rows = [];
      let no = 1;
      Object.keys(result.grouped).forEach(cat => {
        result.grouped[cat].forEach(obj => {
          rows.push({
            'No.': no++,
            'Kategori': cat,
            'Alamat': obj.address,
            'Kode ZNT': obj.zntCode || '-',
            'Blok': obj.blok || '-',
            'Nilai Terendah /m2': obj.record?.minValue || 0,
            'Nilai Tertinggi /m2': obj.record?.maxValue || 0,
            'Status': obj.record?.status || 'PENDING',
            'Catatan': obj.record?.notes || ''
          });
        });
      });
      
      if (rows.length === 0) {
        alert('Tidak ada data objek pajak untuk desa ini.');
        return;
      }
      
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Nilai Wajar");
      XLSX.writeFile(workbook, `Data_Nilai_Wajar_${village.name.replace(/\s+/g, '_')}.xlsx`);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleAddObject = async (e) => {
    e.preventDefault();
    if (!newCategoryId) {
      alert('Silakan pilih kategori terlebih dahulu.');
      return;
    }

    const parsedMin = parseCurrency(newMinValue);
    const parsedMax = parseCurrency(newMaxValue);

    if (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax) {
      alert('Nilai terendah tidak boleh lebih besar dari nilai tertinggi!');
      return;
    }

    setAdding(true);
    const res = await fetch('/api/kolektor/add-object', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: newCategoryId,
        address: newAddress,
        blok: newBlok,
        minValue: parsedMin,
        maxValue: parsedMax,
        villageId: selectedVillage.id
      })
    });

    if (res.ok) {
      alert('Alamat objek pajak berhasil ditambahkan!');
      setShowAddForm(false);
      setNewCategoryId('');
      setNewAddress('');
      setNewBlok('');
      setNewMinValue('');
      setNewMaxValue('');
      loadVillageDetail(selectedVillage); // Refresh data
    } else {
      alert('Gagal menambahkan alamat objek pajak.');
    }
    setAdding(false);
  };

  const handleEditObject = async (e) => {
    e.preventDefault();
    setEditing(true);
    
    try {
      const res = await fetch('/api/verifikator/edit-object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: editObjectData.underlying?.map(u => u.taxObjectId) || [],
          address: editObjectData.address,
          zntCode: editObjectData.zntCode,
          blok: editObjectData.blok
        })
      });

      if (res.ok) {
        alert('Alamat objek pajak berhasil diperbarui!');
        setEditObjectData(null);
        loadVillageDetail(selectedVillage); // Refresh data
      } else {
        alert('Gagal memperbarui alamat objek pajak.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan.');
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async (obj) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus alamat "${obj.address}"?`)) return;
    
    try {
      const res = await fetch('/api/verifikator/delete-object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: obj.underlying?.map(u => u.taxObjectId) || []
        })
      });

      if (res.ok) {
        alert('Alamat objek pajak berhasil dihapus!');
        loadVillageDetail(selectedVillage); // Refresh data
      } else {
        alert('Gagal menghapus alamat objek pajak.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menghapus.');
    }
  };

  const handleRestore = async (obj) => {
    if (!window.confirm(`Apakah Anda yakin ingin memulihkan alamat "${obj.address}"?`)) return;
    
    try {
      const res = await fetch('/api/verifikator/restore-object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: obj.underlying.map(u => u.taxObjectId)
        })
      });

      if (res.ok) {
        alert('Alamat objek pajak berhasil dipulihkan!');
        loadVillageDetail(selectedVillage); // Refresh data
      } else {
        alert('Gagal memulihkan alamat objek pajak.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat memulihkan.');
    }
  };

  const handleExportDistrict = (districtId) => {
    window.location.href = `/api/export-district?districtId=${districtId}`;
  };

  if (loading) return <div>Loading data...</div>;
  if (!data) return <div>Error loading data.</div>;

  const uniqueDistricts = [...new Set(data.villageProgress.map(v => v.district))];
  const filteredVillages = data.villageProgress.filter(v => 
    selectedDistrict === 'ALL' || v.district === selectedDistrict
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard Verifikator & Superadmin</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Belum Input</div>
          <div className="stat-value">{data.stats.notInputted} Desa</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Sudah Input (Total)</div>
          <div className="stat-value">{data.stats.inputted} Desa</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Menunggu Verifikasi</div>
          <div className="stat-value">{data.stats.notVerified} Desa</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Sudah Diverifikasi Penuh</div>
          <div className="stat-value">{data.stats.verified} Desa</div>
        </div>
      </div>

      {!selectedVillage ? (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>Progres Per Desa</h2>
            <select 
              className="input-field" 
              style={{ minWidth: '250px' }}
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="ALL">-- Semua Kecamatan --</option>
              {uniqueDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          {(() => {
            if (filteredVillages.length === 0) {
              return <div style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada desa di kecamatan ini.</div>;
            }

            const groupedByDistrict = {};
            filteredVillages.forEach(v => {
              if (!groupedByDistrict[v.district]) {
                groupedByDistrict[v.district] = { villages: [], hasNew: false, totalVillages: 0 };
              }
              groupedByDistrict[v.district].villages.push(v);
              groupedByDistrict[v.district].totalVillages++;
              if (v.stats.submitted > 0) {
                groupedByDistrict[v.district].hasNew = true;
              }
            });

            return (
              <div className="accordion-container">
                {Object.keys(groupedByDistrict).sort().map((district, index) => {
                  const group = groupedByDistrict[district];
                  const isExpanded = expandedDistricts[district];
                  
                  return (
                      <div key={district} className={`accordion-card ${group.hasNew ? 'has-new-data' : ''} ${isExpanded ? 'is-expanded' : ''}`}>
                        <div className="accordion-header" onClick={() => toggleDistrict(district)}>
                          <div className="accordion-header-left">
                            <span className="accordion-number">{index + 1}</span>
                            <div className="accordion-title-box">
                              <h4>KECAMATAN {district.toUpperCase()}</h4>
                              <span className="accordion-subtitle">{group.totalVillages} Desa/Kelurahan</span>
                            </div>
                            {group.hasNew && (
                              <span className="badge-new-district">Ada Data Baru</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '4px', whiteSpace: 'nowrap' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportDistrict(group.villages[0]?.districtId); // Fetch districtId from first village
                              }}
                            >
                              ⬇️ Unduh Excel
                            </button>
                            <div className="accordion-toggle">▼</div>
                          </div>
                        </div>
                        
                        <div className={`accordion-collapse ${isExpanded ? 'open' : ''}`}>
                          <div className="accordion-body">
                            <div className="table-container">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Desa/Kelurahan</th>
                                  <th>Total Objek</th>
                                  <th>Belum Diverifikasi</th>
                                  <th>Menunggu Verifikasi</th>
                                  <th>Terverifikasi</th>
                                  <th>Ditolak</th>
                                  <th>Aksi</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.villages.map(v => {
                                  const needsVerification = v.stats.submitted > 0;
                                  return (
                                    <tr 
                                      key={v.id} 
                                      style={needsVerification ? { background: 'rgba(59, 130, 246, 0.08)', borderLeft: '4px solid #2563EB' } : {}}
                                    >
                                      <td data-label="Desa/Kelurahan">
                                        {v.name}
                                        {needsVerification && (
                                          <span style={{ marginLeft: '8px', fontSize: '10px', background: '#2563EB', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Baru</span>
                                        )}
                                      </td>
                                      <td data-label="Total Objek">{v.totalTaxObjects}</td>
                                      <td data-label="Belum Diverifikasi">{v.stats.pending}</td>
                                      <td data-label="Menunggu Verifikasi" style={needsVerification ? { fontWeight: 'bold', color: '#2563EB' } : {}}>{v.stats.submitted}</td>
                                      <td data-label="Terverifikasi">{v.stats.verified}</td>
                                      <td data-label="Ditolak">{v.stats.rejected}</td>
                                      <td data-label="Aksi">
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                          <button className={needsVerification ? "btn btn-primary" : "btn btn-secondary"} onClick={() => loadVillageDetail(v)}>
                                            Lihat Detail
                                          </button>
                                          <button className="btn btn-secondary" onClick={() => handleDownloadExcel(v)} style={{ background: '#10b981', color: 'white', borderColor: '#10b981', padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Download Excel">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                                            </svg>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>Detail Verifikasi: {selectedVillage.name} ({selectedVillage.district})</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" style={{ whiteSpace: 'nowrap', flex: '1 1 auto', justifyContent: 'center' }} onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Batal Tambah' : '+ Tambah Alamat'}
              </button>
              <button className="btn btn-secondary" style={{ whiteSpace: 'nowrap', flex: '1 1 auto', justifyContent: 'center' }} onClick={() => {
                setSelectedVillage(null);
                setShowAddForm(false);
                setEditObjectData(null);
              }}>
                Kembali
              </button>
              <button className="btn btn-danger" style={{ whiteSpace: 'nowrap', flex: '1 1 auto', justifyContent: 'center' }} onClick={() => handleVerify('REJECT')} disabled={saving}>
                {saving ? 'Processing...' : 'Tolak'}
              </button>
              <button className="btn btn-success" style={{ whiteSpace: 'nowrap', flex: '1 1 auto', justifyContent: 'center' }} onClick={() => handleVerify('APPROVE')} disabled={saving}>
                {saving ? 'Processing...' : 'Terima'}
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', marginBottom: '2rem', border: '2px solid var(--primary)', background: 'rgba(59, 130, 246, 0.05)' }}>
              <h3 style={{ marginBottom: '1rem' }}>Tambah Alamat Objek Pajak Baru</h3>
              <form onSubmit={handleAddObject}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label>Kategori</label>
                    <select 
                      className="input-field" 
                      value={newCategoryId} 
                      onChange={e => setNewCategoryId(e.target.value)}
                      required
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {categories && categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Alamat Objek Pajak</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={newAddress} 
                      onChange={e => setNewAddress(e.target.value)} 
                      required 
                      placeholder="Contoh: Jl. Sudirman No 12"
                    />
                  </div>
                  <div className="form-group">
                    <label>Blok (Opsional)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={newBlok} 
                      onChange={e => setNewBlok(e.target.value)} 
                      placeholder="Contoh: 1A"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nilai Terendah (Minimal) /m2</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={newMinValue} 
                      onChange={e => setNewMinValue(formatCurrency(e.target.value))} 
                      placeholder="Rp 0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nilai Tertinggi (Maksimal) /m2</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={newMaxValue} 
                      onChange={e => setNewMaxValue(formatCurrency(e.target.value))} 
                      placeholder="Rp 0"
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-success" disabled={adding}>
                  {adding ? 'Menyimpan...' : 'Simpan Alamat'}
                </button>
              </form>
            </div>
          )}

          {editObjectData && (
            <div className="sidebar-overlay open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', width: '90%', maxWidth: '500px', background: '#fff', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Edit Alamat Objek Pajak</h3>
                <form onSubmit={handleEditSubmit}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Alamat Objek Pajak</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={editObjectData.address} 
                      onChange={e => setEditObjectData({...editObjectData, address: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Kode ZNT (Opsional)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={editObjectData.zntCode || ''} 
                      onChange={e => setEditObjectData({...editObjectData, zntCode: e.target.value})} 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Blok (Opsional)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={editObjectData.blok || ''} 
                      onChange={e => setEditObjectData({...editObjectData, blok: e.target.value})} 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: '1 1 45%' }} onClick={() => setEditObjectData(null)}>Batal</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: '1 1 45%' }} disabled={editing}>
                      {editing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {detailLoading ? (
            <div>Loading detail desa...</div>
          ) : villageDetail && Object.keys(villageDetail).length > 0 ? (
            Object.keys(villageDetail).map(catName => (
              <div key={catName} style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Kategori: {catName}</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Alamat</th>
                        <th>Kode ZNT</th>
                        <th>Blok</th>
                        <th>Nilai Terendah /m2</th>
                        <th>Nilai Tertinggi /m2</th>
                        <th>Status</th>
                        <th>Catatan Penolakan (Jika Ada)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {villageDetail[catName].map(obj => (
                        <tr key={obj.id}>
                          <td data-label="Alamat">{obj.address}</td>
                          <td data-label="Kode ZNT">{obj.zntCode || '-'}</td>
                          <td data-label="Blok">{obj.blok || '-'}</td>
                          <td data-label="Nilai Terendah /m2">{obj.record.minValue ? `Rp ${obj.record.minValue.toLocaleString()}` : '-'}</td>
                          <td data-label="Nilai Tertinggi /m2">{obj.record.maxValue ? `Rp ${obj.record.maxValue.toLocaleString()}` : '-'}</td>
                          <td data-label="Status">
                            <span className={`status-badge status-${obj.record.status.toLowerCase()}`}>
                              {obj.record.status}
                            </span>
                          </td>
                          <td data-label="Catatan Penolakan">
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <input 
                                type="text" 
                                className="input-field" 
                                placeholder="Alasan tolak..." 
                                style={{ flex: 1 }}
                                value={verifyNotes[obj.record.id] || obj.record.notes || ''}
                                onChange={(e) => setVerifyNotes(prev => ({...prev, [obj.record.id]: e.target.value}))}
                                disabled={obj.record.status === 'VERIFIED' || obj.record.status === 'REJECTED'}
                              />
                            </div>
                          </td>
                          <td data-label="Aksi">
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {obj.isDeleted && userRole === 'SUPERADMIN' ? (
                                  <>
                                    <span style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '0.85rem', alignSelf: 'center' }}>(Dihapus)</span>
                                    <button 
                                      className="btn btn-secondary" 
                                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: '#198754', borderColor: '#198754' }}
                                      onClick={() => handleRestore(obj)}
                                      title="Pulihkan Alamat"
                                    >
                                      Pulihkan
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      className="btn btn-secondary" 
                                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                      onClick={() => setEditObjectData(obj)}
                                      disabled={obj.record?.status === 'VERIFIED'}
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      className="btn btn-secondary" 
                                      style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem', color: '#dc3545', borderColor: '#dc3545' }}
                                      onClick={() => handleDelete(obj)}
                                      title="Hapus Alamat"
                                      disabled={obj.record?.status === 'VERIFIED'}
                                    >
                                      🗑️
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              Belum ada alamat objek pajak untuk desa ini. Silakan klik tombol <strong>+ Tambah Alamat</strong> di atas.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
