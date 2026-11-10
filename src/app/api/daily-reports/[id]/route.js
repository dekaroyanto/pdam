import { NextResponse } from 'next/server';
import { getPool, query } from '@/lib/db';
import { calculateVolume } from '@/lib/calculator';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Get report header
    const [report] = await query(
      `SELECT r.*, p.nama_pekerjaan, p.no_spp, p.tanggal_spp, p.waktu_pelaksanaan, p.pelaksana
       FROM daily_reports r
       JOIN projects p ON r.project_id = p.id
       WHERE r.id = ?`,
      [id]
    );

    if (!report) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    // Get progress items
    const progressItems = await query(
      `SELECT 
        dp.*,
        ji.nama_item,
        ji.satuan,
        ji.tipe_perhitungan,
        ji.formula_expression,
        ji.parameter_keys,
        jc.nama_kategori,
        jc.urutan as category_urutan
       FROM daily_progress dp
       JOIN job_items ji ON dp.job_item_id = ji.id
       JOIN job_categories jc ON ji.category_id = jc.id
       WHERE dp.daily_report_id = ?
       ORDER BY jc.urutan ASC, ji.id ASC`,
      [id]
    );

    const parsedProgress = progressItems.map((item) => ({
      ...item,
      parameter_values: typeof item.parameter_values === 'string' ? JSON.parse(item.parameter_values || '{}') : (item.parameter_values || {}),
      parameter_keys: typeof item.parameter_keys === 'string' ? JSON.parse(item.parameter_keys || '[]') : (item.parameter_keys || []),
    }));

    // Get resource usages
    const resourceUsages = await query(
      `SELECT 
        dru.*,
        mr.nama as resource_nama,
        mr.satuan,
        mr.kategori_utama,
        mr.sub_kategori
       FROM daily_resource_usages dru
       JOIN master_resources mr ON dru.master_resource_id = mr.id
       WHERE dru.daily_report_id = ?
       ORDER BY mr.kategori_utama ASC, mr.sub_kategori ASC, mr.nama ASC`,
      [id]
    );

    return NextResponse.json({
      report,
      progress_items: parsedProgress,
      resource_usages: resourceUsages,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
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
      progress_items = [],
      resource_usages = [],
    } = body;

    await conn.beginTransaction();

    // 1. Update report header
    await conn.query(
      `UPDATE daily_reports 
       SET project_id = ?, minggu_ke = ?, hari = ?, tanggal = ?, catatan = ?
       WHERE id = ?`,
      [project_id, minggu_ke, hari, tanggal, catatan || null, id]
    );

    // 2. Delete old progress and insert updated
    await conn.query(`DELETE FROM daily_progress WHERE daily_report_id = ?`, [id]);
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

      if (calculatedVolume > 0 || (item.parameter_values && Object.keys(item.parameter_values).length > 0)) {
        const paramJson = item.parameter_values ? JSON.stringify(item.parameter_values) : null;
        await conn.query(
          `INSERT INTO daily_progress (daily_report_id, job_item_id, parameter_values, volume_harian)
           VALUES (?, ?, ?, ?)`,
          [id, item.job_item_id, paramJson, calculatedVolume || 0]
        );
      }
    }

    // 3. Delete old resource usages and insert updated
    await conn.query(`DELETE FROM daily_resource_usages WHERE daily_report_id = ?`, [id]);
    for (const res of resource_usages) {
      const jumlah = parseFloat(res.jumlah);
      if (res.master_resource_id && !isNaN(jumlah) && jumlah > 0) {
        await conn.query(
          `INSERT INTO daily_resource_usages (daily_report_id, master_resource_id, jumlah)
           VALUES (?, ?, ?)`,
          [id, res.master_resource_id, jumlah]
        );
      }
    }

    await conn.commit();
    return NextResponse.json({ success: true, message: 'Laporan harian berhasil diperbarui!' });
  } catch (error) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (e) {
        console.error('Rollback error:', e);
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await query(`DELETE FROM daily_reports WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: 'Laporan berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

