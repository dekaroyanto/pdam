'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  CalendarDays, 
  BarChart3, 
  Settings2,
  Droplets
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
    { id: 'input', label: 'Input Harian', icon: PlusCircle },
    { id: 'daily', label: 'Lap. Harian', icon: CalendarDays },
    { id: 'weekly', label: 'Lap. Mingguan', icon: BarChart3 },
    { id: 'master', label: 'Master Data', icon: Settings2 },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm text-zinc-900 tracking-tight">PDAM Progres</span>
              <span className="hidden sm:inline text-xs text-zinc-400 ml-2">Laporan Lapangan</span>
            </div>
          </div>

          {/* Project & DB Status */}
          <div className="flex items-center gap-2">
            {/* Project Selector */}
            {projects.length > 0 && (
              <div className="relative max-w-[180px] sm:max-w-[280px]">
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => onSelectProject(e.target.value)}
                  className="w-full text-xs font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 truncate focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
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
              title="Status Database"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                dbStatus?.connected
                  ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="hidden sm:inline">
                {dbStatus?.connected ? 'Hostinger' : 'Cek DB'}
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden md:block border-t border-zinc-100">
          <div className="max-w-5xl mx-auto px-4 flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 pb-safe">
        <div className="grid grid-cols-5 h-14 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center justify-center h-full text-[10px] transition-colors ${
                  isActive
                    ? 'text-blue-600 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.6]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
