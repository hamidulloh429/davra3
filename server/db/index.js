const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  client_encoding: 'UTF8'
});

// Enforce UTF8 encoding on all database connections to properly support emojis and international characters
pool.on('connect', (client) => {
  client.query("SET client_encoding TO 'UTF8'").catch((err) => {
    console.error("Xatolik client_encoding UTF8 o'rnatishda:", err);
  });
});

pool.on('error', (err) => {
  console.error('Kutilmagan xatolik backend ma\'lumotlar bazasida (Unexpected error on idle client)', err);
});

const gracefulShutdown = () => {
  console.log('Ma\'lumotlar bazasi aloqasi uzilmoqda... (Shutting down db pool)');
  pool.end(() => {
    console.log('Ma\'lumotlar bazasi aloqasi muvaffaqiyatli uzildi. (Pool has ended)');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = {
  query: async (text, params) => {
    const client = await pool.connect();
    try {
      await client.query("SET client_encoding TO 'UTF8'");
      const res = await client.query(text, params);
      return res;
    } finally {
      client.release();
    }
  },
  getClient: async () => {
    const client = await pool.connect();
    await client.query("SET client_encoding TO 'UTF8'");
    return client;
  },
  pool,
};
