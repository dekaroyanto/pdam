'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  Database, 
  FolderPlus, 
  Plus, 
  Users, 
  Wrench, 
  Layers, 
  Sparkles, 
  Check, 
  RefreshCw,
  HardHat,
  Tag,
  Key,
  ShieldAlert
} from 'lucide-react';

export default function MasterDataView({
  projectId,
  projects,
  onRefreshProjects,
  onSeedData,
  isSeeding,
  onOpenDbModal,
  dbStatus
}) {
  const [activeTab, setActiveTab] = useState('resources'); // 'resources', 'categories', 'project', 'hostinger'
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Resource Form state
  const [newResNama, setNewResNama] = useState('');
  const [newResKatUtama, setNewResKatUtama] = useState('Tenaga Kerja');
  const [newResSubKat, setNewResSubKat] = useState('Lapangan');
  const [newResSatuan, setNewResSatuan] = useState('org');

  // New Category Form state
  const [newCatNama, setNewCatNama] = useState('');
  const [newCatUrutan, setNewCatUrutan] = useState(1);

  // New Job Item Form state
  const [selectedCatId, setSelectedCatId] = useState('');
  const [newItemNama, setNewItemNama] = useState('');
  const [newItemSatuan, setNewItemSatuan] = useState('m');
  const [newItemTipe, setNewItemTipe] = useState('RUMUS_DINAMIS');
  const [newItemFormula, setNewItemFormula] = useState('panjang');
  const [newItemParams, setNewItemParams] = useState('panjang');

  // New Project Form state
  const [newProjNama, setNewProjNama] = useState('');
  const [newProjSpp, setNewProjSpp] = useState('');
  const [newProjTanggal, setNewProjTanggal] = useState('');
  const [newProjWaktu, setNewProjWaktu] = useState('');
  const [newProjPelaksana, setNewProjPelaksana] = useState('');

  const [message, setMessage] = useState(null);

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/master-resources?active_only=false');
      const data = await res.json();
      if (Array.isArray(data)) setResources(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/job-categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
        if (data.length > 0 && !selectedCatId) {
          setSelectedCatId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchCategories();
  }, []);

  // Submit New Resource
  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!newResNama || !newResSatuan) return;
    try {
      const res = await fetch('/api/master-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kategori_utama: newResKatUtama,
          sub_kategori: newResSubKat,
          nama: newResNama,
          satuan: newResSatuan
        })
      });
      if (res.ok) {
        setNewResNama('');
        fetchResources();
        setMessage({ type: 'success', text: 'Sumber daya berhasil ditambahkan!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Submit New Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatNama) return;
    try {
      const res = await fetch('/api/job-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_kategori: newCatNama,
          urutan: newCatUrutan
        })
      });
      if (res.ok) {
        setNewCatNama('');
        fetchCategories();
        setMessage({ type: 'success', text: 'Kategori pekerjaan berhasil ditambahkan untuk semua proyek!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Submit New Job Item
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemNama || !selectedCatId) return;

    const paramArray = newItemParams
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/job-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_item',
          category_id: selectedCatId,
          nama_item: newItemNama,
          satuan: newItemSatuan,
          tipe_perhitungan: newItemTipe,
          formula_expression: newItemTipe === 'RUMUS_DINAMIS' ? newItemFormula : null,
          parameter_keys: newItemTipe === 'RUMUS_DINAMIS' ? paramArray : null
        })
      });
      if (res.ok) {
        setNewItemNama('');
        fetchCategories();
        setMessage({ type: 'success', text: 'Item pekerjaan berhasil ditambahkan!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Submit New Project
  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProjNama) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_pekerjaan: newProjNama,
          no_spp: newProjSpp,
          tanggal_spp: newProjTanggal || null,
          waktu_pelaksanaan: newProjWaktu || null,
          pelaksana: newProjPelaksana
        })
      });
      if (res.ok) {
        setNewProjNama('');
        setNewProjSpp('');
        setNewProjWaktu('');
        setNewProjPelaksana('');
        onRefreshProjects();
        setMessage({ type: 'success', text: 'Proyek baru berhasil dibuat!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Pengaturan & Master Data
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola Proyek, Item Pekerjaan, Sumber Daya, dan Konfigurasi Hostinger
          </p>
        </div>

        {/* Quick Seed Button */}
        <button
          onClick={onSeedData}
          disabled={isSeeding}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold active:scale-95 transition disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isSeeding ? 'Mengisi Data...' : 'Isi Data Standar PDAM'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('resources')}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl font-semibold transition ${
            activeTab === 'resources'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Sumber Daya
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl font-semibold transition ${
            activeTab === 'categories'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Item Pekerjaan
        </button>
        <button
          onClick={() => setActiveTab('project')}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl font-semibold transition ${
            activeTab === 'project'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Tambah Proyek
        </button>
        <button
          onClick={() => setActiveTab('hostinger')}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl font-semibold transition ${
            activeTab === 'hostinger'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          DB Hostinger
        </button>
      </div>

      {/* Alert Message */}
      {message && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs">
          {message.text}
        </div>
      )}

      {/* TAB 1: MASTER SUMBER DAYA */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          {/* Add Resource Form */}
          <form onSubmit={handleAddResource} className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Tambah Sumber Daya Baru (Tenaga / Alat / Bahan)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Kategori Utama</label>
                <select
                  value={newResKatUtama}
                  onChange={(e) => {
                    setNewResKatUtama(e.target.value);
                    setNewResSubKat(e.target.value === 'Tenaga Kerja' ? 'Lapangan' : 'Alat');
                  }}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Tenaga Kerja">Tenaga Kerja</option>
                  <option value="Bahan & Alat">Bahan & Alat</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Sub Kategori</label>
                <select
                  value={newResSubKat}
                  onChange={(e) => setNewResSubKat(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {newResKatUtama === 'Tenaga Kerja' ? (
                    <>
                      <option value="Management">Management</option>
                      <option value="Lapangan">Lapangan</option>
                    </>
                  ) : (
                    <>
                      <option value="Alat">Alat</option>
                      <option value="Bahan">Bahan</option>
                      <option value="Accessories">Accessories</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Nama Sumber Daya</label>
                <input
                  type="text"
                  placeholder="Cth: Mandor, Excavator..."
                  value={newResNama}
                  onChange={(e) => setNewResNama(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Satuan</label>
                <input
                  type="text"
                  placeholder="org, unit, m, bh..."
                  value={newResSatuan}
                  onChange={(e) => setNewResSatuan(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition active:scale-95"
            >
              + Simpan Sumber Daya
            </button>
          </form>

          {/* Resources List */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 font-bold text-xs uppercase text-slate-700 dark:text-slate-300">
              Daftar Sumber Daya Terdaftar ({resources.length})
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs max-h-96 overflow-y-auto">
              {resources.map((r) => (
                <div key={r.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{r.nama}</div>
                    <div className="text-[10px] text-slate-400">{r.kategori_utama} &bull; {r.sub_kategori}</div>
                  </div>
                  <div className="text-right font-mono text-slate-500">
                    Satuan: <span className="font-bold text-slate-800 dark:text-slate-200">{r.satuan}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ITEM PEKERJAAN & FORMULA */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Tambah Kategori Pekerjaan
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Cth: V. PEKERJAAN LAIN-LAIN"
                  value={newCatNama}
                  onChange={(e) => setNewCatNama(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Urutan (1, 2, 3...)"
                  value={newCatUrutan}
                  onChange={(e) => setNewCatUrutan(parseInt(e.target.value, 10))}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition active:scale-95"
            >
              + Tambah Kategori
            </button>
          </form>

          {/* Add Job Item Form */}
          <form onSubmit={handleAddItem} className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Tambah Item Pekerjaan & Rumus Dinamis
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Pilih Kategori</label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nama_kategori}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Nama Item Pekerjaan</label>
                <input
                  type="text"
                  placeholder="Cth: Galian Tanah Pipa..."
                  value={newItemNama}
                  onChange={(e) => setNewItemNama(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Satuan</label>
                <input
                  type="text"
                  placeholder="m, m2, m3, unit, titik..."
                  value={newItemSatuan}
                  onChange={(e) => setNewItemSatuan(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Tipe Perhitungan</label>
                <select
                  value={newItemTipe}
                  onChange={(e) => setNewItemTipe(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="RUMUS_DINAMIS">Rumus Dinamis</option>
                  <option value="MANUAL">Input Manual</option>
                </select>
              </div>

              {newItemTipe === 'RUMUS_DINAMIS' && (
                <>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Rumus (Formula)</label>
                    <input
                      type="text"
                      placeholder="Cth: p * l * t atau panjang"
                      value={newItemFormula}
                      onChange={(e) => setNewItemFormula(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Parameter (pisahkan koma)</label>
                    <input
                      type="text"
                      placeholder="Cth: p, l, t"
                      value={newItemParams}
                      onChange={(e) => setNewItemParams(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition active:scale-95"
            >
              + Simpan Item Pekerjaan
            </button>
          </form>

          {/* Existing Categories & Items */}
          <div className="space-y-3">
            {categories.map((c) => (
              <div key={c.id} className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-3.5 space-y-2">
                <div className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200">
                  {c.nama_kategori}
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                  {(c.items || []).map((it) => (
                    <div key={it.id} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{it.nama_item}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {it.tipe_perhitungan} {it.formula_expression ? `(${it.formula_expression})` : ''}
                        </div>
                      </div>
                      <div className="text-slate-500 font-mono font-bold text-xs">{it.satuan}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TAMBAH PROYEK BARU */}
      {activeTab === 'project' && (
        <form onSubmit={handleAddProject} className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Tambah Proyek PDAM Baru
          </h3>
          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Nama Pekerjaan / Paket Proyek</label>
              <input
                type="text"
                placeholder="Cth: Pemasangan Pipa Distribusi PDAM Kec. Sumber Rejo"
                value={newProjNama}
                onChange={(e) => setNewProjNama(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Nomor SPP / Kontrak</label>
                <input
                  type="text"
                  placeholder="SPP/PDAM/2026/..."
                  value={newProjSpp}
                  onChange={(e) => setNewProjSpp(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Waktu Pelaksanaan (Hari)</label>
                <input
                  type="number"
                  placeholder="90"
                  value={newProjWaktu}
                  onChange={(e) => setNewProjWaktu(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Nama Kontraktor / Pelaksana</label>
              <input
                type="text"
                placeholder="PT. / CV. Nama Kontraktor"
                value={newProjPelaksana}
                onChange={(e) => setNewProjPelaksana(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition active:scale-95"
          >
            + Buat Proyek Baru
          </button>
        </form>
      )}

      {/* TAB 4: DATABASE HOSTINGER INFO */}
      {activeTab === 'hostinger' && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Panduan Integrasi Database Hostinger
              </h3>
            </div>
            <button
              onClick={onOpenDbModal}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
            >
              Cek Status Koneksi
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border space-y-2">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Parameter yang Perlu Anda Isi di file <code>.env.local</code>:
            </div>
            <div className="space-y-1.5 font-mono text-[11px] bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div><strong className="text-blue-600">DB_HOST</strong> = Host/IP server Hostinger Anda (cth: <code>srv1234.hstgr.io</code> atau IP)</div>
              <div><strong className="text-blue-600">DB_PORT</strong> = <code>3306</code></div>
              <div><strong className="text-blue-600">DB_NAME</strong> = <code>u126089851_dbpdam</code> (sesuai database yang Anda buat)</div>
              <div><strong className="text-blue-600">DB_USER</strong> = Username MySQL di Hostinger (cth: <code>u126089851_pdamuser</code>)</div>
              <div><strong className="text-blue-600">DB_PASSWORD</strong> = Password database yang Anda buat di Hostinger</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Wajib: Aktifkan Remote MySQL di Hostinger
            </div>
            <p className="text-[11px] leading-relaxed">
              Di hPanel Hostinger, buka menu <strong>Databases &rarr; Remote MySQL</strong>. Tambahkan IP publik laptop Anda atau ketikkan <code>%</code> (artinya izinkan dari IP mana saja) agar Node.js / aplikasi dapat terhubung ke database Hostinger tanpa diblokir oleh firewall server.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

