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
    const { nama_pekerjaan, no_spp, tanggal_spp, waktu_pelaksanaan, pelaksana } = body;

    if (!nama_pekerjaan) {
      return NextResponse.json({ error: 'Nama pekerjaan wajib diisi' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO projects (nama_pekerjaan, no_spp, tanggal_spp, waktu_pelaksanaan, pelaksana)
       VALUES (?, ?, ?, ?, ?)`,
      [
        nama_pekerjaan,
        no_spp || null,
        tanggal_spp || null,
        waktu_pelaksanaan ? parseInt(waktu_pelaksanaan, 10) : null,
        pelaksana || null,
      ]
    );

    return NextResponse.json({
      id: result.insertId,
      nama_pekerjaan,
      no_spp,
      tanggal_spp,
      waktu_pelaksanaan,
      pelaksana,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

