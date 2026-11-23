'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  Plus, 
  Database,
  Edit2,
  Trash2,
  X,
  Check,
  Building2,
  Layers,
  Users,
  Wrench,
  AlertCircle
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
  const [activeTab, setActiveTab] = useState('categories'); // 'categories', 'resources', 'projects', 'hostinger'
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [resourceFilter, setResourceFilter] = useState('all'); // 'all', 'Tenaga Kerja', 'Bahan & Alat'
  const [message, setMessage] = useState(null);

  // ==========================================
  // CREATE STATES
  // ==========================================
  // New Category
  const [newCatNama, setNewCatNama] = useState('');
  const [newCatUrutan, setNewCatUrutan] = useState(1);

  // New Job Item
  const [selectedCatId, setSelectedCatId] = useState('');
  const [newItemNama, setNewItemNama] = useState('');
  const [newItemSatuan, setNewItemSatuan] = useState('m');
  const [newItemTipe, setNewItemTipe] = useState('RUMUS_DINAMIS');
  const [newItemFormula, setNewItemFormula] = useState('panjang');
  const [newItemParams, setNewItemParams] = useState('panjang');

  // New Resource
  const [newResNama, setNewResNama] = useState('');
  const [newResKatUtama, setNewResKatUtama] = useState('Tenaga Kerja');
  const [newResSubKat, setNewResSubKat] = useState('Lapangan');
  const [newResSatuan, setNewResSatuan] = useState('org');

  // New Project
  const [newProjNama, setNewProjNama] = useState('');
  const [newProjSpp, setNewProjSpp] = useState('');
  const [newProjTanggal, setNewProjTanggal] = useState('');
  const [newProjWaktu, setNewProjWaktu] = useState('');
  const [newProjPelaksana, setNewProjPelaksana] = useState('');
  const [newProjPengawas, setNewProjPengawas] = useState('');
  const [newProjKepalaSeksi, setNewProjKepalaSeksi] = useState('');

  // ==========================================
  // EDIT STATES (Modals/Inline)
  // ==========================================
  const [editingCategory, setEditingCategory] = useState(null); // { id, nama_kategori, urutan }
  const [editingItem, setEditingItem] = useState(null); // { id, category_id, nama_item, satuan, tipe_perhitungan, formula_expression, parameter_keys }
  const [editingResource, setEditingResource] = useState(null); // { id, nama, kategori_utama, sub_kategori, satuan }
  const [editingProject, setEditingProject] = useState(null); // { id, nama_pekerjaan, no_spp, tanggal_spp, waktu_pelaksanaan, pelaksana }

  // DELETE CONFIRMATION STATE
  // { type: 'category' | 'item' | 'resource' | 'project', id: number, label: string }
  const [deletingTarget, setDeletingTarget] = useState(null);

  // Fetch Resources & Categories
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

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // ==========================================
  // 1. KATEGORI PEKERJAAN (CRUD)
  // ==========================================
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatNama.trim()) return;
    try {
      const res = await fetch('/api/job-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_kategori: newCatNama.trim(),
          urutan: newCatUrutan
        })
      });
      if (res.ok) {
        setNewCatNama('');
        fetchCategories();
        showMsg('Kategori pekerjaan berhasil ditambahkan!');
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.nama_kategori.trim()) return;
    try {
      const res = await fetch('/api/job-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_category',
          id: editingCategory.id,
          nama_kategori: editingCategory.nama_kategori.trim(),
          urutan: editingCategory.urutan
        })
      });
      if (res.ok) {
        setEditingCategory(null);
        fetchCategories();
        showMsg('Kategori pekerjaan berhasil diperbarui!');
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      const res = await fetch(`/api/job-categories?type=category&id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCategories();
        setDeletingTarget(null);
        showMsg('Kategori beserta seluruh item di dalamnya berhasil dihapus!');
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  // ==========================================
  // 2. ITEM PEKERJAAN (CRUD)
  // ==========================================
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemNama.trim() || !selectedCatId) return;

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
          nama_item: newItemNama.trim(),
          satuan: newItemSatuan.trim(),
          tipe_perhitungan: newItemTipe,
          formula_expression: newItemTipe === 'RUMUS_DINAMIS' ? newItemFormula.trim() : null,
          parameter_keys: newItemTipe === 'RUMUS_DINAMIS' ? paramArray : null
        })
      });
      if (res.ok) {
        setNewItemNama('');
        fetchCategories();
        showMsg('Item pekerjaan berhasil ditambahkan!');
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editingItem || !editingItem.nama_item.trim()) return;

    const paramArray = (typeof editingItem.parameter_keys === 'string'
      ? editingItem.parameter_keys.split(',')
      : Array.isArray(editingItem.parameter_keys) ? editingItem.parameter_keys : [])
      .map((s) => String(s).trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/job-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_item',
          id: editingItem.id,
          category_id: editingItem.category_id,
          nama_item: editingItem.nama_item.trim(),
          satuan: editingItem.satuan.trim(),
          tipe_perhitungan: editingItem.tipe_perhitungan,
          formula_expression: editingItem.tipe_perhitungan === 'RUMUS_DINAMIS' ? editingItem.formula_expression : null,
          parameter_keys: editingItem.tipe_perhitungan === 'RUMUS_DINAMIS' ? paramArray : null
        })
      });
      if (res.ok) {
        setEditingItem(null);
        fetchCategories();
        showMsg('Item pekerjaan berhasil diperbarui!');
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const res = await fetch(`/api/job-categories?type=item&id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCategories();
        setDeletingTarget(null);
        showMsg('Item pekerjaan berhasil dihapus!');
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  // ==========================================
  // 3. SUMBER DAYA (CRUD)
  // ==========================================
  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!newResNama.trim() || !newResSatuan.trim()) return;
    try {
      const res = await fetch('/api/master-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kategori_utama: newResKatUtama,
          sub_kategori: newResSubKat,
          nama: newResNama.trim(),
          satuan: newResSatuan.trim()
        })
      });
      if (res.ok) {
        setNewResNama('');
        fetchResources();
        showMsg('Sumber daya berhasil ditambahkan!');
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleUpdateResource = async (e) => {
    e.preventDefault();
    if (!editingResource || !editingResource.nama.trim()) return;
    try {
      const res = await fetch('/api/master-resources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingResource.id,
          kategori_utama: editingResource.kategori_utama,
          sub_kategori: editingResource.sub_kategori,
          nama: editingResource.nama.trim(),
          satuan: editingResource.satuan.trim(),
          status_aktif: 1
        })
      });
      if (res.ok) {
        setEditingResource(null);
        fetchResources();
        showMsg('Sumber daya berhasil diperbarui!');
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleDeleteResource = async (id) => {
    try {
      const res = await fetch(`/api/master-resources?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchResources();
        setDeletingTarget(null);
        showMsg('Sumber daya berhasil dihapus!');
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  // ==========================================
  // 4. PROYEK (CRUD)
  // ==========================================
  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProjNama.trim()) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_pekerjaan: newProjNama.trim(),
          no_spp: newProjSpp.trim() || null,
          tanggal_spp: newProjTanggal || null,
          waktu_pelaksanaan: newProjWaktu || null,
          pelaksana: newProjPelaksana.trim() || null,
          pengawas_bagian: newProjPengawas.trim() || null,
          kepala_seksi_bagian: newProjKepalaSeksi.trim() || null
        })
      });
      if (res.ok) {
        setNewProjNama('');
        setNewProjSpp('');
        setNewProjTanggal('');
        setNewProjWaktu('');
        setNewProjPelaksana('');
        setNewProjPengawas('');
        setNewProjKepalaSeksi('');
        onRefreshProjects();
        showMsg('Proyek baru berhasil dibuat!');
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editingProject || !editingProject.nama_pekerjaan.trim()) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProject.id,
          nama_pekerjaan: editingProject.nama_pekerjaan.trim(),
          no_spp: editingProject.no_spp ? editingProject.no_spp.trim() : null,
          tanggal_spp: editingProject.tanggal_spp || null,
          waktu_pelaksanaan: editingProject.waktu_pelaksanaan || null,
          pelaksana: editingProject.pelaksana ? editingProject.pelaksana.trim() : null,
          pengawas_bagian: editingProject.pengawas_bagian ? editingProject.pengawas_bagian.trim() : null,
          kepala_seksi_bagian: editingProject.kepala_seksi_bagian ? editingProject.kepala_seksi_bagian.trim() : null
        })
      });
      if (res.ok) {
        setEditingProject(null);
        onRefreshProjects();
        showMsg('Proyek berhasil diperbarui!');
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshProjects();
        setDeletingTarget(null);
        showMsg('Proyek beserta seluruh laporannya berhasil dihapus!');
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  // Filtered resources
  const filteredResources = resources.filter((r) => {
    if (resourceFilter === 'all') return true;
    return r.kategori_utama === resourceFilter;
  });

  return (
    <div className="space-y-3 pb-20 md:pb-6">
      {/* Top Header */}
      <div className="bg-white rounded-lg p-3.5 border border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-zinc-600" />
            <span>Master Data PDAM</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Kelola Item Pekerjaan, Sumber Daya, dan Proyek
          </p>
        </div>

        <button
          onClick={onSeedData}
          disabled={isSeeding}
          className="px-3 py-1.5 rounded border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-medium disabled:opacity-50"
        >
          {isSeeding ? 'Mengisi Data...' : 'Isi Standar PDAM'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 text-xs bg-white rounded-t-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Item Pekerjaan ({categories.reduce((acc, c) => acc + (c.items?.length || 0), 0)})
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === 'resources'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Sumber Daya ({resources.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === 'projects'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Daftar Proyek ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('hostinger')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === 'hostinger'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Koneksi Hostinger
        </button>
      </div>

      {/* Alert Notification */}
      {message && (
        <div className={`p-2.5 rounded text-xs flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: ITEM PEKERJAAN & KATEGORI (FULL CRUD) */}
      {/* ========================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-3">
          {/* Form: Tambah Kategori */}
          <form onSubmit={handleAddCategory} className="bg-white rounded-lg p-3.5 border border-zinc-200 space-y-2">
            <h3 className="font-semibold text-xs text-zinc-800 uppercase tracking-wide">
              + Tambah Kategori Pekerjaan
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <input
                type="text"
                placeholder="Nama Kategori (cth: V. PEKERJAAN LAIN)"
                value={newCatNama}
                onChange={(e) => setNewCatNama(e.target.value)}
                className="col-span-2 px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
              />
              <input
                type="number"
                placeholder="Urutan"
                value={newCatUrutan}
                onChange={(e) => setNewCatUrutan(parseInt(e.target.value, 10))}
                className="px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
            >
              + Simpan Kategori
            </button>
          </form>

          {/* Form: Tambah Item Pekerjaan */}
          <form onSubmit={handleAddItem} className="bg-white rounded-lg p-3.5 border border-zinc-200 space-y-2 text-xs">
            <h3 className="font-semibold text-xs text-zinc-800 uppercase tracking-wide">
              + Tambah Item Pekerjaan Baru
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Pilih Kategori</label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nama_kategori}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Nama Item Pekerjaan</label>
                <input
                  type="text"
                  placeholder="Galian tanah jalur pipa..."
                  value={newItemNama}
                  onChange={(e) => setNewItemNama(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Satuan</label>
                <input
                  type="text"
                  placeholder="m, m2, m3, unit, titik..."
                  value={newItemSatuan}
                  onChange={(e) => setNewItemSatuan(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Tipe Perhitungan</label>
                <select
                  value={newItemTipe}
                  onChange={(e) => setNewItemTipe(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                >
                  <option value="RUMUS_DINAMIS">Rumus Dinamis</option>
                  <option value="MANUAL">Input Manual</option>
                </select>
              </div>

              {newItemTipe === 'RUMUS_DINAMIS' && (
                <>
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-0.5">Formula (Rumus)</label>
                    <input
                      type="text"
                      placeholder="panjang * lebar * kedalaman"
                      value={newItemFormula}
                      onChange={(e) => setNewItemFormula(e.target.value)}
                      className="w-full font-mono px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-0.5">Parameter (pisahkan koma)</label>
                    <input
                      type="text"
                      placeholder="panjang, lebar, kedalaman"
                      value={newItemParams}
                      onChange={(e) => setNewItemParams(e.target.value)}
                      className="w-full font-mono px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
            >
              + Simpan Item Pekerjaan
            </button>
          </form>

          {/* List of Categories & Items with Edit & Delete */}
          <div className="space-y-3">
            {categories.map((c) => (
              <div key={c.id} className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                {/* Category Bar */}
                <div className="px-3.5 py-2 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-800 uppercase tracking-wide">
                      {c.nama_kategori}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      (Urutan: {c.urutan || 1})
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingCategory({ ...c })}
                      title="Edit Kategori"
                      className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingTarget({ type: 'category', id: c.id, label: c.nama_kategori })}
                      title="Hapus Kategori"
                      className="p-1 text-zinc-500 hover:text-red-600 hover:bg-zinc-100 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Items in Category */}
                <div className="divide-y divide-zinc-100 text-xs">
                  {(c.items || []).map((it) => (
                    <div key={it.id} className="p-3 flex items-center justify-between gap-2 hover:bg-zinc-50/50">
                      <div>
                        <div className="font-medium text-zinc-900">{it.nama_item}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          Satuan: <span className="font-mono text-zinc-600 font-semibold">{it.satuan}</span>
                          &bull; Tipe: {it.tipe_perhitungan}
                          {it.formula_expression && (
                            <span className="ml-1 font-mono text-blue-600">({it.formula_expression})</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingItem({
                            ...it,
                            parameter_keys: Array.isArray(it.parameter_keys) ? it.parameter_keys.join(', ') : (it.parameter_keys || '')
                          })}
                          title="Edit Item"
                          className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTarget({ type: 'item', id: it.id, label: it.nama_item })}
                          title="Hapus Item"
                          className="p-1 text-zinc-500 hover:text-red-600 hover:bg-zinc-100 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {(c.items || []).length === 0 && (
                    <div className="p-3 text-center text-zinc-400 text-xs italic">
                      Belum ada item di dalam kategori ini.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SUMBER DAYA (FULL CRUD) */}
      {/* ========================================================= */}
      {activeTab === 'resources' && (
        <div className="space-y-3">
          {/* Form: Tambah Sumber Daya */}
          <form onSubmit={handleAddResource} className="bg-white rounded-lg p-3.5 border border-zinc-200 space-y-2 text-xs">
            <h3 className="font-semibold text-xs text-zinc-800 uppercase tracking-wide">
              + Tambah Sumber Daya Baru
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Kategori Utama</label>
                <select
                  value={newResKatUtama}
                  onChange={(e) => {
                    setNewResKatUtama(e.target.value);
                    setNewResSubKat(e.target.value === 'Tenaga Kerja' ? 'Lapangan' : 'Alat');
                  }}
                  className="w-full px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                >
                  <option value="Tenaga Kerja">Tenaga Kerja</option>
                  <option value="Bahan & Alat">Bahan & Alat</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Sub Kategori</label>
                <select
                  value={newResSubKat}
                  onChange={(e) => setNewResSubKat(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
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
                <label className="block text-[11px] text-zinc-500 mb-0.5">Nama Sumber Daya</label>
                <input
                  type="text"
                  placeholder="Mandor, Excavator..."
                  value={newResNama}
                  onChange={(e) => setNewResNama(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Satuan</label>
                <input
                  type="text"
                  placeholder="org, unit, m, m3, sak..."
                  value={newResSatuan}
                  onChange={(e) => setNewResSatuan(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
            >
              + Simpan Sumber Daya
            </button>
          </form>

          {/* Filter Pills */}
          <div className="flex gap-1.5 text-xs">
            {['all', 'Tenaga Kerja', 'Bahan & Alat'].map((f) => (
              <button
                key={f}
                onClick={() => setResourceFilter(f)}
                className={`px-3 py-1 rounded text-xs transition ${
                  resourceFilter === f
                    ? 'bg-zinc-900 text-white font-medium'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {f === 'all' ? 'Semua Sumber Daya' : f}
              </button>
            ))}
          </div>

          {/* List of Resources */}
          <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-100 text-xs">
            {filteredResources.map((r) => (
              <div key={r.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-zinc-50/50">
                <div>
                  <span className="font-medium text-zinc-900">{r.nama}</span>
                  <span className="text-[11px] text-zinc-400 ml-2">
                    {r.kategori_utama} &bull; {r.sub_kategori}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-600 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded text-[11px]">
                    {r.satuan}
                  </span>
                  <button
                    onClick={() => setEditingResource({ ...r })}
                    title="Edit Sumber Daya"
                    className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingTarget({ type: 'resource', id: r.id, label: r.nama })}
                    title="Hapus Sumber Daya"
                    className="p-1 text-zinc-500 hover:text-red-600 hover:bg-zinc-100 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: DAFTAR PROYEK (FULL CRUD) */}
      {/* ========================================================= */}
      {activeTab === 'projects' && (
        <div className="space-y-3">
          {/* Form: Tambah Proyek */}
          <form onSubmit={handleAddProject} className="bg-white rounded-lg p-3.5 border border-zinc-200 space-y-2.5 text-xs">
            <h3 className="font-semibold text-xs text-zinc-800 uppercase tracking-wide">
              + Tambah Paket Proyek Baru
            </h3>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-0.5">Nama Pekerjaan</label>
              <input
                type="text"
                placeholder="Pemasangan Jaringan Distribusi Air Bersih..."
                value={newProjNama}
                onChange={(e) => setNewProjNama(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Nomor SPP / Kontrak</label>
                <input
                  type="text"
                  placeholder="SPP/PDAM/..."
                  value={newProjSpp}
                  onChange={(e) => setNewProjSpp(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Tanggal SPP</label>
                <input
                  type="date"
                  value={newProjTanggal}
                  onChange={(e) => setNewProjTanggal(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Waktu Pelaksanaan (Hari)</label>
                <input
                  type="number"
                  placeholder="90"
                  value={newProjWaktu}
                  onChange={(e) => setNewProjWaktu(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Nama Kontraktor / Pelaksana</label>
                <input
                  type="text"
                  placeholder="PT. / CV. Kontraktor"
                  value={newProjPelaksana}
                  onChange={(e) => setNewProjPelaksana(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Pengawas Bagian</label>
                <input
                  type="text"
                  placeholder="Nama Pengawas Bagian PDAM"
                  value={newProjPengawas}
                  onChange={(e) => setNewProjPengawas(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Kepala Seksi Bagian</label>
                <input
                  type="text"
                  placeholder="Nama Kepala Seksi Bagian PDAM"
                  value={newProjKepalaSeksi}
                  onChange={(e) => setNewProjKepalaSeksi(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
            >
              + Simpan Proyek Baru
            </button>
          </form>

          {/* List of Projects with Edit & Delete */}
          <div className="space-y-2">
            {projects.map((p) => (
              <div key={p.id} className="bg-white rounded-lg p-3.5 border border-zinc-200 text-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-zinc-900 text-sm">{p.nama_pekerjaan}</h4>
                    <div className="text-zinc-500 text-[11px] flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span>SPP: <strong className="text-zinc-700">{p.no_spp || '-'}</strong></span>
                      <span>Pelaksana: <strong className="text-zinc-700">{p.pelaksana || '-'}</strong></span>
                      {p.pengawas_bagian && (
                        <span>Pengawas Bagian: <strong className="text-zinc-700">{p.pengawas_bagian}</strong></span>
                      )}
                      {p.kepala_seksi_bagian && (
                        <span>Kasi Bagian: <strong className="text-zinc-700">{p.kepala_seksi_bagian}</strong></span>
                      )}
                      {p.waktu_pelaksanaan && <span>Waktu: <strong>{p.waktu_pelaksanaan} Hari</strong></span>}
                      <span>Total Laporan: <strong>{p.total_reports || 0} Hari</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingProject({ ...p })}
                      title="Edit Proyek"
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingTarget({ type: 'project', id: p.id, label: p.nama_pekerjaan })}
                      title="Hapus Proyek"
                      className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-zinc-100 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: DATABASE HOSTINGER INFO */}
      {/* ========================================================= */}
      {activeTab === 'hostinger' && (
        <div className="bg-white rounded-lg p-3.5 border border-zinc-200 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">Konfigurasi Database Hostinger</h3>
            <button
              onClick={onOpenDbModal}
              className="px-2.5 py-1 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-50"
            >
              Cek Status Koneksi
            </button>
          </div>

          <div className="bg-zinc-50 p-3 rounded border border-zinc-200 font-mono text-[11px] space-y-1">
            <div>DB_HOST: <strong>{dbStatus?.config?.host || '148.222.53.111'}</strong></div>
            <div>DB_NAME: <strong>{dbStatus?.config?.database || 'u126089851_dbpdam'}</strong></div>
            <div>DB_USER: <strong>{dbStatus?.config?.user || 'u126089851_pdam'}</strong></div>
            <div>Status: <strong className={dbStatus?.connected ? 'text-emerald-600' : 'text-amber-600'}>{dbStatus?.connected ? 'Terhubung' : 'Terputus'}</strong></div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT KATEGORI */}
      {/* ========================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
          <div className="w-full max-w-md bg-white rounded-lg border border-zinc-200 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="font-semibold text-zinc-900 text-sm">Edit Kategori Pekerjaan</h3>
              <button onClick={() => setEditingCategory(null)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateCategory} className="space-y-2.5">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Nama Kategori</label>
                <input
                  type="text"
                  value={editingCategory.nama_kategori}
                  onChange={(e) => setEditingCategory({ ...editingCategory, nama_kategori: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Urutan</label>
                <input
                  type="number"
                  value={editingCategory.urutan || 1}
                  onChange={(e) => setEditingCategory({ ...editingCategory, urutan: parseInt(e.target.value, 10) })}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT ITEM PEKERJAAN */}
      {/* ========================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
          <div className="w-full max-w-lg bg-white rounded-lg border border-zinc-200 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="font-semibold text-zinc-900 text-sm">Edit Item Pekerjaan</h3>
              <button onClick={() => setEditingItem(null)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateItem} className="space-y-2.5">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Kategori</label>
                <select
                  value={editingItem.category_id}
                  onChange={(e) => setEditingItem({ ...editingItem, category_id: parseInt(e.target.value, 10) })}
                  className="w-full px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nama_kategori}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Nama Item Pekerjaan</label>
                <input
                  type="text"
                  value={editingItem.nama_item}
                  onChange={(e) => setEditingItem({ ...editingItem, nama_item: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-0.5">Satuan</label>
                  <input
                    type="text"
                    value={editingItem.satuan}
                    onChange={(e) => setEditingItem({ ...editingItem, satuan: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-0.5">Tipe Perhitungan</label>
                  <select
                    value={editingItem.tipe_perhitungan}
                    onChange={(e) => setEditingItem({ ...editingItem, tipe_perhitungan: e.target.value })}
                    className="w-full px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                  >
                    <option value="RUMUS_DINAMIS">Rumus Dinamis</option>
                    <option value="MANUAL">Input Manual</option>
                  </select>
                </div>
              </div>

              {editingItem.tipe_perhitungan === 'RUMUS_DINAMIS' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-0.5">Formula (Rumus)</label>
                    <input
                      type="text"
                      value={editingItem.formula_expression || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, formula_expression: e.target.value })}
                      placeholder="p * l * t"
                      className="w-full font-mono px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-0.5">Parameter (koma)</label>
                    <input
                      type="text"
                      value={editingItem.parameter_keys || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, parameter_keys: e.target.value })}
                      placeholder="p, l, t"
                      className="w-full font-mono px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT SUMBER DAYA */}
      {/* ========================================================= */}
      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
          <div className="w-full max-w-md bg-white rounded-lg border border-zinc-200 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="font-semibold text-zinc-900 text-sm">Edit Sumber Daya</h3>
              <button onClick={() => setEditingResource(null)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateResource} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-0.5">Kategori Utama</label>
                  <select
                    value={editingResource.kategori_utama}
                    onChange={(e) => setEditingResource({
                      ...editingResource,
                      kategori_utama: e.target.value,
                      sub_kategori: e.target.value === 'Tenaga Kerja' ? 'Lapangan' : 'Alat'
                    })}
                    className="w-full px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                  >
                    <option value="Tenaga Kerja">Tenaga Kerja</option>
                    <option value="Bahan & Alat">Bahan & Alat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-0.5">Sub Kategori</label>
                  <select
                    value={editingResource.sub_kategori}
                    onChange={(e) => setEditingResource({ ...editingResource, sub_kategori: e.target.value })}
                    className="w-full px-2 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                  >
                    {editingResource.kategori_utama === 'Tenaga Kerja' ? (
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
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Nama Sumber Daya</label>
                <input
                  type="text"
                  value={editingResource.nama}
                  onChange={(e) => setEditingResource({ ...editingResource, nama: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Satuan</label>
                <input
                  type="text"
                  value={editingResource.satuan}
                  onChange={(e) => setEditingResource({ ...editingResource, satuan: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingResource(null)}
                  className="px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT PROYEK */}
      {/* ========================================================= */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
          <div className="w-full max-w-lg bg-white rounded-lg border border-zinc-200 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="font-semibold text-zinc-900 text-sm">Edit Paket Proyek</h3>
              <button onClick={() => setEditingProject(null)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateProject} className="space-y-2.5">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-0.5">Nama Pekerjaan</label>
                <input
                  type="text"
                  value={editingProject.nama_pekerjaan}
                  onChange={(e) => setEditingProject({ ...editingProject, nama_pekerjaan: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-0.5">Nomor SPP</label>
                  <input
                    type="text"
                    value={editingProject.no_spp || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, no_spp: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-0.5">Tanggal SPP</label>
                  <input
                    type="date"
                    value={editingProject.tanggal_spp ? editingProject.tanggal_spp.split('T')[0] : ''}
                    onChange={(e) => setEditingProject({ ...editingProject, tanggal_spp: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-0.5">Waktu (Hari)</label>
                  <input
                    type="number"
                    value={editingProject.waktu_pelaksanaan || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, waktu_pelaksanaan: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-0.5">Pelaksana / Kontraktor</label>
                  <input
                    type="text"
                    value={editingProject.pelaksana || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, pelaksana: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-0.5">Pengawas Bagian</label>
                  <input
                    type="text"
                    value={editingProject.pengawas_bagian || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, pengawas_bagian: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-0.5">Kepala Seksi Bagian</label>
                  <input
                    type="text"
                    value={editingProject.kepala_seksi_bagian || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, kepala_seksi_bagian: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DIALOG KONFIRMASI HAPUS (UNIVERSAL) */}
      {/* ========================================================= */}
      {deletingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
          <div className="w-full max-w-sm bg-white rounded-lg border border-zinc-200 p-4 space-y-3 text-xs">
            <h3 className="font-semibold text-zinc-900 text-sm text-red-600 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              <span>Konfirmasi Hapus</span>
            </h3>
            <p className="text-zinc-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>&quot;{deletingTarget.label}&quot;</strong>?
              {deletingTarget.type === 'category' && ' Seluruh item di dalam kategori ini juga akan terhapus.'}
              {deletingTarget.type === 'project' && ' Seluruh laporan harian yang terkait dengan proyek ini juga akan terhapus.'}
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingTarget(null)}
                className="px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-50 font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deletingTarget.type === 'category') handleDeleteCategory(deletingTarget.id);
                  else if (deletingTarget.type === 'item') handleDeleteItem(deletingTarget.id);
                  else if (deletingTarget.type === 'resource') handleDeleteResource(deletingTarget.id);
                  else if (deletingTarget.type === 'project') handleDeleteProject(deletingTarget.id);
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
