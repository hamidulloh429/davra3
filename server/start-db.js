const path = require('path');
const EmbeddedPostgres = require('embedded-postgres').default || require('embedded-postgres');

const DB_DIR = path.join(__dirname, '..', '.pg-data');
const PORT = 5432;
const USER = 'postgres';
const PASSWORD = 'postgres';
const DATABASE = 'davra';

async function startDatabase() {
  console.log('PostgreSQL ishga tushirilmoqda (Embedded)...');
  
  const pg = new EmbeddedPostgres({
    databaseDir: DB_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
  });

  try {
    // Check if data directory already exists (already initialized)
    const fs = require('fs');
    const isInitialized = fs.existsSync(path.join(DB_DIR, 'PG_VERSION')) || fs.existsSync(path.join(DB_DIR, 'data')) || fs.existsSync(path.join(DB_DIR, 'base'));
    
    if (!isInitialized) {
      console.log('Ma\'lumotlar bazasi klaster yaratilmoqda...');
      await pg.initialise();
      console.log('Klaster muvaffaqiyatli yaratildi.');
    }
    
    // Start the server
    await pg.start();
    console.log(`PostgreSQL ${PORT}-portda muvaffaqiyatli ishga tushdi.`);
    
    // Create database if it doesn't exist
    try {
      await pg.createDatabase(DATABASE);
      console.log(`"${DATABASE}" bazasi yaratildi.`);
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        console.log(`"${DATABASE}" bazasi allaqachon mavjud.`);
      } else {
        // Try to connect and check
        console.log(`"${DATABASE}" bazasi tekshirilmoqda... (${err.message || err})`);
      }
    }
    
    const connectionString = `postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE}`;
    console.log(`\nDATABASE_URL: ${connectionString}`);
    console.log('\nPostgreSQL tayyor! Serverga start berish uchun yangi terminalda:');
    console.log('  npm run dev:server');
    
    // Write connection string for other scripts
    console.log('\nPostgreSQL ishlayapti. Ctrl+C bilan to\'xtatish mumkin.');
    
    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('\nPostgreSQL to\'xtatilmoqda...');
      try {
        await pg.stop();
        console.log('PostgreSQL muvaffaqiyatli to\'xtatildi.');
      } catch (e) {
        console.log('PostgreSQL to\'xtatishda xatolik:', e.message);
      }
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    // Keep the process alive
    await new Promise(() => {});
    
  } catch (error) {
    console.error('PostgreSQL ishga tushirishda xatolik:', error.message || error);
    
    // If port is already in use, PostgreSQL might already be running
    if (error.message && error.message.includes('address already in use')) {
      console.log('Port 5432 band. PostgreSQL allaqachon ishlamoqda bo\'lishi mumkin.');
      process.exit(0);
    }
    
    process.exit(1);
  }
}

startDatabase();
