'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function KolektorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // input state: { [recordId]: { minValue, maxValue } }
  const [inputs, setInputs] = useState({});

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch('/api/kolektor/dashboard');
    if (res.ok) {
      const result = await res.json();
      setData(result);
      
      // initialize inputs
      const initialInputs = {};
      Object.keys(result.grouped).forEach(cat => {
        result.grouped[cat].forEach(obj => {
          const uiKey = obj.record?.id || obj.id;
          initialInputs[uiKey] = {
            uiKey: uiKey,
            underlying: obj.underlying, // Array of {taxObjectId, recordId, zntCode}
            address: obj.address,
            zntCodeDisplay: obj.zntCode || '',
            blok: obj.blok || '',
            minValue: obj.record?.minValue ? formatCurrency(obj.record.minValue.toString()) : '',
            maxValue: obj.record?.maxValue ? formatCurrency(obj.record.maxValue.toString()) : ''
          };
        });
      });
      setInputs(initialInputs);
    }
    setLoading(false);
  };

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

  const handleInputChange = (id, field, value) => {
    const isCurrency = field === 'minValue' || field === 'maxValue';
    setInputs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: isCurrency ? formatCurrency(value) : value
      }
    }));
  };

  const handleSubmit = async (action) => {
    // Collect all data
    const records = [];
    Object.keys(inputs).forEach(uiKey => {
      const input = inputs[uiKey];
      input.underlying.forEach(item => {
        records.push({
          id: item.recordId || null,
          taxObjectId: item.taxObjectId,
          address: input.address,
          zntCode: item.zntCode, // Preserve original zntCode for this specific taxObject
          blok: input.blok,
          minValue: parseCurrency(input.minValue),
          maxValue: parseCurrency(input.maxValue),
          action
        });
      });
    });

    // Validation
    const invalidRecord = records.find(r => r.minValue !== null && r.maxValue !== null && r.minValue > r.maxValue);
    if (invalidRecord) {
      alert('Nilai terendah tidak boleh lebih besar dari nilai tertinggi!');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/kolektor/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records })
    });

    if (res.ok) {
      alert('Data berhasil disubmit untuk verifikasi!');
      fetchData();
    } else {
      alert('Terjadi kesalahan saat menyimpan data.');
    }
    setSaving(false);
  };

  const handleAutoSave = async (uiKey) => {
    const input = inputs[uiKey];
    if (!input) return;
    
    const minVal = parseCurrency(input.minValue);
    const maxVal = parseCurrency(input.maxValue);
    
    if (minVal !== null && maxVal !== null && minVal > maxVal) {
      return; // Skip auto-save if validation fails
    }

    const records = [];
    input.underlying.forEach(item => {
      records.push({
        id: item.recordId || null,
        taxObjectId: item.taxObjectId,
        address: input.address,
        zntCode: item.zntCode,
        blok: input.blok,
        minValue: minVal,
        maxValue: maxVal,
        action: 'SAVE'
      });
    });

    try {
      await fetch('/api/kolektor/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records })
      });
    } catch (e) {
      console.error('Auto-save failed:', e);
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
        maxValue: parsedMax
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
      fetchData();
    } else {
      alert('Gagal menambahkan alamat objek pajak.');
    }
    setAdding(false);
  };

  const handleEditObject = async (e) => {
    e.preventDefault();
    setEditing(true);
    const res = await fetch('/api/kolektor/edit-object', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taxObjectId: editObjectData.id,
        address: editObjectData.address,
        zntCode: editObjectData.zntCode,
        blok: editObjectData.blok
      })
    });

    if (res.ok) {
      alert('Alamat objek pajak berhasil diperbarui!');
      setEditObjectData(null);
      fetchData();
    } else {
      alert('Gagal memperbarui alamat objek pajak.');
    }
    setEditing(false);
  };

  const handleDelete = async (obj) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus alamat "${obj.address}"?`)) return;
    
    try {
      const res = await fetch('/api/kolektor/delete-object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: obj.underlying.map(u => u.taxObjectId)
        })
      });

      if (res.ok) {
        alert('Alamat objek pajak berhasil dihapus!');
        fetchData(); 
      } else {
        alert('Gagal menghapus alamat objek pajak.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menghapus.');
    }
  };

  const handleDownloadExcel = () => {
    if (!data || !data.grouped) return;
    
    const isPurwakarta = data.villageInfo?.district?.name?.toUpperCase() === 'PURWAKARTA';
    const wilayahLabel = isPurwakarta ? 'Kelurahan' : 'Desa';
    const villageName = data.villageInfo?.name || 'Unknown';
    const districtName = data.villageInfo?.district?.name || 'Unknown';
    
    const ws_data = [];
    
    const borderStyle = {
      top: { style: 'thin', color: { rgb: "000000" } },
      bottom: { style: 'thin', color: { rgb: "000000" } },
      left: { style: 'thin', color: { rgb: "000000" } },
      right: { style: 'thin', color: { rgb: "000000" } }
    };

    const titleStyle = { font: { bold: true }, alignment: { vertical: 'center', horizontal: 'center' } };
    const headerStyle = { font: { bold: true }, alignment: { vertical: 'center', horizontal: 'center' }, border: borderStyle };
    const dataLeftStyle = { alignment: { vertical: 'center', horizontal: 'left', wrapText: true }, border: borderStyle };
    const dataCenterStyle = { alignment: { vertical: 'center', horizontal: 'center', wrapText: true }, border: borderStyle };
    const signatureStyle = { alignment: { vertical: 'center', horizontal: 'center', wrapText: true } };

    // Header (Centered Title)
    ws_data.push([
      { v: `NILAI WAJAR ${wilayahLabel.toUpperCase()} ${villageName.toUpperCase()}`, s: titleStyle },
      { v: "", s: titleStyle }, { v: "", s: titleStyle }, { v: "", s: titleStyle }, { v: "", s: titleStyle }, { v: "", s: titleStyle }
    ]);
    ws_data.push([
      { v: `KECAMATAN ${districtName.toUpperCase()}`, s: titleStyle },
      { v: "", s: titleStyle }, { v: "", s: titleStyle }, { v: "", s: titleStyle }, { v: "", s: titleStyle }, { v: "", s: titleStyle }
    ]);
    ws_data.push([
      { v: "TAHUN 2026", s: titleStyle },
      { v: "", s: titleStyle }, { v: "", s: titleStyle }, { v: "", s: titleStyle }, { v: "", s: titleStyle }, { v: "", s: titleStyle }
    ]);
    ws_data.push(["", "", "", "", "", ""]);
    
    // Table Headers
    ws_data.push([
      { v: "No", s: headerStyle },
      { v: "Kategori", s: headerStyle },
      { v: "Alamat Objek Pajak", s: headerStyle },
      { v: "Kode ZNT", s: headerStyle },
      { v: "Blok", s: headerStyle },
      { v: "Nilai Wajar /m2", s: headerStyle }
    ]);
    
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }
    ];
    
    let currentRow = 5; // starting at row index 5 (6th row)
    let catIndex = 1;
    
    Object.keys(data.grouped).forEach(catName => {
      const objects = data.grouped[catName];
      const startRow = currentRow;
      
      objects.forEach((obj, idx) => {
        const inputData = inputs[obj.record.id];
        const minV = inputData?.minValue || 'Rp 0';
        const maxV = inputData?.maxValue || 'Rp 0';
        const nilaiWajar = `${minV} - ${maxV}`;
        
        if (idx === 0) {
          ws_data.push([
            { v: catIndex, t: 'n', s: dataLeftStyle },
            { v: catName, t: 's', s: dataLeftStyle },
            { v: obj.address, s: dataLeftStyle }, 
            { v: obj.zntCode || '-', s: dataCenterStyle }, 
            { v: obj.blok || '-', s: dataCenterStyle }, 
            { v: nilaiWajar, s: dataCenterStyle }
          ]);
        } else {
          ws_data.push([
            { v: "", s: dataLeftStyle }, 
            { v: "", s: dataLeftStyle }, 
            { v: obj.address, s: dataLeftStyle }, 
            { v: obj.zntCode || '-', s: dataCenterStyle }, 
            { v: obj.blok || '-', s: dataCenterStyle }, 
            { v: nilaiWajar, s: dataCenterStyle }
          ]);
        }
        currentRow++;
      });
      
      const endRow = currentRow - 1;
      if (endRow > startRow) {
        merges.push({ s: { r: startRow, c: 0 }, e: { r: endRow, c: 0 } });
        merges.push({ s: { r: startRow, c: 1 }, e: { r: endRow, c: 1 } });
      }
      
      catIndex++;
    });
    
    ws_data.push(["", "", "", "", "", ""]);
    ws_data.push(["", { v: "KOLEKTOR PBB", s: signatureStyle }, "", "", { v: `KEPALA ${wilayahLabel.toUpperCase()}`, s: signatureStyle }, ""]);
    ws_data.push(["", { v: villageName.toUpperCase(), s: signatureStyle }, "", "", { v: villageName.toUpperCase(), s: signatureStyle }, ""]);
    ws_data.push(["", "", "", "", "", ""]);
    ws_data.push(["", "", "", "", "", ""]);
    ws_data.push(["", "", "", "", "", ""]);
    ws_data.push(["", { v: "(...............................................)", s: signatureStyle }, "", "", { v: "(...............................................)", s: signatureStyle }, ""]);
    
    const worksheet = XLSX.utils.aoa_to_sheet(ws_data);
    worksheet['!merges'] = merges;
    worksheet['!cols'] = [
      { wpx: 30 },   // No
      { wpx: 160 },  // Kategori
      { wpx: 240 },  // Alamat
      { wpx: 80 },   // Kode ZNT
      { wpx: 100 },  // Blok
      { wpx: 250 }   // Nilai Wajar
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Nilai Wajar");
    
    const fileName = `Nilai Wajar ${wilayahLabel} ${villageName}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  if (loading) return <div>Loading data...</div>;
  if (!data) return <div>Error loading data.</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard Kolektor</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Alamat Objek Pajak</div>
          <div className="stat-value">{data.stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Selesai Diinput</div>
          <div className="stat-value">{data.stats.completed + data.stats.verified}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Belum Diinput (Draft)</div>
          <div className="stat-value">{data.stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Ditolak / Koreksi</div>
          <div className="stat-value">{data.stats.rejected}</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>Form Input Nilai Wajar</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleDownloadExcel}>
              Unduh Data (Excel)
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? 'Batal Tambah' : '+ Tambah Alamat'}
            </button>
            <button className="btn btn-primary" onClick={() => handleSubmit('SUBMIT')} disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Verifikasi'}
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
                    {data.categories && data.categories.map(c => (
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
              <form onSubmit={handleEditObject}>
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
                </div><div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: '1 1 45%' }} onClick={() => setEditObjectData(null)}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: '1 1 45%' }} disabled={editing}>
                    {editing ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {Object.keys(data.grouped).map(catName => (
          <div key={catName} style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Kategori: {catName}</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Alamat Objek Pajak</th>
                    <th>Kode ZNT</th>
                    <th>Blok</th>
                    <th>Nilai Terendah (Minimal) /m2</th>
                    <th>Nilai Tertinggi (Maksimal) /m2</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.grouped[catName].map(obj => (
                    <tr key={obj.record?.id || obj.id}>
                      <td data-label="Alamat Objek Pajak">{obj.address}</td>
                      <td data-label="Kode ZNT">{obj.zntCode || '-'}</td>
                      <td data-label="Blok">{obj.blok || '-'}</td>
                      <td data-label="Nilai Terendah /m2">
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Rp 0" 
                          value={inputs[obj.record?.id || obj.id]?.minValue || ''}
                          onChange={(e) => handleInputChange(obj.record?.id || obj.id, 'minValue', e.target.value)}
                          onBlur={() => handleAutoSave(obj.record?.id || obj.id)}
                          disabled={obj.record?.status === 'VERIFIED' || obj.record?.status === 'SUBMITTED'}
                        />
                      </td>
                      <td data-label="Nilai Tertinggi (Maksimal) /m2">
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Rp 0" 
                          value={inputs[obj.record?.id || obj.id]?.maxValue || ''}
                          onChange={(e) => handleInputChange(obj.record?.id || obj.id, 'maxValue', e.target.value)}
                          onBlur={() => handleAutoSave(obj.record?.id || obj.id)}
                          disabled={obj.record?.status === 'VERIFIED' || obj.record?.status === 'SUBMITTED'}
                        />
                      </td>
                      <td data-label="Status">
                        {obj.record?.status ? (
                          <span className={`status-badge status-${obj.record.status.toLowerCase()}`}>
                            {obj.record.status}
                          </span>
                        ) : (
                          <span className="status-badge status-pending">PENDING</span>
                        )}
                        {obj.record?.notes && (
                          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--danger)' }}>
                            Catatan: {obj.record.notes}
                          </div>
                        )}
                      </td>
                      <td data-label="Aksi">
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={() => setEditObjectData(obj)}
                            disabled={obj.record?.status === 'VERIFIED' || obj.record?.status === 'SUBMITTED'}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem', color: '#dc3545', borderColor: '#dc3545' }}
                            onClick={() => handleDelete(obj)}
                            title="Hapus Alamat"
                            disabled={obj.record?.status === 'VERIFIED' || obj.record?.status === 'SUBMITTED'}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
