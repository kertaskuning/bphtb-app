'use client';

import { useState, useEffect } from 'react';

export default function KecamatanDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [villageDetail, setVillageDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    const res = await fetch('/api/kecamatan/dashboard');
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  };

  const loadVillageDetail = async (village) => {
    setSelectedVillage(village);
    setDetailLoading(true);
    const res = await fetch(`/api/verifikator/village-detail?villageId=${village.id}`);
    if (res.ok) {
      const result = await res.json();
      setVillageDetail(result.grouped);
    }
    setDetailLoading(false);
  };

  if (loading) return <div>Loading data...</div>;
  if (!data) return <div>Error loading data.</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard Pemantauan Kecamatan</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Desa/Kelurahan</div>
          <div className="stat-value">{data.stats.totalVillages} Desa</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Belum Input</div>
          <div className="stat-value">{data.stats.notInputted} Desa</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Sedang Berprogres</div>
          <div className="stat-value">{data.stats.notVerified} Desa</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Selesai Diverifikasi</div>
          <div className="stat-value">{data.stats.verified} Desa</div>
        </div>
      </div>

      {!selectedVillage ? (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', marginTop: 0 }}>Progres Desa/Kelurahan di Kecamatan Anda</h2>
          
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
                {data.villageProgress.map(v => (
                  <tr key={v.id}>
                    <td data-label="Desa/Kelurahan">{v.name}</td>
                    <td data-label="Total Objek">{v.totalTaxObjects}</td>
                    <td data-label="Belum Diverifikasi">{v.stats.pending}</td>
                    <td data-label="Menunggu Verifikasi">{v.stats.submitted}</td>
                    <td data-label="Terverifikasi">{v.stats.verified}</td>
                    <td data-label="Ditolak">{v.stats.rejected}</td>
                    <td data-label="Aksi">
                      <button className="btn btn-primary" onClick={() => loadVillageDetail(v)}>
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>Detail Data: {selectedVillage.name}</h2>
            <button className="btn btn-secondary" onClick={() => setSelectedVillage(null)}>
              Kembali
            </button>
          </div>

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
                        <th>Catatan Penolakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {villageDetail[catName].map(obj => (
                        <tr key={obj.id}>
                          <td data-label="Alamat">{obj.address}</td>
                          <td data-label="Kode ZNT">{obj.zntCode || '-'}</td>
                          <td data-label="Blok">{obj.blok || '-'}</td>
                          <td data-label="Nilai Terendah /m2">{obj.record.minValue ? `Rp ${obj.record.minValue.toLocaleString('id-ID')}` : '-'}</td>
                          <td data-label="Nilai Tertinggi /m2">{obj.record.maxValue ? `Rp ${obj.record.maxValue.toLocaleString('id-ID')}` : '-'}</td>
                          <td data-label="Status">
                            <span className={`status-badge status-${obj.record.status.toLowerCase()}`}>
                              {obj.record.status}
                            </span>
                          </td>
                          <td data-label="Catatan Penolakan">
                            {obj.record.notes || '-'}
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
              Belum ada alamat objek pajak untuk desa ini.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
