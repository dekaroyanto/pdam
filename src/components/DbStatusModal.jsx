'use client';

import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, X } from 'lucide-react';

export default function DbStatusModal({ isOpen, onClose, dbStatus, onRefresh }) {
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    await onRefresh();
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
      <div className="relative w-full max-w-md bg-white rounded-lg border border-zinc-200 overflow-hidden flex flex-col text-xs">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="font-semibold text-zinc-900 text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-zinc-600" />
            Status Database Hostinger
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className={`p-3 rounded border flex items-start gap-2.5 ${
            dbStatus?.connected 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {dbStatus?.connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold">
                {dbStatus?.connected ? 'Terhubung ke Database' : 'Koneksi Terputus'}
              </div>
              <p className="text-[11px] mt-0.5 leading-relaxed">
                {dbStatus?.message || dbStatus?.help || dbStatus?.error || 'Periksa file .env.local untuk konfigurasi koneksi.'}
              </p>
            </div>
          </div>

          <div className="bg-zinc-50 p-2.5 rounded border border-zinc-200 space-y-1 font-mono text-[11px]">
            <div>Host: <span className="font-semibold">{dbStatus?.config?.host || '148.222.53.111'}</span></div>
            <div>Database: <span className="font-semibold">{dbStatus?.config?.database || 'u126089851_dbpdam'}</span></div>
            <div>User: <span className="font-semibold">{dbStatus?.config?.user || 'u126089851_pdam'}</span></div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Menguji...' : 'Uji Koneksi'}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
