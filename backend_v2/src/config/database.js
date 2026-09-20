import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const isSslRequired =
  env.DATABASE_URL.includes('sslmode=require') ||
  env.DATABASE_URL.includes('neon.tech') ||
  env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isSslRequired ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('💥 Unexpected error on idle PostgreSQL client:', err);
});

/**
 * Execute a direct parameterized SQL query
 * @param {string} text - SQL statement with $1, $2 placeholders
 * @param {Array} [params] - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (env.NODE_ENV === 'development' && duration > 500) {
      console.warn(`⚠️ Slow query (${duration}ms): ${text.slice(0, 100)}...`);
    }
    return res;
  } catch (err) {
    console.error(`💥 Database Query Error in: ${text.slice(0, 100)}...`);
    console.error(`💥 Message: ${err.message}`);
    throw err;
  }
}

/**
 * Run operations inside a managed SQL transaction
 * @param {(client: pg.PoolClient) => Promise<any>} callback
 * @returns {Promise<any>}
 */
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Test PostgreSQL connection on server startup
 */
export async function connectDatabase() {
  try {
    const res = await query('SELECT NOW() AS current_time, current_database() AS db_name');
    console.log(`🐘 Connected to PostgreSQL database "${res.rows[0].db_name}" at ${res.rows[0].current_time}`);
  } catch (err) {
    console.error('💥 Failed to connect to PostgreSQL database:', err.message);
    throw err;
  }
}

/**
 * Safely parse PostgreSQL array strings (e.g. "{GRAMMAR,LISTENING}") or JSON arrays into JavaScript arrays
 * @param {any} val
 * @returns {Array<string>}
 */
export function parsePgArray(val) {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inner = trimmed.slice(1, -1).trim();
      if (!inner) return [];
      return inner
        .split(',')
        .map((s) => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    if (trimmed) return [trimmed];
    return [];
  }
  return [val];
}

