import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const projects = await query(`
      SELECT 
        p.*,
        COUNT(DISTINCT r.id) as total_reports,
        MAX(r.tanggal) as latest_report_date
      FROM projects p
      LEFT JOIN daily_reports r ON p.id = r.project_id
      GROUP BY p.id
      ORDER BY p.id DESC
    `);

    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      nama_pekerjaan, 
      no_spp, 
      tanggal_spp, 
      waktu_pelaksanaan, 
      pelaksana,
      pengawas_bagian,
      kepala_seksi_bagian
    } = body;

    if (!nama_pekerjaan) {
      return NextResponse.json({ error: 'Nama pekerjaan wajib diisi' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO projects (nama_pekerjaan, no_spp, tanggal_spp, waktu_pelaksanaan, pelaksana, pengawas_bagian, kepala_seksi_bagian)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nama_pekerjaan,
        no_spp || null,
        tanggal_spp || null,
        waktu_pelaksanaan ? parseInt(waktu_pelaksanaan, 10) : null,
        pelaksana || null,
        pengawas_bagian || null,
        kepala_seksi_bagian || null,
      ]
    );

    return NextResponse.json({
      id: result.insertId,
      nama_pekerjaan,
      no_spp,
      tanggal_spp,
      waktu_pelaksanaan,
      pelaksana,
      pengawas_bagian,
      kepala_seksi_bagian,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { 
      id, 
      nama_pekerjaan, 
      no_spp, 
      tanggal_spp, 
      waktu_pelaksanaan, 
      pelaksana,
      pengawas_bagian,
      kepala_seksi_bagian
    } = body;

    if (!id || !nama_pekerjaan) {
      return NextResponse.json({ error: 'ID dan Nama Pekerjaan wajib diisi' }, { status: 400 });
    }

    await query(
      `UPDATE projects 
       SET nama_pekerjaan = ?,
           no_spp = ?,
           tanggal_spp = ?,
           waktu_pelaksanaan = ?,
           pelaksana = ?,
           pengawas_bagian = ?,
           kepala_seksi_bagian = ?
       WHERE id = ?`,
      [
        nama_pekerjaan,
        no_spp || null,
        tanggal_spp || null,
        waktu_pelaksanaan ? parseInt(waktu_pelaksanaan, 10) : null,
        pelaksana || null,
        pengawas_bagian || null,
        kepala_seksi_bagian || null,
        id
      ]
    );

    return NextResponse.json({ success: true, message: 'Proyek berhasil diperbarui' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID proyek diperlukan' }, { status: 400 });
    }

    await query(`DELETE FROM projects WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: 'Proyek berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
