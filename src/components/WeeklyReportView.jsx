'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Printer, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Users, 
  Wrench, 
  Calendar, 
  Sparkles,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { formatNumberIndo } from '@/lib/calculator';

export default function WeeklyReportView({ projectId }) {
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeTab, setActiveTab] = useState('progress'); // 'progress', 'resources'
  const [expandedItem, setExpandedItem] = useState(null);

  const fetchWeeklyData = async (week) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/weekly-reports?project_id=${projectId}&minggu_ke=${week}`);
      const data = await res.json();
      setWeeklyData(data);
      if (data.minggu_ke) {
        setSelectedWeek(data.minggu_ke);
      }
    } catch (err) {
      console.error('Error fetching weekly data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData(selectedWeek);
  }, [projectId, selectedWeek]);

  // Group job items by category
  const categoriesMap = {};
  if (weeklyData?.categories && weeklyData?.job_items_summary) {
    for (const cat of weeklyData.categories) {
      categoriesMap[cat.id] = {
        name: cat.nama_kategori,
        items: weeklyData.job_items_summary.filter((it) => it.category_id === cat.id)
      };
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!weeklyData || !weeklyData.job_items_summary) return;

    const headers = ['No', 'Kategori', 'Item Pekerjaan', 'Satuan', 'Volume Lalu', 'Volume Minggu Ini', 'Komulatif'];
    const rows = [];

    let counter = 1;
    for (const [catId, cat] of Object.entries(categoriesMap)) {
      for (const it of cat.items) {
        rows.push([
          counter++,
          `"${cat.name.replace(/"/g, '""')}"`,
          `"${it.nama_item.replace(/"/g, '""')}"`,
          `"${it.satuan}"`,
          it.prev_volume || 0,
          it.current_week_volume || 0,
          it.cumulative_volume || 0
        ]);
      }
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Mingguan_Ke_${selectedWeek}_${weeklyData?.project?.nama_pekerjaan || 'PDAM'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6 print:p-0 print:m-0 print:space-y-2">
      {/* Top Controls (Hidden during print) */}
      <div className="print:hidden bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Laporan Mingguan Proyek PDAM
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rekapitulasi volume pekerjaan dan sumber daya mingguan
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Week Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-400 font-medium">Minggu:</span>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value, 10))}
              className="bg-transparent font-bold text-blue-600 dark:text-blue-400 focus:outline-none cursor-pointer"
            >
              {(weeklyData?.available_weeks || [1, 2, 3, 4, 5, 6, 7, 8]).map((w) => (
                <option key={w} value={w}>
                  Minggu ke-{w}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs (Hidden during print) */}
      <div className="print:hidden flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
            activeTab === 'progress'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Rekap Volume Fisik</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
            activeTab === 'resources'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Rekap Tenaga & Alat</span>
        </button>
      </div>

      {/* OFFICIAL REPORT HEADER (Visible on screen and in print) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs print:shadow-none print:border-b-2 print:border-black print:p-0 print:mb-4">
        <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800 print:border-black">
          <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-900 dark:text-white print:text-black">
            LAPORAN MINGGUAN KEMAJUAN PEKERJAAN
          </h1>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 print:text-black mt-0.5">
            PROYEK PENGEMBANGAN JARINGAN DISTRIBUSI PDAM
          </p>
        </div>

        {/* Project Meta Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs border-b border-slate-100 dark:border-slate-800 print:border-slate-300">
          <div>
            <span className="text-slate-400 print:text-slate-600 block text-[10px] uppercase font-bold">Pekerjaan</span>
            <span className="font-semibold text-slate-900 dark:text-white print:text-black line-clamp-2">
              {weeklyData?.project?.nama_pekerjaan || '-'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block text-[10px] uppercase font-bold">No. SPP / Kontrak</span>
            <span className="font-semibold text-slate-900 dark:text-white print:text-black">
              {weeklyData?.project?.no_spp || '-'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block text-[10px] uppercase font-bold">Pelaksana</span>
            <span className="font-semibold text-slate-900 dark:text-white print:text-black">
              {weeklyData?.project?.pelaksana || '-'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block text-[10px] uppercase font-bold">Minggu Ke / Hari Tercatat</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 print:text-black">
              Minggu Ke-{selectedWeek} ({weeklyData?.daily_reports?.length || 0} Hari)
            </span>
          </div>
        </div>

        {/* List of recorded days in this week */}
        {weeklyData?.daily_reports && weeklyData.daily_reports.length > 0 && (
          <div className="py-2.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 print:text-slate-700">
            <span className="font-semibold text-slate-700 dark:text-slate-300 print:text-black">Hari Kerja Tercatat:</span>
            {weeklyData.daily_reports.map((dr) => (
              <span key={dr.id} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">
                {dr.hari} ({dr.tanggal})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: REKAPITULASI PROGRES FISIK (Print & Mobile Friendly) */}
      {(activeTab === 'progress' || typeof window === 'undefined') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden print:border-none print:shadow-none">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Tabel Progres Fisik Pekerjaan
            </div>
            <div className="text-[11px] text-slate-400">
              Satuan & Akumulasi Volume
            </div>
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 print:bg-slate-200 print:text-black border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-3 font-bold w-12 text-center">No</th>
                  <th className="py-2.5 px-3 font-bold">Uraian Item Pekerjaan</th>
                  <th className="py-2.5 px-2 font-bold w-16 text-center">Sat</th>
                  <th className="py-2.5 px-3 font-bold text-right">Lalu</th>
                  <th className="py-2.5 px-3 font-bold text-right text-blue-600 dark:text-blue-400 print:text-black">
                    Minggu Ini
                  </th>
                  <th className="py-2.5 px-3 font-bold text-right text-emerald-600 dark:text-emerald-400 print:text-black">
                    Komulatif
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.entries(categoriesMap).map(([catId, cat]) => (
                  <React.Fragment key={catId}>
                    {/* Category Row */}
                    <tr className="bg-slate-50/80 dark:bg-slate-800/40 print:bg-slate-100 font-bold text-slate-800 dark:text-slate-200 print:text-black">
                      <td colSpan={6} className="py-2 px-3 text-[11px] tracking-wide uppercase">
                        {cat.name}
                      </td>
                    </tr>

                    {/* Job Items Rows */}
                    {cat.items.map((it, idx) => {
                      const isExpanded = expandedItem === it.id;
                      const hasDays = it.daily_breakdown && Object.keys(it.daily_breakdown).length > 0;

                      return (
                        <React.Fragment key={it.id}>
                          <tr
                            onClick={() => setExpandedItem(isExpanded ? null : it.id)}
                            className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition cursor-pointer"
                          >
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 print:text-black">
                              <div className="flex items-center gap-1.5">
                                <span>{it.nama_item}</span>
                                {hasDays && (
                                  <span className="print:hidden text-[10px] text-blue-500 font-normal">
                                    {isExpanded ? '▲' : '▼ rincian'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 print:text-black font-mono">
                              {it.satuan}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400 print:text-black">
                              {formatNumberIndo(it.prev_volume)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400 print:text-black">
                              {formatNumberIndo(it.current_week_volume)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 print:text-black">
                              {formatNumberIndo(it.cumulative_volume)}
                            </td>
                          </tr>

                          {/* Day-by-Day Breakdown row if expanded */}
                          {isExpanded && hasDays && (
                            <tr className="bg-blue-50/30 dark:bg-blue-950/30 print:hidden">
                              <td colSpan={6} className="p-3 pl-8">
                                <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                                  Rincian Per Hari (Minggu Ke-{selectedWeek}):
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {weeklyData.daily_reports.map((dr) => {
                                    const vol = it.daily_breakdown[dr.id] || 0;
                                    return (
                                      <div
                                        key={dr.id}
                                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs"
                                      >
                                        <span className="text-slate-500">{dr.hari}:</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                                          {formatNumberIndo(vol)} {it.satuan}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REKAPITULASI SUMBER DAYA (TENAGA KERJA, ALAT & BAHAN) */}
      {(activeTab === 'resources' || typeof window === 'undefined') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden print:border-none print:shadow-none print:mt-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              Tabel Rekapitulasi Tenaga Kerja, Alat & Bahan
            </div>
            <div className="text-[11px] text-slate-400">
              Total Penggunaan Periode Minggu Ini
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 print:bg-slate-200 print:text-black border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-3 font-bold w-12 text-center">No</th>
                  <th className="py-2.5 px-3 font-bold">Nama Sumber Daya</th>
                  <th className="py-2.5 px-2 font-bold">Kategori</th>
                  <th className="py-2.5 px-2 font-bold w-16 text-center">Sat</th>
                  <th className="py-2.5 px-3 font-bold text-right">Lalu</th>
                  <th className="py-2.5 px-3 font-bold text-right text-blue-600 dark:text-blue-400 print:text-black">
                    Minggu Ini
                  </th>
                  <th className="py-2.5 px-3 font-bold text-right text-emerald-600 dark:text-emerald-400 print:text-black">
                    Komulatif
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {weeklyData?.resources_summary && weeklyData.resources_summary.length > 0 ? (
                  weeklyData.resources_summary.map((res, idx) => (
                    <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white print:text-black">
                        {res.nama}
                      </td>
                      <td className="py-2.5 px-2 text-slate-500 text-[11px]">
                        {res.kategori_utama} ({res.sub_kategori})
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-500">
                        {res.satuan}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatNumberIndo(res.prev_qty)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                        {formatNumberIndo(res.current_week_qty)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatNumberIndo(res.cumulative_qty)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 text-xs">
                      Belum ada data sumber daya pada minggu ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OFFICIAL SIGNATURES BLOCK (FOR PRINT & FORMAL REPORT) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 print:border-none print:p-0 print:mt-8">
        <div className="text-xs text-slate-500 mb-6 text-center">
          Laporan ini disusun dengan sebenar-benarnya berdasarkan catatan harian fisik lapangan.
        </div>
        <div className="grid grid-cols-2 text-center text-xs">
          <div className="space-y-16">
            <div>
              <p className="text-slate-500">Diperiksa / Disetujui Oleh:</p>
              <p className="font-bold text-slate-900 dark:text-white print:text-black mt-0.5">
                PENGAWAS LAPANGAN PDAM
              </p>
            </div>
            <div className="font-bold underline text-slate-900 dark:text-white print:text-black">
              ( .................................................. )
            </div>
          </div>

          <div className="space-y-16">
            <div>
              <p className="text-slate-500">Dibuat Oleh:</p>
              <p className="font-bold text-slate-900 dark:text-white print:text-black mt-0.5">
                PELAKSANA / KONTRAKTOR
              </p>
            </div>
            <div className="font-bold underline text-slate-900 dark:text-white print:text-black">
              ( .................................................. )
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

