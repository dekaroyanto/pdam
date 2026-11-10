'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Edit3, 
  Printer, 
  X, 
  Layers, 
  Users, 
  FileText, 
  ChevronRight, 
  Droplets,
  HardHat,
  Clock
} from 'lucide-react';
import { formatNumberIndo } from '@/lib/calculator';

export default function DailyReportsView({
  projectId,
  onEditReport,
  onAddNew,
  selectedReportId,
  onClearSelectedReport
}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMinggu, setFilterMinggu] = useState('all');
  const [activeReportDetail, setActiveReportDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchReports = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      let url = `/api/daily-reports?project_id=${projectId}`;
      if (filterMinggu !== 'all') {
        url += `&minggu_ke=${filterMinggu}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [projectId, filterMinggu]);

  // Open detail if selectedReportId is provided
  useEffect(() => {
    if (selectedReportId) {
      openDetail(selectedReportId);
    }
  }, [selectedReportId]);

  const openDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/daily-reports/${id}`);
      const data = await res.json();
      setActiveReportDetail(data);
    } catch (err) {
      console.error('Error fetching report detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setActiveReportDetail(null);
    if (onClearSelectedReport) onClearSelectedReport();
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/daily-reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        if (activeReportDetail?.report?.id === id) {
          closeDetail();
        }
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  // Group progress items by category for detail view
  const progressByCategory = {};
  if (activeReportDetail?.progress_items) {
    for (const item of activeReportDetail.progress_items) {
      const cat = item.nama_kategori || 'Pekerjaan Utama';
      if (!progressByCategory[cat]) progressByCategory[cat] = [];
      progressByCategory[cat].push(item);
    }
  }

  // Get distinct weeks from current reports
  const distinctWeeks = Array.from(new Set(reports.map((r) => r.minggu_ke))).sort((a, b) => a - b);

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header & Filter */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Daftar Laporan Harian
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total {reports.length} laporan harian tercatat
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Week Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterMinggu}
              onChange={(e) => setFilterMinggu(e.target.value)}
              className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">Semua Minggu</option>
              {distinctWeeks.map((w) => (
                <option key={w} value={w}>
                  Minggu ke-{w}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onAddNew}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition"
          >
            + Input Baru
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border">
            Memuat daftar laporan...
          </div>
        ) : reports.length > 0 ? (
          reports.map((r) => (
            <div
              key={r.id}
              onClick={() => openDetail(r.id)}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-blue-500 hover:shadow-md transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {r.hari}, {r.tanggal}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    Minggu ke-{r.minggu_ke}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    {r.total_job_progress || 0} Pekerjaan
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    {r.total_resource_usages || 0} Sumber Daya
                  </span>
                </div>

                {r.catatan && (
                  <p className="text-[11px] text-slate-400 italic line-clamp-1">
                    &quot;{r.catatan}&quot;
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-600 transition">
                <span className="text-xs font-semibold hidden sm:inline">Lihat Detail</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border">
            <Calendar className="w-8 h-8 mx-auto opacity-40 mb-2" />
            <p className="text-xs">Belum ada laporan harian pada filter ini</p>
          </div>
        )}
      </div>

      {/* DETAIL MODAL / SHEET */}
      {activeReportDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Laporan Harian PDAM
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {activeReportDetail.report.hari}, {activeReportDetail.report.tanggal} &bull; Minggu ke-{activeReportDetail.report.minggu_ke}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  title="Cetak Laporan Harian"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={closeDetail}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body (also formatted for print) */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-800 dark:text-slate-200 print:text-black">
              {/* Project Meta Info */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {activeReportDetail.report.nama_pekerjaan}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                  <div>No. SPP: <span className="font-semibold text-slate-800 dark:text-slate-200">{activeReportDetail.report.no_spp || '-'}</span></div>
                  <div>Pelaksana: <span className="font-semibold text-slate-800 dark:text-slate-200">{activeReportDetail.report.pelaksana || '-'}</span></div>
                  <div>Waktu: <span className="font-semibold text-slate-800 dark:text-slate-200">{activeReportDetail.report.waktu_pelaksanaan ? `${activeReportDetail.report.waktu_pelaksanaan} Hari` : '-'}</span></div>
                </div>
              </div>

              {/* SECTION: PROGRES FISIK */}
              <div className="space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Rincian Progres Fisik Harian
                </div>

                {Object.keys(progressByCategory).length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {Object.entries(progressByCategory).map(([catName, items]) => (
                      <div key={catName}>
                        <div className="bg-slate-100/80 dark:bg-slate-800 px-3 py-1.5 font-bold text-[11px] text-slate-700 dark:text-slate-300">
                          {catName}
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {items.map((it) => (
                            <div key={it.id} className="p-3 flex items-center justify-between gap-3">
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-900 dark:text-white text-xs">
                                  {it.nama_item}
                                </div>
                                {it.parameter_values && Object.keys(it.parameter_values).length > 0 && (
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    Hitungan ({it.formula_expression || 'dinamis'}):{' '}
                                    {Object.entries(it.parameter_values).map(([k, v]) => `${k}=${v}`).join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm shrink-0">
                                {formatNumberIndo(it.volume_harian)} <span className="text-[11px] font-normal text-slate-500">{it.satuan}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-slate-400 text-xs">
                    Tidak ada input volume fisik pada hari ini.
                  </div>
                )}
              </div>

              {/* SECTION: PENGGUNAAN SUMBER DAYA */}
              <div className="space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Rincian Penggunaan Sumber Daya
                </div>

                {activeReportDetail.resource_usages && activeReportDetail.resource_usages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeReportDetail.resource_usages.map((ru) => (
                      <div
                        key={ru.id}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {ru.resource_nama}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ru.kategori_utama} &bull; {ru.sub_kategori}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatNumberIndo(ru.jumlah)} <span className="text-[10px] font-normal text-slate-500">{ru.satuan}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-slate-400 text-xs">
                    Tidak ada sumber daya yang dicatat pada hari ini.
                  </div>
                )}
              </div>

              {/* SECTION: CATATAN LAPANGAN */}
              {activeReportDetail.report.catatan && (
                <div className="space-y-1.5">
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Catatan Lapangan & Cuaca
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/60 text-slate-800 dark:text-slate-200 italic leading-relaxed text-xs">
                    &quot;{activeReportDetail.report.catatan}&quot;
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                {deleteConfirmId === activeReportDetail.report.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 font-semibold">Yakin hapus?</span>
                    <button
                      onClick={() => handleDelete(activeReportDetail.report.id)}
                      className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-1 text-xs text-slate-500"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(activeReportDetail.report.id)}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition flex items-center gap-1.5 text-xs font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Hapus Laporan</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const id = activeReportDetail.report.id;
                    closeDetail();
                    onEditReport(id);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Laporan
                </button>
                <button
                  onClick={closeDetail}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

