import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') !== 'false';
    const kategori = searchParams.get('kategori');

    let sql = 'SELECT * FROM master_resources';
    const conditions = [];
    const params = [];

    if (activeOnly) {
      conditions.push('status_aktif = 1');
    }
    if (kategori) {
      conditions.push('kategori_utama = ?');
      params.push(kategori);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY kategori_utama ASC, sub_kategori ASC, id ASC';

    const resources = await query(sql, params);
    return NextResponse.json(resources);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { kategori_utama, sub_kategori, nama, satuan } = body;

    if (!kategori_utama || !sub_kategori || !nama || !satuan) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO master_resources (kategori_utama, sub_kategori, nama, satuan, status_aktif)
       VALUES (?, ?, ?, ?, 1)`,
      [kategori_utama, sub_kategori, nama, satuan]
    );

    return NextResponse.json({
      id: res.insertId,
      kategori_utama,
      sub_kategori,
      nama,
      satuan,
      status_aktif: 1
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, kategori_utama, sub_kategori, nama, satuan, status_aktif } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID sumber daya diperlukan' }, { status: 400 });
    }

    await query(
      `UPDATE master_resources 
       SET kategori_utama = ?, sub_kategori = ?, nama = ?, satuan = ?, status_aktif = ?
       WHERE id = ?`,
      [kategori_utama, sub_kategori, nama, satuan, status_aktif ?? 1, id]
    );

    return NextResponse.json({ success: true, message: 'Sumber daya berhasil diperbarui' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

