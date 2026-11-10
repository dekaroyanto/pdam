'use client';

import React from 'react';
import { 
  Building2, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Users, 
  Wrench, 
  Clock, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  MapPin,
  CalendarCheck
} from 'lucide-react';
import { formatNumberIndo } from '@/lib/calculator';

export default function DashboardView({
  project,
  projects,
  dailyReports = [],
  onNavigate,
  onSeedData,
  isSeeding,
  onSelectReport
}) {
  const latestReport = dailyReports[0];

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Project Card */}
      {project ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 shadow-lg border border-blue-900/30">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/20">
                <Building2 className="w-3.5 h-3.5" />
                Proyek Aktif
              </span>
              <span className="text-xs text-blue-200/70 font-mono">
                SPP: {project.no_spp || '-'}
              </span>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                {project.nama_pekerjaan}
              </h2>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <span>Pelaksana: <strong>{project.pelaksana || 'PDAM Tirta'}</strong></span>
                {project.waktu_pelaksanaan && (
                  <span>&bull; Waktu: {project.waktu_pelaksanaan} Hari Kalender</span>
                )}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
              <div className="bg-white/5 p-2 rounded-xl">
                <div className="text-[10px] text-blue-200/70 uppercase">Total Lap.</div>
                <div className="text-base font-bold text-white mt-0.5">{dailyReports.length}</div>
              </div>
              <div className="bg-white/5 p-2 rounded-xl">
                <div className="text-[10px] text-blue-200/70 uppercase">Minggu Terakhir</div>
                <div className="text-base font-bold text-cyan-300 mt-0.5">
                  Minggu {latestReport ? latestReport.minggu_ke : '-'}
                </div>
              </div>
              <div className="bg-white/5 p-2 rounded-xl">
                <div className="text-[10px] text-blue-200/70 uppercase">Laporan Terakhir</div>
                <div className="text-xs font-semibold text-emerald-300 mt-1 truncate">
                  {latestReport ? latestReport.tanggal : 'Belum Ada'}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Belum Ada Proyek PDAM</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Database Anda sudah terhubung. Ingin langsung mengisi proyek template dan master data standar PDAM (pekerjaan galian, pipa HDPE, valve, tenaga kerja, dan alat)?
            </p>
          </div>
          <button
            onClick={onSeedData}
            disabled={isSeeding}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md active:scale-95 transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isSeeding ? 'Membuat Data Awal...' : 'Isi Data Master PDAM Otomatis'}
          </button>
        </div>
      )}

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('input')}
          className="flex flex-col items-start p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-blue-500 hover:shadow-md transition text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <div className="mt-3 font-semibold text-slate-900 dark:text-white text-sm">
            Input Laporan Harian
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Catat progres fisik & sumber daya hari ini
          </div>
        </button>

        <button
          onClick={() => onNavigate('weekly')}
          className="flex flex-col items-start p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-cyan-500 hover:shadow-md transition text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="mt-3 font-semibold text-slate-900 dark:text-white text-sm">
            Rekap Mingguan
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Lihat akumulasi mingguan & cetak PDF
          </div>
        </button>
      </div>

      {/* Recent Daily Reports */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Laporan Harian Terbaru
            </h3>
          </div>
          <button
            onClick={() => onNavigate('daily')}
            className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
          >
            Lihat Semua
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {dailyReports.length > 0 ? (
            dailyReports.slice(0, 5).map((r) => (
              <div
                key={r.id}
                onClick={() => onSelectReport(r.id)}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                      {r.hari}, {r.tanggal}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      Minggu ke-{r.minggu_ke}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                    <span>{r.total_job_progress || 0} item pekerjaan</span>
                    <span>&bull;</span>
                    <span>{r.total_resource_usages || 0} sumber daya</span>
                  </div>
                  {r.catatan && (
                    <p className="text-[11px] text-slate-400 italic line-clamp-1">
                      &quot;{r.catatan}&quot;
                    </p>
                  )}
                </div>

                <div className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto opacity-50" />
              <p className="text-xs">Belum ada laporan harian yang dicatat</p>
              <button
                onClick={() => onNavigate('input')}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                + Mulai Buat Laporan Pertama
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

