const path = require('path');
const fs = require('fs');

const envPaths = [
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../../.env')
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    require('dotenv').config({ path: p });
    break;
  }
}

const bcrypt = require('bcrypt');
const { query, pool } = require('./index');

const seedAdmin = async () => {
  let hasError = false;
  try {
    console.log("Asosiy administrator yaratilmoqda...");

    const username = process.env.ADMIN_DEFAULT_USERNAME || 'asqarov';
    const plainPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'asqarov62';
    const fullName = 'Administrator';

    const hash = await bcrypt.hash(plainPassword, 12);

    const result = await query(
      `INSERT INTO admins (username, password_hash, full_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING
       RETURNING id;`,
      [username, hash, fullName]
    );

    if (result.rows.length > 0) {
      console.log(`Administrator muvaffaqiyatli yaratildi: ${username}`);
    } else {
      console.log(`Administrator allaqachon mavjud: ${username}`);
    }
  } catch (error) {
    hasError = true;
    console.error("Administrator yaratishda xatolik:", error.message || error);
  } finally {
    await pool.end();
    process.exit(hasError ? 1 : 0);
  }
};

seedAdmin();
