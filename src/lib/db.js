import mysql from 'mysql2/promise';

let pool;

export function getPool() {
  if (!pool) {
    const isSsl = process.env.DB_SSL === 'true';

    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'u126089851_dbpdam',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
  }
  return pool;
}

/**
 * Execute parameterized query safely
 */
export async function query(sql, params = []) {
  try {
    const db = getPool();
    const [rows, fields] = await db.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error.message, { sql, params });
    throw error;
  }
}

/**
 * Test database connection and return diagnostic status
 */
export async function testDbConnection() {
  try {
    const db = getPool();
    const [rows] = await db.query('SELECT 1 + 1 AS test_val');
    
    // Check tables
    const [tables] = await db.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [process.env.DB_NAME || 'u126089851_dbpdam']
    );

    const tableNames = tables.map((t) => t.TABLE_NAME || t.table_name);

    return {
      connected: true,
      message: 'Koneksi database berhasil!',
      tables: tableNames,
      config: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
      }
    };
  } catch (error) {
    let helpMessage = error.message;
    if (error.code === 'ECONNREFUSED') {
      helpMessage = `Tidak dapat terhubung ke ${process.env.DB_HOST}:${process.env.DB_PORT}. Pastikan host & port benar dan fitur 'Remote MySQL' di Hostinger sudah mengizinkan IP Anda.`;
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      helpMessage = `Akses ditolak untuk user '${process.env.DB_USER}'. Periksa kembali DB_USER dan DB_PASSWORD di file .env.local.`;
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      helpMessage = `Database '${process.env.DB_NAME}' tidak ditemukan di server Hostinger. Periksa kembali nama database di .env.local.`;
    }

    return {
      connected: false,
      error: error.message,
      code: error.code,
      help: helpMessage,
      config: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
      }
    };
  }
}

