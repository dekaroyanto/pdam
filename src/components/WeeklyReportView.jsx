'use client';

import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  FileSpreadsheet
} from 'lucide-react';
import { formatNumberIndo, formatDateIndo } from '@/lib/calculator';

export default function WeeklyReportView({ projectId }) {
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeTab, setActiveTab] = useState('progress');
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
    <div className="space-y-3 pb-20 md:pb-6 print:p-0 print:space-y-2">
      {/* Top Controls (Hidden during print) */}
      <div className="no-print bg-white rounded-lg p-3.5 border border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Laporan Mingguan</h2>
          <p className="text-xs text-zinc-400">Rekapitulasi volume pekerjaan & sumber daya</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs">
            <span className="text-zinc-500 font-medium">Minggu:</span>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value, 10))}
              className="bg-transparent font-semibold text-zinc-900 focus:outline-none cursor-pointer"
            >
              {(weeklyData?.available_weeks || [1, 2, 3, 4, 5, 6, 7, 8]).map((w) => (
                <option key={w} value={w}>
                  Minggu ke-{w}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs (Hidden during print) */}
      <div className="no-print flex border-b border-zinc-200 text-xs bg-white rounded-t-lg">
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'progress'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Volume Pekerjaan
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'resources'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Tenaga Kerja & Alat
        </button>
      </div>

      {/* Report Header Block (Visible on screen and in print) */}
      <div className="bg-white p-4 rounded-lg border border-zinc-200 print:border-none print:p-0">
        <div className="text-center pb-3 border-b border-zinc-200 print:border-black">
          <h1 className="text-base font-bold uppercase tracking-wide text-zinc-900 print:text-black">
            LAPORAN MINGGUAN KEMAJUAN PEKERJAAN
          </h1>
          <p className="text-xs text-zinc-500 print:text-black mt-0.5">
            PROYEK PENGEMBANGAN JARINGAN DISTRIBUSI PDAM
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 text-xs border-b border-zinc-100 print:border-zinc-300">
          <div>
            <span className="text-zinc-400 block text-[10px] uppercase">Pekerjaan</span>
            <span className="font-medium text-zinc-900 print:text-black">{weeklyData?.project?.nama_pekerjaan || '-'}</span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[10px] uppercase">No. SPP / Kontrak</span>
            <span className="font-medium text-zinc-900 print:text-black">{weeklyData?.project?.no_spp || '-'}</span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[10px] uppercase">Pelaksana</span>
            <span className="font-medium text-zinc-900 print:text-black">{weeklyData?.project?.pelaksana || '-'}</span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[10px] uppercase">Periode</span>
            <span className="font-semibold text-zinc-900 print:text-black">
              Minggu Ke-{selectedWeek} ({weeklyData?.daily_reports?.length || 0} hari kerja)
            </span>
          </div>
        </div>

        {weeklyData?.daily_reports && weeklyData.daily_reports.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-1.5 text-xs text-zinc-500">
            <span className="font-medium text-zinc-700">Hari Kerja:</span>
            {weeklyData.daily_reports.map((dr) => (
              <span key={dr.id} className="font-mono text-[11px] bg-zinc-50 border border-zinc-200 px-1.5 py-0.2 rounded">
                {dr.hari} ({formatDateIndo(dr.tanggal)})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Progres Fisik Table */}
      {activeTab === 'progress' && (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden print:border-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 print:bg-zinc-100 print:text-black">
                  <th className="py-2 px-3 font-semibold w-10 text-center">No</th>
                  <th className="py-2 px-3 font-semibold">Uraian Item Pekerjaan</th>
                  <th className="py-2 px-2 font-semibold w-14 text-center">Sat</th>
                  <th className="py-2 px-3 font-semibold text-right">Lalu</th>
                  <th className="py-2 px-3 font-semibold text-right text-blue-600 print:text-black">Minggu Ini</th>
                  <th className="py-2 px-3 font-semibold text-right text-zinc-900 print:text-black">Komulatif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 print:divide-zinc-300">
                {Object.entries(categoriesMap).map(([catId, cat]) => (
                  <React.Fragment key={catId}>
                    <tr className="bg-zinc-100/70 font-semibold text-zinc-800 print:bg-zinc-200 print:text-black">
                      <td colSpan={6} className="py-1.5 px-3 text-[11px] uppercase tracking-wide">
                        {cat.name}
                      </td>
                    </tr>

                    {cat.items.map((it, idx) => {
                      const isExpanded = expandedItem === it.id;
                      const hasDays = it.daily_breakdown && Object.keys(it.daily_breakdown).length > 0;

                      return (
                        <React.Fragment key={it.id}>
                          <tr
                            onClick={() => setExpandedItem(isExpanded ? null : it.id)}
                            className="hover:bg-zinc-50 cursor-pointer"
                          >
                            <td className="py-2 px-3 text-center text-zinc-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-medium text-zinc-900 print:text-black">
                              <div className="flex items-center gap-1.5">
                                <span>{it.nama_item}</span>
                                {hasDays && (
                                  <span className="no-print text-[10px] text-zinc-400 hover:text-zinc-600">
                                    {isExpanded ? '▲' : '▼'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center text-zinc-500 font-mono">
                              {it.satuan}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-zinc-600">
                              {formatNumberIndo(it.prev_volume)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-blue-600 print:text-black">
                              {formatNumberIndo(it.current_week_volume)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-zinc-900 print:text-black">
                              {formatNumberIndo(it.cumulative_volume)}
                            </td>
                          </tr>

                          {isExpanded && hasDays && (
                            <tr className="no-print bg-zinc-50">
                              <td colSpan={6} className="p-2.5 pl-8">
                                <div className="text-[11px] text-zinc-500 mb-1">Rincian Per Hari:</div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                  {weeklyData.daily_reports.map((dr) => {
                                    const vol = it.daily_breakdown[dr.id] || 0;
                                    return (
                                      <div key={dr.id} className="p-1 rounded bg-white border border-zinc-200 flex justify-between text-xs">
                                        <span className="text-zinc-500">{dr.hari}:</span>
                                        <span className="font-mono font-semibold text-zinc-900">
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

      {/* Tab 2: Sumber Daya Table */}
      {activeTab === 'resources' && (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden print:border-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 print:bg-zinc-100 print:text-black">
                  <th className="py-2 px-3 font-semibold w-10 text-center">No</th>
                  <th className="py-2 px-3 font-semibold">Nama Sumber Daya</th>
                  <th className="py-2 px-2 font-semibold">Kategori</th>
                  <th className="py-2 px-2 font-semibold w-14 text-center">Sat</th>
                  <th className="py-2 px-3 font-semibold text-right">Lalu</th>
                  <th className="py-2 px-3 font-semibold text-right text-blue-600 print:text-black">Minggu Ini</th>
                  <th className="py-2 px-3 font-semibold text-right text-zinc-900 print:text-black">Komulatif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 print:divide-zinc-300">
                {weeklyData?.resources_summary && weeklyData.resources_summary.length > 0 ? (
                  weeklyData.resources_summary.map((res, idx) => (
                    <tr key={res.id} className="hover:bg-zinc-50">
                      <td className="py-2 px-3 text-center text-zinc-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-medium text-zinc-900 print:text-black">
                        {res.nama}
                      </td>
                      <td className="py-2 px-2 text-zinc-500 text-[11px]">
                        {res.kategori_utama} ({res.sub_kategori})
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-zinc-500">
                        {res.satuan}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-zinc-600">
                        {formatNumberIndo(res.prev_qty)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-blue-600 print:text-black">
                        {formatNumberIndo(res.current_week_qty)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-zinc-900 print:text-black">
                        {formatNumberIndo(res.cumulative_qty)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-zinc-400 text-xs">
                      Belum ada catatan sumber daya pada minggu ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Signatures Block */}
      <div className="bg-white p-4 rounded-lg border border-zinc-200 print:border-none print:p-0 print:mt-6">
        <div className="grid grid-cols-3 text-center text-xs gap-3">
          <div className="space-y-12">
            <div>
              <p className="text-zinc-500">Dibuat Oleh:</p>
              <p className="font-semibold text-zinc-900 print:text-black mt-0.5">PELAKSANA / KONTRAKTOR</p>
            </div>
            <div className="font-medium text-zinc-900 print:text-black">
              <span className="underline">{weeklyData?.project?.pelaksana || '( .................................................. )'}</span>
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <p className="text-zinc-500">Diperiksa Oleh:</p>
              <p className="font-semibold text-zinc-900 print:text-black mt-0.5">PENGAWAS BAGIAN</p>
            </div>
            <div className="font-medium text-zinc-900 print:text-black">
              <span className="underline">{weeklyData?.project?.pengawas_bagian || '( .................................................. )'}</span>
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <p className="text-zinc-500">Disetujui Oleh:</p>
              <p className="font-semibold text-zinc-900 print:text-black mt-0.5">KEPALA SEKSI BAGIAN</p>
            </div>
            <div className="font-medium text-zinc-900 print:text-black">
              <span className="underline">{weeklyData?.project?.kepala_seksi_bagian || '( .................................................. )'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
