import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get all master categories
    const categories = await query(
      `SELECT * FROM job_categories ORDER BY urutan ASC, id ASC`
    );

    // Get all job items
    const items = await query(
      `SELECT i.* 
       FROM job_items i
       JOIN job_categories c ON i.category_id = c.id
       ORDER BY c.urutan ASC, i.id ASC`
    );

    // Parse JSON parameter_keys
    const parsedItems = items.map((item) => {
      let params = [];
      if (typeof item.parameter_keys === 'string') {
        try {
          params = JSON.parse(item.parameter_keys);
        } catch {
          params = [];
        }
      } else if (Array.isArray(item.parameter_keys)) {
        params = item.parameter_keys;
      }
      return {
        ...item,
        parameter_keys: params,
      };
    });

    // Group items into categories
    const categoriesWithItems = categories.map((cat) => ({
      ...cat,
      items: parsedItems.filter((i) => i.category_id === cat.id),
    }));

    return NextResponse.json(categoriesWithItems);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, nama_kategori, urutan, category_id, nama_item, satuan, tipe_perhitungan, formula_expression, parameter_keys } = body;

    // Action: Add new item to a category
    if (action === 'create_item') {
      if (!category_id || !nama_item || !satuan) {
        return NextResponse.json({ error: 'Data item pekerjaan tidak lengkap' }, { status: 400 });
      }

      const paramsJson = parameter_keys ? JSON.stringify(parameter_keys) : null;
      const res = await query(
        `INSERT INTO job_items (category_id, nama_item, satuan, tipe_perhitungan, formula_expression, parameter_keys)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [category_id, nama_item, satuan, tipe_perhitungan || 'RUMUS_DINAMIS', formula_expression || null, paramsJson]
      );

      return NextResponse.json({ id: res.insertId, message: 'Item berhasil ditambahkan untuk semua proyek' });
    }

    // Default action: create master category (global for all projects)
    if (!nama_kategori) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO job_categories (nama_kategori, urutan) VALUES (?, ?)`,
      [nama_kategori, urutan || 1]
    );

    return NextResponse.json({ id: res.insertId, message: 'Kategori berhasil ditambahkan untuk semua proyek' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
