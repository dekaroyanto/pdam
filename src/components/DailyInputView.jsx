'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Layers, 
  Users, 
  Wrench, 
  FileText, 
  Save, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Calculator, 
  Plus, 
  Minus,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { calculateVolume, formatNumberIndo } from '@/lib/calculator';

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function DailyInputView({
  projectId,
  onSaveSuccess,
  onCancel,
  editReportId = null
}) {
  const [activeSection, setActiveSection] = useState('progress'); // 'progress', 'resources', 'notes'
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [hari, setHari] = useState(() => INDO_DAYS[new Date().getDay()]);
  const [mingguKe, setMingguKe] = useState(1);
  const [catatan, setCatatan] = useState('');

  // Progress values: { [job_item_id]: { params: { [key]: value }, manualVolume: 0, volume: 0 } }
  const [progressData, setProgressData] = useState({});

  // Resource values: { [resource_id]: qty }
  const [resourceData, setResourceData] = useState({});

  // Expanded categories accordion
  const [expandedCategories, setExpandedCategories] = useState({});

  // Auto calculate day of week when date changes
  const handleDateChange = (val) => {
    setTanggal(val);
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        setHari(INDO_DAYS[d.getDay()]);
      }
    }
  };

  // Fetch categories, items, and resources
  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, resRes] = await Promise.all([
          fetch('/api/job-categories').then((r) => r.json()),
          fetch('/api/master-resources?active_only=true').then((r) => r.json())
        ]);

        if (Array.isArray(catRes)) {
          setCategories(catRes);
          // Expand all categories by default
          const exp = {};
          catRes.forEach((c) => { exp[c.id] = true; });
          setExpandedCategories(exp);
        }

        if (Array.isArray(resRes)) {
          setResources(resRes);
        }

        // If editing an existing report, load its data
        if (editReportId) {
          const repRes = await fetch(`/api/daily-reports/${editReportId}`).then((r) => r.json());
          if (repRes.report) {
            setTanggal(repRes.report.tanggal);
            setHari(repRes.report.hari);
            setMingguKe(repRes.report.minggu_ke);
            setCatatan(repRes.report.catatan || '');

            const pMap = {};
            if (repRes.progress_items) {
              for (const pi of repRes.progress_items) {
                pMap[pi.job_item_id] = {
                  params: pi.parameter_values || {},
                  manualVolume: pi.volume_harian || 0,
                  volume: pi.volume_harian || 0
                };
              }
            }
            setProgressData(pMap);

            const rMap = {};
            if (repRes.resource_usages) {
              for (const ru of repRes.resource_usages) {
                rMap[ru.master_resource_id] = ru.jumlah;
              }
            }
            setResourceData(rMap);
          }
        }
      } catch (err) {
        console.error('Error fetching input form data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, editReportId]);

  // Handle parameter value change for dynamic job items
  const handleParamChange = (item, paramKey, val) => {
    const prev = progressData[item.id] || { params: {}, manualVolume: 0, volume: 0 };
    const newParams = { ...prev.params, [paramKey]: val };

    const calculated = calculateVolume({
      formula: item.formula_expression,
      params: newParams,
      type: item.tipe_perhitungan,
      manualVolume: prev.manualVolume
    });

    setProgressData({
      ...progressData,
      [item.id]: {
        ...prev,
        params: newParams,
        volume: calculated
      }
    });
  };

  // Handle manual volume change
  const handleManualVolumeChange = (item, val) => {
    const prev = progressData[item.id] || { params: {}, manualVolume: 0, volume: 0 };
    const num = parseFloat(val) || 0;

    setProgressData({
      ...progressData,
      [item.id]: {
        ...prev,
        manualVolume: val,
        volume: num
      }
    });
  };

  // Handle resource quantity change
  const handleResourceChange = (resId, qty) => {
    const val = parseFloat(qty);
    if (isNaN(val) || val <= 0) {
      const copy = { ...resourceData };
      delete copy[resId];
      setResourceData(copy);
    } else {
      setResourceData({
        ...resourceData,
        [resId]: val
      });
    }
  };

  // Handle stepper increment/decrement
  const stepResource = (resId, delta) => {
    const current = parseFloat(resourceData[resId] || 0);
    const next = Math.max(0, current + delta);
    handleResourceChange(resId, next);
  };

  // Submit report
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      // Build progress_items payload
      const progressPayload = [];
      for (const cat of categories) {
        for (const item of (cat.items || [])) {
          const entry = progressData[item.id];
          if (entry && (entry.volume > 0 || (entry.params && Object.keys(entry.params).length > 0))) {
            progressPayload.push({
              job_item_id: item.id,
              parameter_values: entry.params || {},
              volume_harian: entry.volume,
              formula: item.formula_expression,
              tipe_perhitungan: item.tipe_perhitungan
            });
          }
        }
      }

      // Build resource_usages payload
      const resourcePayload = [];
      for (const [resId, qty] of Object.entries(resourceData)) {
        if (parseFloat(qty) > 0) {
          resourcePayload.push({
            master_resource_id: parseInt(resId, 10),
            jumlah: parseFloat(qty)
          });
        }
      }

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
        throw new Error(json.error || 'Gagal menyimpan laporan');
      }

      setMessage({ type: 'success', text: editReportId ? 'Laporan berhasil diperbarui!' : 'Laporan harian berhasil disimpan!' });
      setTimeout(() => {
        onSaveSuccess && onSaveSuccess(json.id || editReportId);
      }, 1000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategory = (catId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Group resources
  const manpowerResources = resources.filter((r) => r.kategori_utama === 'Tenaga Kerja');
  const equipmentResources = resources.filter((r) => r.kategori_utama === 'Bahan & Alat');

  // Count active inputs for badges
  const activeProgressCount = Object.values(progressData).filter((p) => p && p.volume > 0).length;
  const activeResourceCount = Object.values(resourceData).filter((v) => v && v > 0).length;

  return (
    <div className="space-y-4 pb-28 md:pb-8">
      {/* Sticky Header Info */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {editReportId ? 'Edit Laporan Harian' : 'Input Laporan Harian'}
          </h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Batal
            </button>
          )}
        </div>

        {/* Date, Day, and Week Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Hari
            </label>
            <input
              type="text"
              value={hari}
              onChange={(e) => setHari(e.target.value)}
              placeholder="Senin"
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Minggu Ke-
            </label>
            <input
              type="number"
              min="1"
              max="52"
              value={mingguKe}
              onChange={(e) => setMingguKe(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
        <button
          onClick={() => setActiveSection('progress')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
            activeSection === 'progress'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Progres Fisik</span>
          {activeProgressCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
              {activeProgressCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSection('resources')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
            activeSection === 'resources'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Tenaga & Alat</span>
          {activeResourceCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center">
              {activeResourceCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSection('notes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
            activeSection === 'notes'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Catatan</span>
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* SECTION 1: PROGRES FISIK */}
      {activeSection === 'progress' && (
        <div className="space-y-3">
          {categories.length > 0 ? (
            categories.map((cat) => {
              const isExpanded = expandedCategories[cat.id];
              return (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden"
                >
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategory(cat.id)}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition"
                  >
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                      {cat.nama_kategori}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {(cat.items || []).length} item
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  {isExpanded && (
                    <div className="p-3 divide-y divide-slate-100 dark:divide-slate-700/60 space-y-3">
                      {(cat.items || []).map((item) => {
                        const curEntry = progressData[item.id] || { params: {}, manualVolume: 0, volume: 0 };
                        const hasDynamicFormula = item.tipe_perhitungan === 'RUMUS_DINAMIS' && item.formula_expression;
                        const paramKeys = item.parameter_keys || [];

                        return (
                          <div key={item.id} className="pt-3 first:pt-0 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                                  {item.nama_item}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                                    Satuan: {item.satuan}
                                  </span>
                                  {hasDynamicFormula && (
                                    <span className="text-[10px] text-blue-500 font-mono">
                                      Rumus: {item.formula_expression}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Calculated Volume Result Pill */}
                              <div className="text-right shrink-0">
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">Volume</div>
                                <div className={`text-sm font-bold font-mono ${
                                  curEntry.volume > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                                }`}>
                                  {formatNumberIndo(curEntry.volume)} <span className="text-[10px] font-normal text-slate-500">{item.satuan}</span>
                                </div>
                              </div>
                            </div>

                            {/* Parameter Input Fields if dynamic */}
                            {hasDynamicFormula && paramKeys.length > 0 ? (
                              <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {paramKeys.map((k) => (
                                  <div key={k}>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                                      {k}
                                    </label>
                                    <input
                                      type="number"
                                      step="any"
                                      placeholder="0"
                                      value={curEntry.params[k] ?? ''}
                                      onChange={(e) => handleParamChange(item, k, e.target.value)}
                                      className="w-full text-xs font-mono font-medium px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* Direct Manual Input */
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="0.00"
                                  value={curEntry.manualVolume || ''}
                                  onChange={(e) => handleManualVolumeChange(item, e.target.value)}
                                  className="w-32 text-xs font-mono font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                                <span className="text-xs text-slate-500">{item.satuan}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border">
              <Layers className="w-8 h-8 mx-auto opacity-40 mb-2" />
              <p className="text-xs">Belum ada item pekerjaan untuk proyek ini.</p>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: SUMBER DAYA (TENAGA KERJA & PERALATAN / BAHAN) */}
      {activeSection === 'resources' && (
        <div className="space-y-4">
          {/* Tenaga Kerja */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Tenaga Kerja
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {manpowerResources.map((res) => {
                const qty = resourceData[res.id] || 0;
                return (
                  <div
                    key={res.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {res.nama}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {res.sub_kategori} &bull; {res.satuan}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => stepResource(res.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center active:scale-95 text-xs font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={resourceData[res.id] ?? ''}
                        onChange={(e) => handleResourceChange(res.id, e.target.value)}
                        placeholder="0"
                        className="w-12 text-center text-xs font-bold font-mono py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />

                      <button
                        type="button"
                        onClick={() => stepResource(res.id, 1)}
                        className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center active:scale-95 text-xs font-bold shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alat, Bahan & Accessories */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Peralatan, Bahan & Accessories
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {equipmentResources.map((res) => (
                <div
                  key={res.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {res.nama}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {res.sub_kategori} &bull; {res.satuan}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={resourceData[res.id] ?? ''}
                      onChange={(e) => handleResourceChange(res.id, e.target.value)}
                      placeholder="0"
                      className="w-20 text-right text-xs font-mono font-bold px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <span className="text-[11px] text-slate-500 min-w-[28px]">{res.satuan}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CATATAN & CUACA */}
      {activeSection === 'notes' && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
            Catatan Lapangan & Kondisi Cuaca
          </label>
          <textarea
            rows="5"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Contoh: Cuaca cerah pagi s.d. sore. Terjadi kendala pipa existing bocor di STA 0+250 dan telah diperbaiki. Pekerjaan galian berjalan lancar."
            className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 self-center mr-1">Template cepat:</span>
            {['Cuaca Cerah Sepanjang Hari', 'Hujan Siang Hari (Istirahat 2 Jam)', 'Kondisi Aman Terkendali', 'Hydrotest Sukses'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setCatatan((prev) => (prev ? `${prev}. ${tag}` : tag))}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 transition"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sticky Save Button Bar on Mobile & Desktop */}
      <div className="fixed md:static bottom-16 md:bottom-auto left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t md:border-0 border-slate-200 dark:border-slate-800 z-30 flex items-center justify-between gap-3 shadow-lg md:shadow-none">
        <div className="text-xs text-slate-500 hidden sm:block">
          {activeProgressCount} item pekerjaan &bull; {activeResourceCount} sumber daya terisi
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !projectId}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {submitting ? 'Menyimpan Laporan...' : (editReportId ? 'Perbarui Laporan Harian' : 'Simpan Laporan Harian')}
        </button>
      </div>
    </div>
  );
}

