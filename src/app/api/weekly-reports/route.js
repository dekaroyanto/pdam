import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const mingguKe = parseInt(searchParams.get('minggu_ke') || '1', 10);

    if (!projectId) {
      return NextResponse.json({ error: 'project_id diperlukan' }, { status: 400 });
    }

    // 1. Get Project info
    const [project] = await query(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan' }, { status: 404 });
    }

    // 2. Get distinct available weeks for this project
    const availableWeeksRows = await query(
      `SELECT DISTINCT minggu_ke FROM daily_reports WHERE project_id = ? ORDER BY minggu_ke ASC`,
      [projectId]
    );
    const availableWeeks = availableWeeksRows.map((r) => r.minggu_ke);

    // 3. Get daily reports for this specific week
    const dailyReports = await query(
      `SELECT id, hari, tanggal, catatan, created_at 
       FROM daily_reports 
       WHERE project_id = ? AND minggu_ke = ?
       ORDER BY tanggal ASC, id ASC`,
      [projectId, mingguKe]
    );

    // 4. Get all master job categories and items
    const jobCategories = await query(
      `SELECT * FROM job_categories ORDER BY urutan ASC, id ASC`
    );

    const jobItems = await query(
      `SELECT ji.*, jc.nama_kategori, jc.urutan as category_urutan
       FROM job_items ji
       JOIN job_categories jc ON ji.category_id = jc.id
       ORDER BY jc.urutan ASC, ji.id ASC`
    );

    // 5. Query volume for previous weeks (minggu_ke < current)
    const prevVolumesRows = await query(
      `SELECT dp.job_item_id, COALESCE(SUM(dp.volume_harian), 0) as total_prev_volume
       FROM daily_progress dp
       JOIN daily_reports dr ON dp.daily_report_id = dr.id
       WHERE dr.project_id = ? AND dr.minggu_ke < ?
       GROUP BY dp.job_item_id`,
      [projectId, mingguKe]
    );
    const prevVolumeMap = {};
    for (const row of prevVolumesRows) {
      prevVolumeMap[row.job_item_id] = parseFloat(row.total_prev_volume) || 0;
    }

    // 6. Query progress items for this current week with daily breakdown
    const currentWeekProgressRows = await query(
      `SELECT 
        dp.job_item_id, 
        dr.id as daily_report_id, 
        dr.tanggal, 
        dr.hari, 
        dp.volume_harian
       FROM daily_progress dp
       JOIN daily_reports dr ON dp.daily_report_id = dr.id
       WHERE dr.project_id = ? AND dr.minggu_ke = ?`,
      [projectId, mingguKe]
    );

    const thisWeekItemBreakdown = {}; // { [job_item_id]: { total: 0, byDate: { [tanggal]: volume } } }
    for (const row of currentWeekProgressRows) {
      if (!thisWeekItemBreakdown[row.job_item_id]) {
        thisWeekItemBreakdown[row.job_item_id] = { total: 0, byReportId: {}, byDate: {} };
      }
      const vol = parseFloat(row.volume_harian) || 0;
      thisWeekItemBreakdown[row.job_item_id].total += vol;
      thisWeekItemBreakdown[row.job_item_id].byReportId[row.daily_report_id] = vol;
      thisWeekItemBreakdown[row.job_item_id].byDate[row.tanggal] = vol;
    }

    // Assemble Job Items Summary
    const jobItemsSummary = jobItems.map((item) => {
      const prevVol = prevVolumeMap[item.id] || 0;
      const weekBreakdown = thisWeekItemBreakdown[item.id] || { total: 0, byReportId: {}, byDate: {} };
      const thisWeekVol = weekBreakdown.total;
      const cumulativeVol = prevVol + thisWeekVol;

      return {
        ...item,
        prev_volume: prevVol,
        current_week_volume: thisWeekVol,
        cumulative_volume: cumulativeVol,
        daily_breakdown: weekBreakdown.byReportId,
      };
    });

    // 7. Query Resource usages for this week & previous weeks
    const allResources = await query(
      `SELECT * FROM master_resources WHERE status_aktif = 1 ORDER BY kategori_utama ASC, sub_kategori ASC, nama ASC`
    );

    const prevResourcesRows = await query(
      `SELECT dru.master_resource_id, COALESCE(SUM(dru.jumlah), 0) as total_prev_qty
       FROM daily_resource_usages dru
       JOIN daily_reports dr ON dru.daily_report_id = dr.id
       WHERE dr.project_id = ? AND dr.minggu_ke < ?
       GROUP BY dru.master_resource_id`,
      [projectId, mingguKe]
    );
    const prevResourceMap = {};
    for (const row of prevResourcesRows) {
      prevResourceMap[row.master_resource_id] = parseFloat(row.total_prev_qty) || 0;
    }

    const currentWeekResourcesRows = await query(
      `SELECT 
        dru.master_resource_id,
        dr.id as daily_report_id,
        dr.tanggal,
        dru.jumlah
       FROM daily_resource_usages dru
       JOIN daily_reports dr ON dru.daily_report_id = dr.id
       WHERE dr.project_id = ? AND dr.minggu_ke = ?`,
      [projectId, mingguKe]
    );

    const thisWeekResourceBreakdown = {};
    for (const row of currentWeekResourcesRows) {
      if (!thisWeekResourceBreakdown[row.master_resource_id]) {
        thisWeekResourceBreakdown[row.master_resource_id] = { total: 0, byReportId: {} };
      }
      const qty = parseFloat(row.jumlah) || 0;
      thisWeekResourceBreakdown[row.master_resource_id].total += qty;
      thisWeekResourceBreakdown[row.master_resource_id].byReportId[row.daily_report_id] = qty;
    }

    // Filter resources that have any usage or show all active
    const resourcesSummary = allResources.map((res) => {
      const prevQty = prevResourceMap[res.id] || 0;
      const breakdown = thisWeekResourceBreakdown[res.id] || { total: 0, byReportId: {} };
      const thisWeekQty = breakdown.total;
      const cumulativeQty = prevQty + thisWeekQty;

      return {
        ...res,
        prev_qty: prevQty,
        current_week_qty: thisWeekQty,
        cumulative_qty: cumulativeQty,
        daily_breakdown: breakdown.byReportId,
      };
    }).filter((r) => r.cumulative_qty > 0 || r.current_week_qty > 0);

    return NextResponse.json({
      project,
      minggu_ke: mingguKe,
      available_weeks: availableWeeks.length > 0 ? availableWeeks : [1],
      daily_reports: dailyReports,
      categories: jobCategories,
      job_items_summary: jobItemsSummary,
      resources_summary: resourcesSummary,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

