'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import DbStatusModal from '@/components/DbStatusModal';
import DashboardView from '@/components/DashboardView';
import DailyInputView from '@/components/DailyInputView';
import DailyReportsView from '@/components/DailyReportsView';
import WeeklyReportView from '@/components/WeeklyReportView';
import MasterDataView from '@/components/MasterDataView';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [dbStatus, setDbStatus] = useState(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [dailyReports, setDailyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Edit / view detail state
  const [editingReportId, setEditingReportId] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);

  // Fetch DB Status
  const fetchDbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/db-status');
      const data = await res.json();
      setDbStatus(data);
      return data;
    } catch (err) {
      setDbStatus({
        connected: false,
        error: err.message,
        help: 'Gagal menghubungi server aplikasi',
      });
      return null;
    }
  }, []);

  // Fetch Projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }, [selectedProjectId]);

  // Fetch Daily Reports for active project
  const fetchDailyReports = useCallback(async (projId) => {
    if (!projId) {
      setDailyReports([]);
      return;
    }
    try {
      const res = await fetch(`/api/daily-reports?project_id=${projId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setDailyReports(data);
      }
    } catch (err) {
      console.error('Error fetching daily reports:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchDbStatus();
      await fetchProjects();
      setLoading(false);
    };
    init();
  }, [fetchDbStatus, fetchProjects]);

  // When selected project changes, fetch reports
  useEffect(() => {
    if (selectedProjectId) {
      fetchDailyReports(selectedProjectId);
    }
  }, [selectedProjectId, fetchDailyReports]);

  // 1-Click Seed Data Handler
  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      let json = {};
      try {
        json = await res.json();
      } catch (parseErr) {
        throw new Error('Server mengembalikan respon kosong atau gagal terhubung ke database. Periksa DB_HOST di .env.local.');
      }

      if (json.success) {
        await fetchProjects();
        if (json.project_id) {
          setSelectedProjectId(json.project_id);
          await fetchDailyReports(json.project_id);
        }
        await fetchDbStatus();
        alert('Master data awal PDAM berhasil diisi!');
      } else {
        alert(json.help || json.error || 'Gagal mengisi data awal PDAM. Periksa koneksi database.');
        setIsDbModalOpen(true);
      }
    } catch (e) {
      console.error('Error seeding data:', e);
      alert(e.message || 'Gagal menghubungkan ke database Hostinger.');
      setIsDbModalOpen(true);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleEditReport = (id) => {
    setEditingReportId(id);
    setCurrentTab('input');
  };

  const handleInputSaved = (savedId) => {
    setEditingReportId(null);
    fetchDailyReports(selectedProjectId);
    setCurrentTab('daily');
    setSelectedReportId(savedId);
  };

  const selectedProject = projects.find((p) => String(p.id) === String(selectedProjectId)) || projects[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Header & Mobile Bottom Nav */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'input' && currentTab !== 'input') {
            setEditingReportId(null);
          }
          setCurrentTab(tab);
        }}
        dbStatus={dbStatus}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={(id) => setSelectedProjectId(id)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-5">
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-medium">Menghubungkan ke database PDAM...</p>
          </div>
        ) : (
          <>
            {/* View Switching */}
            {currentTab === 'dashboard' && (
              <DashboardView
                project={selectedProject}
                projects={projects}
                dailyReports={dailyReports}
                onNavigate={(tab) => {
                  if (tab === 'input') setEditingReportId(null);
                  setCurrentTab(tab);
                }}
                onSeedData={handleSeedData}
                isSeeding={isSeeding}
                onSelectReport={(id) => {
                  setSelectedReportId(id);
                  setCurrentTab('daily');
                }}
              />
            )}

            {currentTab === 'input' && (
              <DailyInputView
                projectId={selectedProjectId}
                editReportId={editingReportId}
                onSaveSuccess={handleInputSaved}
                onCancel={() => {
                  setEditingReportId(null);
                  setCurrentTab('daily');
                }}
              />
            )}

            {currentTab === 'daily' && (
              <DailyReportsView
                projectId={selectedProjectId}
                selectedReportId={selectedReportId}
                onClearSelectedReport={() => setSelectedReportId(null)}
                onEditReport={handleEditReport}
                onAddNew={() => {
                  setEditingReportId(null);
                  setCurrentTab('input');
                }}
              />
            )}

            {currentTab === 'weekly' && (
              <WeeklyReportView projectId={selectedProjectId} />
            )}

            {currentTab === 'master' && (
              <MasterDataView
                projectId={selectedProjectId}
                projects={projects}
                onRefreshProjects={fetchProjects}
                onSeedData={handleSeedData}
                isSeeding={isSeeding}
                onOpenDbModal={() => setIsDbModalOpen(true)}
                dbStatus={dbStatus}
              />
            )}
          </>
        )}
      </main>

      {/* DB Status & Hostinger Setup Modal */}
      <DbStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        dbStatus={dbStatus}
        onRefresh={fetchDbStatus}
      />
    </div>
  );
}
