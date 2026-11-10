'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  CalendarDays, 
  BarChart3, 
  Settings2, 
  Database, 
  Droplets,
  FolderGit2
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  dbStatus, 
  onOpenDbModal,
  projects = [],
  selectedProjectId,
  onSelectProject
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'input', label: 'Input Harian', icon: PlusCircle, highlight: true },
    { id: 'daily', label: 'Lap. Harian', icon: CalendarDays },
    { id: 'weekly', label: 'Lap. Mingguan', icon: BarChart3 },
    { id: 'master', label: 'Master Data', icon: Settings2 },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">PDAM</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  Progres
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">Laporan Harian & Mingguan</p>
            </div>
          </div>

          {/* Project & DB Status */}
          <div className="flex items-center gap-2">
            {/* Project Selector (compact on mobile) */}
            {projects.length > 0 && (
              <div className="relative max-w-[170px] sm:max-w-[260px]">
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => onSelectProject(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 pr-6 text-slate-800 dark:text-slate-100 truncate focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama_pekerjaan}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* DB Status Badge */}
            <button
              onClick={onOpenDbModal}
              title="Klik untuk konfigurasi database Hostinger"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 border ${
                dbStatus?.connected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 animate-pulse'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {dbStatus?.connected ? 'Hostinger DB' : 'Set Hostinger DB'}
              </span>
              <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:block border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                    isActive
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            if (item.highlight) {
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className="flex flex-col items-center justify-center -mt-4 group active:scale-90 transition-transform"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
                    +Input
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center justify-center h-full py-1 text-[11px] font-medium transition ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive ? 'bg-blue-50 dark:bg-blue-950/60' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
                </div>
                <span className="truncate max-w-[64px] text-[10px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

