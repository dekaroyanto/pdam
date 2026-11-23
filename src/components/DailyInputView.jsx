'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  AlertCircle, 
  Users, 
  Wrench, 
  Layers
} from 'lucide-react';
import { calculateVolume, formatNumberIndo } from '@/lib/calculator';

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function DailyInputView({
  projectId,
  onSaveSuccess,
  onCancel,
  editReportId = null
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Master options available to add
  const [allCategories, setAllCategories] = useState([]);
  const [allJobItems, setAllJobItems] = useState([]);
  const [allResources, setAllResources] = useState([]);

  // Form Header State
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [hari, setHari] = useState(() => INDO_DAYS[new Date().getDay()]);
  const [mingguKe, setMingguKe] = useState(1);
  const [catatan, setCatatan] = useState('');

  // 1. SEGMENT: TENAGA KERJA (Management & Lapangan)
  // Array of { id: resource_id, resource: fullResourceObj, jumlah: 1 }
  const [addedManpower, setAddedManpower] = useState([]);

  // 2. SEGMENT: BAHAN & ALAT
  // Array of { id: resource_id, resource: fullResourceObj, jumlah: 1 }
  const [addedMaterialsAndTools, setAddedMaterialsAndTools] = useState([]);

  // 3. SEGMENT: PEKERJAAN YANG DIHASILKAN
  // Array of { id: job_item_id, item: fullItemObj, params: { [key]: value }, manualVolume: 0, volume: 0 }
  const [addedJobItems, setAddedJobItems] = useState([]);

  // Handle Date Change -> Auto Day
  const handleDateChange = (val) => {
    setTanggal(val);
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        setHari(INDO_DAYS[d.getDay()]);
      }
    }
  };

  // Fetch Master Data & Existing Report if Editing
  useEffect(() => {
    const fetchMasterAndReport = async () => {
      setLoading(true);
      try {
        const [catRes, resRes] = await Promise.all([
          fetch('/api/job-categories').then((r) => r.json()),
          fetch('/api/master-resources?active_only=true').then((r) => r.json())
        ]);

        let flatItems = [];
        if (Array.isArray(catRes)) {
          setAllCategories(catRes);
          catRes.forEach((c) => {
            if (Array.isArray(c.items)) {
              flatItems = flatItems.concat(c.items);
            }
          });
          setAllJobItems(flatItems);
        }

        if (Array.isArray(resRes)) {
          setAllResources(resRes);
        }

        // If editing existing report, load its items
        if (editReportId) {
          const repRes = await fetch(`/api/daily-reports/${editReportId}`).then((r) => r.json());
          if (repRes.report) {
            setTanggal(repRes.report.tanggal);
            setHari(repRes.report.hari);
            setMingguKe(repRes.report.minggu_ke);
            setCatatan(repRes.report.catatan || '');

            // 1 & 2. Populate resources separated into Tenaga Kerja vs Bahan & Alat
            if (Array.isArray(repRes.resource_usages)) {
              const loadedManpower = [];
              const loadedEquip = [];

              repRes.resource_usages.forEach((ru) => {
                const matchedResource = (Array.isArray(resRes) ? resRes : []).find((mr) => mr.id === ru.master_resource_id) || {
                  id: ru.master_resource_id,
                  nama: ru.resource_nama,
                  satuan: ru.satuan,
                  kategori_utama: ru.kategori_utama,
                  sub_kategori: ru.sub_kategori
                };

                const itemData = {
                  id: ru.master_resource_id,
                  resource: matchedResource,
                  jumlah: parseFloat(ru.jumlah) || 1
                };

                if (matchedResource.kategori_utama === 'Tenaga Kerja') {
                  loadedManpower.push(itemData);
                } else {
                  loadedEquip.push(itemData);
                }
              });

              setAddedManpower(loadedManpower);
              setAddedMaterialsAndTools(loadedEquip);
            }

            // 3. Populate added job items
            if (Array.isArray(repRes.progress_items)) {
              const loadedItems = repRes.progress_items.map((pi) => {
                const matchedMaster = flatItems.find((fi) => fi.id === pi.job_item_id) || {
                  id: pi.job_item_id,
                  nama_item: pi.nama_item,
                  satuan: pi.satuan,
                  tipe_perhitungan: pi.tipe_perhitungan,
                  formula_expression: pi.formula_expression,
                  parameter_keys: pi.parameter_keys || []
                };

                return {
                  id: pi.job_item_id,
                  item: matchedMaster,
                  params: pi.parameter_values || {},
                  manualVolume: pi.volume_harian || 0,
                  volume: pi.volume_harian || 0
                };
              });
              setAddedJobItems(loadedItems);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching master data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMasterAndReport();
  }, [editReportId]);

  // ==========================================
  // 1. TENAGA KERJA HANDLERS
  // ==========================================
  const handleSelectManpower = (resIdStr) => {
    if (!resIdStr) return;
    const resId = parseInt(resIdStr, 10);
    const resObj = allResources.find((r) => r.id === resId);
    if (!resObj) return;

    if (addedManpower.some((ar) => ar.id === resId)) {
      alert(`Tenaga kerja "${resObj.nama}" sudah ada di daftar.`);
      return;
    }

    setAddedManpower((prev) => [
      ...prev,
      {
        id: resId,
        resource: resObj,
        jumlah: 1
      }
    ]);
  };

  const handleRemoveManpower = (resId) => {
    setAddedManpower((prev) => prev.filter((ar) => ar.id !== resId));
  };

  const stepManpower = (resId, delta) => {
    setAddedManpower((prev) =>
      prev.map((entry) => {
        if (entry.id !== resId) return entry;
        return {
          ...entry,
          jumlah: Math.max(0, (parseFloat(entry.jumlah) || 0) + delta)
        };
      })
    );
  };

  const handleManpowerQtyChange = (resId, qty) => {
    const num = parseFloat(qty);
    setAddedManpower((prev) =>
      prev.map((entry) => {
        if (entry.id !== resId) return entry;
        return {
          ...entry,
          jumlah: isNaN(num) ? 0 : Math.max(0, num)
        };
      })
    );
  };

  // ==========================================
  // 2. BAHAN & ALAT HANDLERS
  // ==========================================
  const handleSelectMaterialOrTool = (resIdStr) => {
    if (!resIdStr) return;
    const resId = parseInt(resIdStr, 10);
    const resObj = allResources.find((r) => r.id === resId);
    if (!resObj) return;

    if (addedMaterialsAndTools.some((ar) => ar.id === resId)) {
      alert(`Bahan / alat "${resObj.nama}" sudah ada di daftar.`);
      return;
    }

    setAddedMaterialsAndTools((prev) => [
      ...prev,
      {
        id: resId,
        resource: resObj,
        jumlah: 1
      }
    ]);
  };

  const handleRemoveMaterialOrTool = (resId) => {
    setAddedMaterialsAndTools((prev) => prev.filter((ar) => ar.id !== resId));
  };

  const stepMaterialOrTool = (resId, delta) => {
    setAddedMaterialsAndTools((prev) =>
      prev.map((entry) => {
        if (entry.id !== resId) return entry;
        return {
          ...entry,
          jumlah: Math.max(0, (parseFloat(entry.jumlah) || 0) + delta)
        };
      })
    );
  };

  const handleMaterialOrToolQtyChange = (resId, qty) => {
    const num = parseFloat(qty);
    setAddedMaterialsAndTools((prev) =>
      prev.map((entry) => {
        if (entry.id !== resId) return entry;
        return {
          ...entry,
          jumlah: isNaN(num) ? 0 : Math.max(0, num)
        };
      })
    );
  };

  // ==========================================
  // 3. PEKERJAAN YANG DIHASILKAN HANDLERS
  // ==========================================
  const handleSelectJobItem = (jobItemIdStr) => {
    if (!jobItemIdStr) return;
    const itemId = parseInt(jobItemIdStr, 10);
    const itemObj = allJobItems.find((i) => i.id === itemId);
    if (!itemObj) return;

    if (addedJobItems.some((ai) => ai.id === itemId)) {
      alert(`Item "${itemObj.nama_item}" sudah ada di daftar.`);
      return;
    }

    const initialParams = {};
    if (Array.isArray(itemObj.parameter_keys)) {
      itemObj.parameter_keys.forEach((k) => {
        initialParams[k] = '';
      });
    }

    setAddedJobItems((prev) => [
      ...prev,
      {
        id: itemId,
        item: itemObj,
        params: initialParams,
        manualVolume: 0,
        volume: 0
      }
    ]);
  };

  const handleRemoveJobItem = (itemId) => {
    setAddedJobItems((prev) => prev.filter((ai) => ai.id !== itemId));
  };

  const handleParamChange = (itemId, paramKey, val) => {
    setAddedJobItems((prev) =>
      prev.map((entry) => {
        if (entry.id !== itemId) return entry;
        const newParams = { ...entry.params, [paramKey]: val };
        const calculated = calculateVolume({
          formula: entry.item.formula_expression,
          params: newParams,
          type: entry.item.tipe_perhitungan,
          manualVolume: entry.manualVolume
        });

        return {
          ...entry,
          params: newParams,
          volume: calculated
        };
      })
    );
  };

  const handleManualVolumeChange = (itemId, val) => {
    const num = parseFloat(val) || 0;
    setAddedJobItems((prev) =>
      prev.map((entry) => {
        if (entry.id !== itemId) return entry;
        return {
          ...entry,
          manualVolume: val,
          volume: num
        };
      })
    );
  };

  // ==========================================
  // SUBMIT FORM
  // ==========================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!projectId) {
      alert('Pilih proyek terlebih dahulu.');
      return;
    }

    if (addedManpower.length === 0 && addedMaterialsAndTools.length === 0 && addedJobItems.length === 0 && !catatan.trim()) {
      alert('Isi setidaknya satu tenaga kerja, bahan/alat, pekerjaan fisik, atau catatan lapangan.');
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const progressPayload = addedJobItems.map((entry) => ({
        job_item_id: entry.id,
        parameter_values: entry.params || {},
        volume_harian: entry.volume,
        formula: entry.item.formula_expression,
        tipe_perhitungan: entry.item.tipe_perhitungan
      }));

      // Combine Manpower + Materials/Tools into resource_usages
      const combinedResources = [...addedManpower, ...addedMaterialsAndTools];
      const resourcePayload = combinedResources
        .filter((entry) => (parseFloat(entry.jumlah) || 0) > 0)
        .map((entry) => ({
          master_resource_id: entry.id,
          jumlah: parseFloat(entry.jumlah) || 0
        }));

      const bodyData = {
        project_id: projectId,
        minggu_ke: parseInt(mingguKe, 10) || 1,
        hari,
        tanggal,
        catatan,
        progress_items: progressPayload,
        resource_usages: resourcePayload
      };

      const url = editReportId ? `/api/daily-reports/${editReportId}` : '/api/daily-reports';
      const method = editReportId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan laporan.');
      }

      setMessage({ type: 'success', text: editReportId ? 'Laporan berhasil diperbarui!' : 'Laporan harian berhasil disimpan!' });
      setTimeout(() => {
        onSaveSuccess && onSaveSuccess(json.id || editReportId);
      }, 600);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Group master lists for dropdowns
  const manpowerManagement = allResources.filter((r) => r.kategori_utama === 'Tenaga Kerja' && r.sub_kategori === 'Management');
  const manpowerLapangan = allResources.filter((r) => r.kategori_utama === 'Tenaga Kerja' && r.sub_kategori === 'Lapangan');

  const equipAlat = allResources.filter((r) => r.kategori_utama === 'Bahan & Alat' && r.sub_kategori === 'Alat');
  const equipBahan = allResources.filter((r) => r.kategori_utama === 'Bahan & Alat' && r.sub_kategori === 'Bahan');
  const equipAccessories = allResources.filter((r) => r.kategori_utama === 'Bahan & Alat' && r.sub_kategori === 'Accessories');

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* Form Header Info */}
      <div className="bg-white rounded-lg border border-zinc-200 p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              {editReportId ? 'Edit Laporan Harian' : 'Input Laporan Harian'}
            </h2>
            <p className="text-[11px] text-zinc-400">
              Isi data harian secara ringkas sesuai pekerjaan hari ini
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-zinc-500 hover:text-zinc-800"
            >
              Batal
            </button>
          )}
        </div>

        {/* Date, Day, Week Inputs */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">
              Hari
            </label>
            <input
              type="text"
              value={hari}
              onChange={(e) => setHari(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">
              Minggu Ke-
            </label>
            <input
              type="number"
              min="1"
              max="52"
              value={mingguKe}
              onChange={(e) => setMingguKe(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className={`p-3 rounded text-xs flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* ========================================================= */}
      {/* SEGMEN 1: TENAGA KERJA (MANAGEMENT & LAPANGAN) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-lg border border-zinc-200 p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div>
            <h3 className="text-xs font-semibold text-zinc-800 uppercase tracking-wide">
              1. Tenaga Kerja (Management & Lapangan)
            </h3>
            <span className="text-[11px] text-zinc-400">
              {addedManpower.length} tenaga kerja terisi
            </span>
          </div>
        </div>

        {/* Added Manpower List */}
        <div className="space-y-2">
          {addedManpower.map((entry) => (
            <div
              key={entry.id}
              className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 flex items-center justify-between gap-2 text-xs"
            >
              <div>
                <div className="font-medium text-zinc-900">{entry.resource.nama}</div>
                <div className="text-[10px] text-zinc-400">
                  {entry.resource.sub_kategori} &bull; {entry.resource.satuan}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => stepManpower(entry.id, -1)}
                    className="w-6 h-6 rounded border border-zinc-300 bg-white text-zinc-700 flex items-center justify-center hover:bg-zinc-100 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={entry.jumlah ?? ''}
                    onChange={(e) => handleManpowerQtyChange(entry.id, e.target.value)}
                    placeholder="0"
                    className="w-14 text-center text-xs font-mono font-semibold py-1 bg-white border border-zinc-300 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => stepManpower(entry.id, 1)}
                    className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono min-w-[24px]">
                  {entry.resource.satuan}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveManpower(entry.id)}
                  title="Hapus"
                  className="p-1 rounded text-zinc-400 hover:text-red-600 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {addedManpower.length === 0 && (
            <div className="p-3 text-center text-zinc-400 text-xs border border-dashed border-zinc-200 rounded-lg">
              Belum ada tenaga kerja yang ditambahkan hari ini.
            </div>
          )}
        </div>

        {/* Dropdown Selector: Tambah Tenaga Kerja */}
        <div className="pt-1">
          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
            + Tambah Tenaga Kerja:
          </label>
          <select
            value=""
            onChange={(e) => handleSelectManpower(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white border border-dashed border-zinc-300 hover:border-zinc-400 rounded-lg text-zinc-700 cursor-pointer focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Pilih Tenaga Kerja (Management / Lapangan) --</option>
            {manpowerManagement.length > 0 && (
              <optgroup label="Management">
                {manpowerManagement.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama} ({r.satuan})
                  </option>
                ))}
              </optgroup>
            )}
            {manpowerLapangan.length > 0 && (
              <optgroup label="Lapangan">
                {manpowerLapangan.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama} ({r.satuan})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEGMEN 2: BAHAN & ALAT */}
      {/* ========================================================= */}
      <div className="bg-white rounded-lg border border-zinc-200 p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div>
            <h3 className="text-xs font-semibold text-zinc-800 uppercase tracking-wide">
              2. Bahan & Alat
            </h3>
            <span className="text-[11px] text-zinc-400">
              {addedMaterialsAndTools.length} bahan & alat terisi
            </span>
          </div>
        </div>

        {/* Added Materials & Tools List */}
        <div className="space-y-2">
          {addedMaterialsAndTools.map((entry) => (
            <div
              key={entry.id}
              className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 flex items-center justify-between gap-2 text-xs"
            >
              <div>
                <div className="font-medium text-zinc-900">{entry.resource.nama}</div>
                <div className="text-[10px] text-zinc-400">
                  {entry.resource.sub_kategori} &bull; {entry.resource.satuan}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => stepMaterialOrTool(entry.id, -1)}
                    className="w-6 h-6 rounded border border-zinc-300 bg-white text-zinc-700 flex items-center justify-center hover:bg-zinc-100 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={entry.jumlah ?? ''}
                    onChange={(e) => handleMaterialOrToolQtyChange(entry.id, e.target.value)}
                    placeholder="0"
                    className="w-16 text-center text-xs font-mono font-semibold py-1 bg-white border border-zinc-300 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => stepMaterialOrTool(entry.id, 1)}
                    className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono min-w-[24px]">
                  {entry.resource.satuan}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveMaterialOrTool(entry.id)}
                  title="Hapus"
                  className="p-1 rounded text-zinc-400 hover:text-red-600 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {addedMaterialsAndTools.length === 0 && (
            <div className="p-3 text-center text-zinc-400 text-xs border border-dashed border-zinc-200 rounded-lg">
              Belum ada bahan atau alat yang ditambahkan hari ini.
            </div>
          )}
        </div>

        {/* Dropdown Selector: Tambah Bahan & Alat */}
        <div className="pt-1">
          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
            + Tambah Bahan / Alat:
          </label>
          <select
            value=""
            onChange={(e) => handleSelectMaterialOrTool(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white border border-dashed border-zinc-300 hover:border-zinc-400 rounded-lg text-zinc-700 cursor-pointer focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Pilih Bahan, Alat, atau Aksesoris --</option>
            {equipAlat.length > 0 && (
              <optgroup label="Peralatan">
                {equipAlat.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama} ({r.satuan})
                  </option>
                ))}
              </optgroup>
            )}
            {equipBahan.length > 0 && (
              <optgroup label="Bahan Material">
                {equipBahan.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama} ({r.satuan})
                  </option>
                ))}
              </optgroup>
            )}
            {equipAccessories.length > 0 && (
              <optgroup label="Aksesoris / Fitting">
                {equipAccessories.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama} ({r.satuan})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEGMEN 3: PEKERJAAN YANG DIHASILKAN */}
      {/* ========================================================= */}
      <div className="bg-white rounded-lg border border-zinc-200 p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div>
            <h3 className="text-xs font-semibold text-zinc-800 uppercase tracking-wide">
              3. Pekerjaan yang Dihasilkan
            </h3>
            <span className="text-[11px] text-zinc-400">
              {addedJobItems.length} item pekerjaan terisi
            </span>
          </div>
        </div>

        {/* Added Job Items List */}
        <div className="space-y-2.5">
          {addedJobItems.map((entry, index) => {
            const hasDynamicFormula = entry.item.tipe_perhitungan === 'RUMUS_DINAMIS' && entry.item.formula_expression;
            const paramKeys = entry.item.parameter_keys || [];

            return (
              <div
                key={entry.id}
                className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-2"
              >
                {/* Header item */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-900">
                        {index + 1}. {entry.item.nama_item}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Satuan: <span className="font-mono text-zinc-600 font-semibold">{entry.item.satuan}</span>
                      {hasDynamicFormula && ` &bull; Rumus: ${entry.item.formula_expression}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block">Volume</span>
                      <span className="text-sm font-bold font-mono text-blue-600">
                        {formatNumberIndo(entry.volume)} <span className="text-[10px] font-normal text-zinc-500">{entry.item.satuan}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveJobItem(entry.id)}
                      title="Hapus item ini"
                      className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-zinc-100 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Input Fields */}
                {hasDynamicFormula && paramKeys.length > 0 ? (
                  <div className="bg-white p-2.5 rounded border border-zinc-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {paramKeys.map((k) => (
                      <div key={k}>
                        <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-0.5">
                          {k}
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="0"
                          value={entry.params[k] ?? ''}
                          onChange={(e) => handleParamChange(entry.id, k, e.target.value)}
                          className="w-full text-xs font-mono px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Volume:</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={entry.manualVolume || ''}
                      onChange={(e) => handleManualVolumeChange(entry.id, e.target.value)}
                      className="w-28 text-xs font-mono px-2 py-1 bg-white border border-zinc-300 rounded text-zinc-900 focus:outline-none focus:border-zinc-500"
                    />
                    <span className="text-xs text-zinc-500">{entry.item.satuan}</span>
                  </div>
                )}
              </div>
            );
          })}

          {addedJobItems.length === 0 && (
            <div className="p-3 text-center text-zinc-400 text-xs border border-dashed border-zinc-200 rounded-lg">
              Belum ada pekerjaan yang dipilih untuk hari ini.
            </div>
          )}
        </div>

        {/* Dropdown Selector: Tambah Pekerjaan */}
        <div className="pt-1">
          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
            + Tambah Pekerjaan yang Dihasilkan:
          </label>
          <select
            value=""
            onChange={(e) => handleSelectJobItem(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white border border-dashed border-zinc-300 hover:border-zinc-400 rounded-lg text-zinc-700 cursor-pointer focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Pilih Pekerjaan yang Dihasilkan --</option>
            {allCategories.map((cat) => (
              <optgroup key={cat.id} label={cat.nama_kategori}>
                {(cat.items || []).map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.nama_item} ({it.satuan})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEGMEN 4: CATATAN LAPANGAN & CUACA */}
      {/* ========================================================= */}
      <div className="bg-white rounded-lg border border-zinc-200 p-4 space-y-2">
        <label className="block text-xs font-semibold text-zinc-800 uppercase tracking-wide">
          Catatan Lapangan & Cuaca
        </label>
        <textarea
          rows="3"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Kondisi cuaca, kendala lapangan, STA lokasi kerja, atau catatan penting lainnya..."
          className="w-full text-xs p-2.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
        />

        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[11px] text-zinc-400 self-center mr-1">Opsi cepat:</span>
          {['Cuaca Cerah', 'Hujan Siang (Istirahat 2 Jam)', 'Kondisi Aman Terkendali', 'Hydrotest Selesai'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setCatatan((prev) => (prev ? `${prev}. ${tag}` : tag))}
              className="text-[11px] px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Sticky Submit Bar */}
      <div className="fixed md:static bottom-14 md:bottom-auto left-0 right-0 p-3 bg-white/95 backdrop-blur-xs border-t md:border-0 border-zinc-200 z-30 flex items-center justify-between gap-3">
        <span className="text-xs text-zinc-500 hidden sm:inline">
          {addedManpower.length} tenaga &bull; {addedMaterialsAndTools.length} bahan/alat &bull; {addedJobItems.length} pekerjaan
        </span>

        <button
          onClick={handleSubmit}
          disabled={submitting || !projectId}
          className="w-full md:w-auto px-6 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition"
        >
          <Save className="w-3.5 h-3.5" />
          {submitting ? 'Menyimpan...' : (editReportId ? 'Simpan Perubahan' : 'Simpan Laporan Harian')}
        </button>
      </div>
    </div>
  );
}
