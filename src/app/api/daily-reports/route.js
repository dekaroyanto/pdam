import { NextResponse } from 'next/server';
import { getPool, query } from '@/lib/db';
import { calculateVolume } from '@/lib/calculator';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const mingguKe = searchParams.get('minggu_ke');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let sql = `
      SELECT 
        r.*,
        p.nama_pekerjaan,
        p.no_spp,
        p.pelaksana,
        COUNT(DISTINCT dp.id) as total_job_progress,
        COUNT(DISTINCT dru.id) as total_resource_usages,
        COALESCE(SUM(dp.volume_harian), 0) as total_volume_harian
      FROM daily_reports r
      JOIN projects p ON r.project_id = p.id
      LEFT JOIN daily_progress dp ON r.id = dp.daily_report_id
      LEFT JOIN daily_resource_usages dru ON r.id = dru.daily_report_id
    `;

    const conditions = [];
    const params = [];

    if (projectId) {
      conditions.push('r.project_id = ?');
      params.push(projectId);
    }
    if (mingguKe) {
      conditions.push('r.minggu_ke = ?');
      params.push(mingguKe);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY r.id ORDER BY r.tanggal DESC, r.id DESC LIMIT ?';
    params.push(limit);

    const reports = await query(sql, params);
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  let conn;

  try {
    const pool = getPool();
    conn = await pool.getConnection();
    const body = await request.json();
    const {
      project_id,
      minggu_ke,
      hari,
      tanggal,
      catatan,
      progress_items = [], // array of { job_item_id, parameter_values, volume_harian, formula, tipe_perhitungan }
      resource_usages = [], // array of { master_resource_id, jumlah }
    } = body;

    if (!project_id || !minggu_ke || !hari || !tanggal) {
      return NextResponse.json({ error: 'Data laporan wajib (project_id, minggu_ke, hari, tanggal) belum lengkap' }, { status: 400 });
    }

    await conn.beginTransaction();

    // 1. Insert daily_reports
    const [reportRes] = await conn.query(
      `INSERT INTO daily_reports (project_id, minggu_ke, hari, tanggal, catatan)
       VALUES (?, ?, ?, ?, ?)`,
      [project_id, minggu_ke, hari, tanggal, catatan || null]
    );
    const dailyReportId = reportRes.insertId;

    // 2. Insert daily_progress
    if (Array.isArray(progress_items) && progress_items.length > 0) {
      for (const item of progress_items) {
        if (!item.job_item_id) continue;

        let calculatedVolume = parseFloat(item.volume_harian);
        if (isNaN(calculatedVolume) || item.formula) {
          calculatedVolume = calculateVolume({
            formula: item.formula,
            params: item.parameter_values,
            type: item.tipe_perhitungan,
            manualVolume: item.volume_harian
          });
        }

        // Only insert if volume is entered or parameter values exist
        if (calculatedVolume > 0 || (item.parameter_values && Object.keys(item.parameter_values).length > 0)) {
          const paramJson = item.parameter_values ? JSON.stringify(item.parameter_values) : null;
          await conn.query(
            `INSERT INTO daily_progress (daily_report_id, job_item_id, parameter_values, volume_harian)
             VALUES (?, ?, ?, ?)`,
            [dailyReportId, item.job_item_id, paramJson, calculatedVolume || 0]
          );
        }
      }
    }

    // 3. Insert daily_resource_usages
    if (Array.isArray(resource_usages) && resource_usages.length > 0) {
      for (const res of resource_usages) {
        const jumlah = parseFloat(res.jumlah);
        if (res.master_resource_id && !isNaN(jumlah) && jumlah > 0) {
          await conn.query(
            `INSERT INTO daily_resource_usages (daily_report_id, master_resource_id, jumlah)
             VALUES (?, ?, ?)`,
            [dailyReportId, res.master_resource_id, jumlah]
          );
        }
      }
    }

    await conn.commit();

    return NextResponse.json({
      success: true,
      id: dailyReportId,
      message: 'Laporan harian berhasil disimpan!'
    }, { status: 201 });
  } catch (error) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (e) {
        console.error('Rollback error:', e);
      }
    }
    console.error('Error creating daily report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

