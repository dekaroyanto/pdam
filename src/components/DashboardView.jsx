'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  FileText,
  Clock,
  Layers,
  Users
} from 'lucide-react';
import { formatNumberIndo, formatDateIndo, cleanDateStr } from '@/lib/calculator';

export default function DashboardView({
  project,
  projects,
  dailyReports = [],
  onNavigate,
  onSeedData,
  isSeeding,
  onSelectReport
}) {
  // State for which week cards are expanded in the dashboard
  const [expandedWeeks, setExpandedWeeks] = useState(() => {
    // Expand the latest week by default if available
    if (dailyReports.length > 0) {
      return { [dailyReports[0].minggu_ke]: true };
    }
    return {};
  });

  const toggleWeek = (weekNum) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum]
    }));
  };

  // Group daily reports by minggu_ke
  const weekGroupsMap = {};
  dailyReports.forEach((report) => {
    const w = report.minggu_ke;
    if (!weekGroupsMap[w]) {
      weekGroupsMap[w] = {
        mingguKe: w,
        reports: [],
        totalItems: 0,
        totalResources: 0,
        dates: []
      };
    }
    weekGroupsMap[w].reports.push(report);
    weekGroupsMap[w].totalItems += (report.total_job_progress || 0);
    weekGroupsMap[w].totalResources += (report.total_resource_usages || 0);
    weekGroupsMap[w].dates.push(report.tanggal);
  });

  // Convert to sorted array of weeks (latest week first)
  const weekList = Object.values(weekGroupsMap).sort((a, b) => b.mingguKe - a.mingguKe);

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Project Summary Banner */}
      {project ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Proyek Aktif</span>
              <h2 className="text-base font-semibold text-zinc-900 mt-0.5">
                {project.nama_pekerjaan}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {project.no_spp && (
                <span className="text-xs text-zinc-500 font-mono bg-zinc-50 border border-zinc-200 px-2 py-1 rounded">
                  SPP: {project.no_spp}
                </span>
              )}
              <button
                onClick={() => onNavigate('input')}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Laporan</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 text-xs">
            <div>
              <span className="text-zinc-400 block text-[11px]">Pelaksana</span>
              <span className="font-medium text-zinc-800">{project.pelaksana || '-'}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">Pengawas Bagian</span>
              <span className="font-medium text-zinc-800">{project.pengawas_bagian || '-'}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">Kepala Seksi</span>
              <span className="font-medium text-zinc-800">{project.kepala_seksi_bagian || '-'}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">Waktu Kontrak</span>
              <span className="font-medium text-zinc-800">
                {project.waktu_pelaksanaan ? `${project.waktu_pelaksanaan} Hari Kalender` : '-'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">Total Laporan Masuk</span>
              <span className="font-medium text-zinc-800">{dailyReports.length} Hari</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">Jumlah Minggu Berjalan</span>
              <span className="font-medium text-zinc-800">{weekList.length} Minggu</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border border-zinc-200 text-center space-y-3">
          <h3 className="font-semibold text-zinc-900 text-sm">Belum Ada Proyek Terpilih</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Pilih proyek di dropdown atas atau isi data master standar PDAM.
          </p>
          <button
            onClick={onSeedData}
            disabled={isSeeding}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-50"
          >
            {isSeeding ? 'Membuat Data...' : 'Isi Data Master PDAM Standar'}
          </button>
        </div>
      )}

      {/* Section Title */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Daftar Laporan Per Minggu
          </h3>
          <p className="text-xs text-zinc-400">
            Klik card minggu untuk melihat daftar laporan harian di minggu tersebut
          </p>
        </div>

        {weekList.length > 0 && (
          <button
            onClick={() => onNavigate('weekly')}
            className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
          >
            <span>Rekap Semua Minggu</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Week Cards List */}
      <div className="space-y-3">
        {weekList.length > 0 ? (
          weekList.map((week) => {
            const isExpanded = expandedWeeks[week.mingguKe];
            const cleanedDates = week.dates.map(cleanDateStr).filter(Boolean).sort();
            const minDate = cleanedDates[0];
            const maxDate = cleanedDates[cleanedDates.length - 1];
            const dateRangeStr = cleanedDates.length === 0 
              ? '-' 
              : minDate === maxDate 
                ? formatDateIndo(minDate) 
                : `${formatDateIndo(minDate)} s.d. ${formatDateIndo(maxDate)}`;

            return (
              <div
                key={week.mingguKe}
                className="bg-white rounded-lg border border-zinc-200 overflow-hidden transition"
              >
                {/* Week Card Header (Clickable) */}
                <div
                  onClick={() => toggleWeek(week.mingguKe)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 select-none border-b border-transparent transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-900">
                        Laporan Minggu Ke-{week.mingguKe}
                      </span>
                      <span className="text-[11px] px-2 py-0.2 rounded bg-zinc-100 text-zinc-700 font-medium">
                        {week.reports.length} Laporan Harian
                      </span>
                    </div>

                    <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Periode: <strong className="text-zinc-700 font-mono">{dateRangeStr}</strong></span>
                      <span>&bull;</span>
                      <span>{week.totalItems} catatan fisik</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-400">
                    <span className="text-xs text-zinc-500 hidden sm:inline">
                      {isExpanded ? 'Tutup' : 'Buka List Harian'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-zinc-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-600" />
                    )}
                  </div>
                </div>

                {/* Expanded Daily Reports List */}
                {isExpanded && (
                  <div className="border-t border-zinc-200 bg-zinc-50/50">
                    <div className="divide-y divide-zinc-200">
                      {week.reports.map((report) => (
                        <div
                          key={report.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectReport(report.id);
                          }}
                          className="p-3 hover:bg-white transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-900">
                                {report.hari}, {formatDateIndo(report.tanggal)}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                              <span>{report.total_job_progress || 0} item pekerjaan</span>
                              <span>&bull;</span>
                              <span>{report.total_resource_usages || 0} sumber daya</span>
                            </div>
                            {report.catatan && (
                              <p className="text-[11px] text-zinc-400 italic line-clamp-1">
                                &quot;{report.catatan}&quot;
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-blue-600 font-medium shrink-0">
                            <span>Buka Laporan</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer link to jump to Weekly Report tab for this week */}
                    <div className="p-2.5 bg-zinc-50 border-t border-zinc-200 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('weekly');
                        }}
                        className="text-xs text-zinc-600 hover:text-zinc-900 font-medium inline-flex items-center gap-1"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Lihat Rekapitulasi Lengkap Minggu Ke-{week.mingguKe}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white p-8 rounded-lg border border-zinc-200 text-center space-y-3">
            <FileText className="w-8 h-8 text-zinc-300 mx-auto" />
            <div>
              <h4 className="font-medium text-zinc-900 text-sm">Belum Ada Laporan</h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                Proyek ini belum memiliki laporan harian yang dicatat.
              </p>
            </div>
            <button
              onClick={() => onNavigate('input')}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Laporan Harian Pertama</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
