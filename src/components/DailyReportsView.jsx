'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Trash2, 
  Edit3, 
  Printer, 
  X, 
  ChevronRight
} from 'lucide-react';
import { formatNumberIndo, formatDateIndo } from '@/lib/calculator';

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

  const progressByCategory = {};
  if (activeReportDetail?.progress_items) {
    for (const item of activeReportDetail.progress_items) {
      const cat = item.nama_kategori || 'Pekerjaan Utama';
      if (!progressByCategory[cat]) progressByCategory[cat] = [];
      progressByCategory[cat].push(item);
    }
  }

  const distinctWeeks = Array.from(new Set(reports.map((r) => r.minggu_ke))).sort((a, b) => a - b);

  return (
    <div className="space-y-3 pb-20 md:pb-6">
      {/* Header & Filter */}
      <div className="bg-white rounded-lg p-3.5 border border-zinc-200 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Daftar Laporan Harian</h2>
          <p className="text-xs text-zinc-400">Total {reports.length} laporan</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterMinggu}
            onChange={(e) => setFilterMinggu(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-zinc-700 focus:outline-none"
          >
            <option value="all">Semua Minggu</option>
            {distinctWeeks.map((w) => (
              <option key={w} value={w}>
                Minggu {w}
              </option>
            ))}
          </select>

          <button
            onClick={onAddNew}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition"
          >
            + Input Baru
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-100">
        {loading ? (
          <div className="p-6 text-center text-zinc-400 text-xs">Memuat laporan...</div>
        ) : reports.length > 0 ? (
          reports.map((r) => (
            <div
              key={r.id}
              onClick={() => openDetail(r.id)}
              className="p-3.5 hover:bg-zinc-50 transition cursor-pointer flex items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs sm:text-sm text-zinc-900">
                    {r.hari}, {formatDateIndo(r.tanggal)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 font-mono">
                    Minggu {r.minggu_ke}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  {r.total_job_progress || 0} pekerjaan &bull; {r.total_resource_usages || 0} sumber daya
                  {r.catatan && ` — "${r.catatan}"`}
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-zinc-400 text-xs">
            Belum ada laporan harian pada filter ini.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {activeReportDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
          <div className="relative w-full max-w-2xl bg-white rounded-lg border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="font-semibold text-zinc-900 text-sm">
                  Laporan Harian PDAM
                </h3>
                <div className="text-xs text-zinc-500">
                  {activeReportDetail.report.hari}, {formatDateIndo(activeReportDetail.report.tanggal)} (Minggu {activeReportDetail.report.minggu_ke})
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-600"
                  title="Cetak"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={closeDetail}
                  className="p-1.5 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Project Info */}
              <div className="bg-zinc-50 p-3 rounded border border-zinc-200 text-zinc-700 space-y-1">
                <div className="font-semibold text-zinc-900">{activeReportDetail.report.nama_pekerjaan}</div>
                <div className="flex flex-wrap gap-x-4 text-[11px] text-zinc-500">
                  <span>SPP: {activeReportDetail.report.no_spp || '-'}</span>
                  <span>Pelaksana: {activeReportDetail.report.pelaksana || '-'}</span>
                </div>
              </div>

              {/* 1. Tenaga Kerja */}
              {(() => {
                const manpower = (activeReportDetail.resource_usages || []).filter(ru => ru.kategori_utama === 'Tenaga Kerja');
                return (
                  <div className="space-y-1.5">
                    <div className="font-semibold text-xs text-zinc-800 uppercase tracking-wide">
                      1. Tenaga Kerja (Management & Lapangan)
                    </div>
                    {manpower.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {manpower.map((ru) => (
                          <div key={ru.id} className="p-2 rounded border border-zinc-200 bg-zinc-50 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-zinc-800">{ru.resource_nama}</div>
                              <div className="text-[10px] text-zinc-400">{ru.sub_kategori}</div>
                            </div>
                            <div className="font-mono font-semibold text-zinc-900">
                              {formatNumberIndo(ru.jumlah)} <span className="text-[10px] font-normal text-zinc-500">{ru.satuan}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 text-center text-zinc-400 text-xs border border-zinc-200 rounded">
                        Tidak ada data tenaga kerja.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 2. Bahan & Alat */}
              {(() => {
                const equip = (activeReportDetail.resource_usages || []).filter(ru => ru.kategori_utama !== 'Tenaga Kerja');
                return (
                  <div className="space-y-1.5">
                    <div className="font-semibold text-xs text-zinc-800 uppercase tracking-wide">
                      2. Bahan & Alat
                    </div>
                    {equip.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {equip.map((ru) => (
                          <div key={ru.id} className="p-2 rounded border border-zinc-200 bg-zinc-50 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-zinc-800">{ru.resource_nama}</div>
                              <div className="text-[10px] text-zinc-400">{ru.sub_kategori}</div>
                            </div>
                            <div className="font-mono font-semibold text-zinc-900">
                              {formatNumberIndo(ru.jumlah)} <span className="text-[10px] font-normal text-zinc-500">{ru.satuan}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 text-center text-zinc-400 text-xs border border-zinc-200 rounded">
                        Tidak ada data bahan & alat.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 3. Pekerjaan yang Dihasilkan */}
              <div className="space-y-1.5">
                <div className="font-semibold text-xs text-zinc-800 uppercase tracking-wide">
                  3. Pekerjaan yang Dihasilkan
                </div>
                {Object.keys(progressByCategory).length > 0 ? (
                  <div className="border border-zinc-200 rounded divide-y divide-zinc-200 overflow-hidden">
                    {Object.entries(progressByCategory).map(([catName, items]) => (
                      <div key={catName}>
                        <div className="bg-zinc-100 px-3 py-1 font-semibold text-[11px] text-zinc-700">
                          {catName}
                        </div>
                        <div className="divide-y divide-zinc-100">
                          {items.map((it) => (
                            <div key={it.id} className="p-2.5 flex items-center justify-between gap-2">
                              <div>
                                <div className="font-medium text-zinc-800">{it.nama_item}</div>
                                {it.parameter_values && Object.keys(it.parameter_values).length > 0 && (
                                  <div className="text-[10px] text-zinc-400 font-mono">
                                    {it.formula_expression}: {Object.entries(it.parameter_values).map(([k, v]) => `${k}=${v}`).join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="font-mono font-semibold text-zinc-900 shrink-0">
                                {formatNumberIndo(it.volume_harian)} <span className="font-normal text-zinc-500">{it.satuan}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 text-center text-zinc-400 text-xs border border-zinc-200 rounded">
                    Tidak ada catatan volume hari ini.
                  </div>
                )}
              </div>

              {/* 4. Catatan Lapangan & Cuaca */}
              {activeReportDetail.report.catatan && (
                <div className="space-y-1">
                  <div className="font-semibold text-xs text-zinc-800 uppercase tracking-wide">Catatan Lapangan & Cuaca</div>
                  <div className="p-2.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-700 text-xs italic">
                    &quot;{activeReportDetail.report.catatan}&quot;
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs">
              <div>
                {deleteConfirmId === activeReportDetail.report.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-600 font-medium">Hapus laporan?</span>
                    <button
                      onClick={() => handleDelete(activeReportDetail.report.id)}
                      className="px-2 py-0.5 bg-red-600 text-white rounded text-[11px]"
                    >
                      Ya
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-0.5 border border-zinc-300 rounded text-[11px]"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(activeReportDetail.report.id)}
                    className="text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
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
                  className="px-3 py-1.5 border border-zinc-300 rounded hover:bg-zinc-100 flex items-center gap-1 font-medium"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={closeDetail}
                  className="px-3 py-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800 font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
