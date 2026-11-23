import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const categories = await query(
      `SELECT * FROM job_categories ORDER BY urutan ASC, id ASC`
    );

    const items = await query(
      `SELECT i.* 
       FROM job_items i
       JOIN job_categories c ON i.category_id = c.id
       ORDER BY c.urutan ASC, i.id ASC`
    );

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

      return NextResponse.json({ id: res.insertId, message: 'Item berhasil ditambahkan' });
    }

    if (!nama_kategori) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO job_categories (nama_kategori, urutan) VALUES (?, ?)`,
      [nama_kategori, urutan || 1]
    );

    return NextResponse.json({ id: res.insertId, message: 'Kategori berhasil ditambahkan' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { action, id, nama_kategori, urutan, category_id, nama_item, satuan, tipe_perhitungan, formula_expression, parameter_keys } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    if (action === 'update_item') {
      if (!nama_item || !satuan) {
        return NextResponse.json({ error: 'Nama item dan satuan wajib diisi' }, { status: 400 });
      }

      const paramsJson = parameter_keys ? JSON.stringify(parameter_keys) : null;
      await query(
        `UPDATE job_items 
         SET category_id = COALESCE(?, category_id),
             nama_item = ?,
             satuan = ?,
             tipe_perhitungan = ?,
             formula_expression = ?,
             parameter_keys = ?
         WHERE id = ?`,
        [category_id || null, nama_item, satuan, tipe_perhitungan || 'RUMUS_DINAMIS', formula_expression || null, paramsJson, id]
      );

      return NextResponse.json({ success: true, message: 'Item pekerjaan berhasil diperbarui' });
    }

    // Default action: update category
    if (!nama_kategori) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    await query(
      `UPDATE job_categories 
       SET nama_kategori = ?, urutan = ?
       WHERE id = ?`,
      [nama_kategori, urutan || 1, id]
    );

    return NextResponse.json({ success: true, message: 'Kategori berhasil diperbarui' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'category' or 'item'
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    if (type === 'item') {
      await query(`DELETE FROM job_items WHERE id = ?`, [id]);
      return NextResponse.json({ success: true, message: 'Item pekerjaan berhasil dihapus' });
    }

    // Default: delete category (cascades to items)
    await query(`DELETE FROM job_categories WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: 'Kategori beserta itemnya berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
