import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually if exists
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u126089851_dbpdam',
  connectTimeout: 5000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
};

console.log('--------------------------------------------------');
console.log('   UJI KONEKSI DATABASE HOSTINGER (PDAM APP)');
console.log('--------------------------------------------------');
console.log(`Host     : ${config.host}`);
console.log(`Port     : ${config.port}`);
console.log(`Database : ${config.database}`);
console.log(`User     : ${config.user}`);
console.log(`Password : ${config.password ? '******' : '(kosong)'}`);
console.log('--------------------------------------------------');
console.log('Sedang mencoba menghubungkan ke server Hostinger...');

async function runTest() {
  try {
    const conn = await mysql.createConnection(config);
    console.log('\n[SUKSES] Berhasil terhubung ke database Hostinger!');

    const [tables] = await conn.query('SHOW TABLES');
    const tableList = tables.map((t) => Object.values(t)[0]);
    console.log(`[INFO] Jumlah tabel ditemukan: ${tableList.length}`);
    console.log(`[INFO] Tabel: ${tableList.join(', ')}`);

    await conn.end();
    console.log('\nSiap digunakan! Silakan jalankan aplikasi dengan: npm run dev\n');
  } catch (error) {
    console.error('\n[GAGAL] Tidak dapat terhubung ke database.');
    console.error(`Pesan Error: ${error.message} (${error.code || 'UNKNOWN'})\n`);

    if (config.host === '127.0.0.1' || config.host === 'localhost') {
      console.log('>>> PENYEBAB:');
      console.log('    DB_HOST masih 127.0.0.1. Karena database Anda di Hostinger,');
      console.log('    masukkan MySQL Host atau IP server Hostinger Anda pada file .env.local.\n');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('>>> PENYEBAB:');
      console.log('    Koneksi diblokir atau timeout. Pastikan Anda telah mengaktifkan');
      console.log('    "Remote MySQL" di hPanel Hostinger dengan IP "%" (izinkan semua IP).\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('>>> PENYEBAB:');
      console.log('    Username atau password database salah. Periksa kembali DB_USER dan DB_PASSWORD di .env.local.\n');
    }
  }
}

runTest();

