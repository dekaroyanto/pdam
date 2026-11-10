import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST() {
  let conn;

  try {
    const pool = getPool();
    conn = await pool.getConnection();

    await conn.beginTransaction();

    // 1. Check if projects exist, if not, create default project
    const [existingProjects] = await conn.query('SELECT id FROM projects LIMIT 1');
    let projectId;

    if (existingProjects.length > 0) {
      projectId = existingProjects[0].id;
    } else {
      const [pRes] = await conn.query(
        `INSERT INTO projects (nama_pekerjaan, no_spp, tanggal_spp, waktu_pelaksanaan, pelaksana)
         VALUES (?, ?, ?, ?, ?)`,
        [
          'Pengembangan Jaringan Pipa Distribusi Air Minum PDAM Wilayah Barat',
          'SPP/PDAM-DIR/XI/2026/089',
          '2026-10-01',
          90,
          'PT. TIRTA CIPTA TEKNIK'
        ]
      );
      projectId = pRes.insertId;
    }

    // 2. Insert Master Resources if empty
    const [existingResources] = await conn.query('SELECT id FROM master_resources LIMIT 1');
    if (existingResources.length === 0) {
      const resources = [
        // Tenaga Kerja - Management
        ['Tenaga Kerja', 'Management', 'Project Manager', 'org'],
        ['Tenaga Kerja', 'Management', 'Pelaksana Lapangan', 'org'],
        ['Tenaga Kerja', 'Management', 'Petugas K3 / Safety', 'org'],
        // Tenaga Kerja - Lapangan
        ['Tenaga Kerja', 'Lapangan', 'Mandor Lapangan', 'org'],
        ['Tenaga Kerja', 'Lapangan', 'Tukang Pipa (Pipe Fitter)', 'org'],
        ['Tenaga Kerja', 'Lapangan', 'Operator Mesin Butt Fusion', 'org'],
        ['Tenaga Kerja', 'Lapangan', 'Operator Excavator', 'org'],
        ['Tenaga Kerja', 'Lapangan', 'Pekerja Galian', 'org'],
        // Bahan & Alat - Alat
        ['Bahan & Alat', 'Alat', 'Excavator Mini PC-75', 'unit'],
        ['Bahan & Alat', 'Alat', 'Mesin Las Butt Fusion HDPE', 'unit'],
        ['Bahan & Alat', 'Alat', 'Genset Silent 5 kVA', 'unit'],
        ['Bahan & Alat', 'Alat', 'Stamper Kodok Pemadat', 'unit'],
        ['Bahan & Alat', 'Alat', 'Pompa Uji Hydrotest & Pressure Gauge', 'unit'],
        // Bahan & Alat - Bahan
        ['Bahan & Alat', 'Bahan', 'Pipa HDPE PE-100 SDR-17 OD 90 mm', 'm'],
        ['Bahan & Alat', 'Bahan', 'Pipa HDPE PE-100 SDR-17 OD 63 mm', 'm'],
        ['Bahan & Alat', 'Bahan', 'Pasir Urug Bantalan Pipa', 'm3'],
        ['Bahan & Alat', 'Bahan', 'Semen Portlan', 'sak'],
        // Bahan & Alat - Accessories
        ['Bahan & Alat', 'Accessories', 'Gate Valve CI DN 80 mm PN-16', 'bh'],
        ['Bahan & Alat', 'Accessories', 'Air Release Valve DN 25 mm', 'bh'],
        ['Bahan & Alat', 'Accessories', 'Flange Adaptor HDPE DN 80', 'set'],
        ['Bahan & Alat', 'Accessories', 'Stub End & Backing Ring DN 90', 'set'],
      ];

      for (const r of resources) {
        await conn.query(
          `INSERT INTO master_resources (kategori_utama, sub_kategori, nama, satuan, status_aktif)
           VALUES (?, ?, ?, ?, 1)`,
          r
        );
      }
    }

    // 3. Insert Job Categories & Items (Global Master Data) if empty
    const [existingCategories] = await conn.query('SELECT id FROM job_categories LIMIT 1');
    if (existingCategories.length === 0) {
      const categories = [
        {
          nama: 'I. PEKERJAAN PERSIAPAN & PENGUKURAN',
          urutan: 1,
          items: [
            { nama: 'Pengukuran dan Pematokan Jalur Pipa', satuan: 'm', tipe: 'RUMUS_DINAMIS', formula: 'panjang', params: ['panjang'] },
            { nama: 'Papan Proyek dan Rambu Keselamatan K3', satuan: 'ls', tipe: 'MANUAL', formula: null, params: null },
          ]
        },
        {
          nama: 'II. PEKERJAAN GALIAN DAN URUGAN TANAH',
          urutan: 2,
          items: [
            { nama: 'Galian Tanah Jalur Pipa Kedalaman 1,00 - 1,20 m', satuan: 'm3', tipe: 'RUMUS_DINAMIS', formula: 'panjang * lebar * kedalaman', params: ['panjang', 'lebar', 'kedalaman'] },
            { nama: 'Urugan Pasir Alas Pipa Tebal 10 cm', satuan: 'm3', tipe: 'RUMUS_DINAMIS', formula: 'panjang * lebar * tebal', params: ['panjang', 'lebar', 'tebal'] },
            { nama: 'Urugan Tanah Kembali dan Pemadatan', satuan: 'm3', tipe: 'RUMUS_DINAMIS', formula: 'panjang * lebar * kedalaman', params: ['panjang', 'lebar', 'kedalaman'] },
          ]
        },
        {
          nama: 'III. PEKERJAAN PEMASANGAN PIPA HDPE',
          urutan: 3,
          items: [
            { nama: 'Pemasangan Pipa HDPE PE-100 OD 90 mm (3 Inch)', satuan: 'm', tipe: 'RUMUS_DINAMIS', formula: 'panjang', params: ['panjang'] },
            { nama: 'Pemasangan Pipa HDPE PE-100 OD 63 mm (2 Inch)', satuan: 'm', tipe: 'RUMUS_DINAMIS', formula: 'panjang', params: ['panjang'] },
            { nama: 'Penyambungan Butt Fusion Pipa OD 90 mm', satuan: 'titik', tipe: 'MANUAL', formula: null, params: null },
          ]
        },
        {
          nama: 'IV. PEKERJAAN VALVE & ACCESSORIES',
          urutan: 4,
          items: [
            { nama: 'Pemasangan Gate Valve Cast Iron DN 80 mm', satuan: 'unit', tipe: 'MANUAL', formula: null, params: null },
            { nama: 'Pemasangan Air Release Valve DN 25 mm', satuan: 'unit', tipe: 'MANUAL', formula: null, params: null },
            { nama: 'Pembuatan Box Valve / Bak Kontrol Valve', satuan: 'unit', tipe: 'MANUAL', formula: null, params: null },
            { nama: 'Pengujian Tekanan Pipa (Hydrostatic Test)', satuan: 'm', tipe: 'RUMUS_DINAMIS', formula: 'panjang', params: ['panjang'] },
            { nama: 'Pencucian & Disinfeksi Jaringan Pipa', satuan: 'm', tipe: 'RUMUS_DINAMIS', formula: 'panjang', params: ['panjang'] },
          ]
        }
      ];

      for (const cat of categories) {
        const [catRes] = await conn.query(
          `INSERT INTO job_categories (nama_kategori, urutan) VALUES (?, ?)`,
          [cat.nama, cat.urutan]
        );
        const catId = catRes.insertId;

        for (const item of cat.items) {
          await conn.query(
            `INSERT INTO job_items (category_id, nama_item, satuan, tipe_perhitungan, formula_expression, parameter_keys)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              catId,
              item.nama,
              item.satuan,
              item.tipe,
              item.formula,
              item.params ? JSON.stringify(item.params) : null
            ]
          );
        }
      }
    }

    await conn.commit();
    return NextResponse.json({
      success: true,
      message: 'Master data awal PDAM berhasil diisi!',
      project_id: projectId
    });
  } catch (error) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rbErr) {
        console.error('Rollback error:', rbErr.message);
      }
    }
    console.error('Seed error:', error.message);
    
    let help = error.message;
    if (error.code === 'ECONNREFUSED') {
      help = `Tidak dapat terhubung ke database (${process.env.DB_HOST}:${process.env.DB_PORT}). Jika menggunakan Hostinger, jangan gunakan 127.0.0.1. Isi DB_HOST dengan MySQL Host dari hPanel Hostinger.`;
    }

    return NextResponse.json({
      success: false,
      error: error.message,
      help,
      code: error.code
    }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
