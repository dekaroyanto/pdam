'use client';

import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, X, ShieldAlert, Key, Globe, Server } from 'lucide-react';

export default function DbStatusModal({ isOpen, onClose, dbStatus, onRefresh }) {
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    await onRefresh();
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${dbStatus?.connected ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">Status Integrasi Database Hostinger</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">MySQL / MariaDB u126089851_dbpdam</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Status Alert */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            dbStatus?.connected 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'
          }`}>
            {dbStatus?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold">
                {dbStatus?.connected ? 'Terhubung ke Database Hostinger!' : 'Belum Terhubung ke Database'}
              </div>
              <p className="text-xs mt-1 leading-relaxed">
                {dbStatus?.message || dbStatus?.help || dbStatus?.error || 'Silakan cek file .env.local untuk menghubungkan database Hostinger.'}
              </p>
            </div>
          </div>

          {/* Current Config */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Konfigurasi Aktif (.env.local)</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Host:</span> <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">{dbStatus?.config?.host || 'localhost'}</code>
              </div>
              <div>
                <span className="text-slate-400">Port:</span> <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">{dbStatus?.config?.port || '3306'}</code>
              </div>
              <div>
                <span className="text-slate-400">Database:</span> <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">{dbStatus?.config?.database || 'u126089851_dbpdam'}</code>
              </div>
              <div>
                <span className="text-slate-400">User:</span> <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">{dbStatus?.config?.user || 'root'}</code>
              </div>
            </div>
          </div>

          {/* Guide for Hostinger Integration */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
              Langkah Integrasi Database Hostinger:
            </h4>
            
            <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold shrink-0 flex items-center justify-center text-[10px]">1</span>
                <div>
                  <strong>Buka file <code>.env.local</code></strong> di folder proyek ini (<code>c:\Deka App\pdam\.env.local</code>).
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold shrink-0 flex items-center justify-center text-[10px]">2</span>
                <div>
                  <strong>Isi 4 variabel penting berikut:</strong>
                  <ul className="mt-1 space-y-1 list-disc list-inside bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-lg font-mono text-[11px]">
                    <li>DB_HOST=<span>(Host/IP MySQL Hostinger, cth: srv1234.hstgr.io atau IP server)</span></li>
                    <li>DB_NAME=u126089851_dbpdam</li>
                    <li>DB_USER=<span>(Username database di Hostinger, cth: u126089851_pdam)</span></li>
                    <li>DB_PASSWORD=<span>(Password user database Anda di Hostinger)</span></li>
                  </ul>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold shrink-0 flex items-center justify-center text-[10px]">3</span>
                <div>
                  <strong>PENTING: Izinkan Remote MySQL di Hostinger hPanel</strong>
                  <p className="mt-0.5 text-slate-500">
                    Masuk ke hPanel Hostinger &rarr; menu <strong>Databases</strong> &rarr; <strong>Remote MySQL</strong>. Masukkan IP komputer Anda atau masukkan tanda <code>%</code> (izinkan semua IP) agar aplikasi di laptop/HP bisa terhubung ke server Hostinger.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Menguji Koneksi...' : 'Uji Koneksi Ulang'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

