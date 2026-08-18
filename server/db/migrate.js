const path = require('path');
const fs = require('fs');

// Support multiple env file locations (root or server dir or Railway env vars)
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

const { query, pool } = require('./index');

const migrate = async () => {
  let hasError = false;
  try {
    console.log("Migratsiya boshlandi...");

    const sql = `
      -- Enable UUID generation extension if needed
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- Session table for connect-pg-simple
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        full_name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        bio TEXT DEFAULT '',
        location VARCHAR(255) DEFAULT '',
        interests TEXT[] DEFAULT '{}',
        is_blocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      -- Admins table
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Communities table  
      CREATE TABLE IF NOT EXISTS communities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        category VARCHAR(100) DEFAULT 'Umumiy',
        cover_image TEXT DEFAULT '',
        owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
        visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities(slug);
      CREATE INDEX IF NOT EXISTS idx_communities_category ON communities(category);

      -- Community members
      CREATE TABLE IF NOT EXISTS community_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_community_member UNIQUE (community_id, user_id)
      );

      -- Events
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        location VARCHAR(255) DEFAULT '',
        event_date TIMESTAMP WITH TIME ZONE NOT NULL,
        max_members INTEGER DEFAULT 0,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_events_community ON events(community_id);
      CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

      -- Event members
      CREATE TABLE IF NOT EXISTS event_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_event_member UNIQUE (event_id, user_id)
      );

      -- Site settings (singleton)
      CREATE TABLE IF NOT EXISTS site_settings (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        site_name VARCHAR(255) DEFAULT 'Davra',
        description TEXT DEFAULT 'Sizga mos odamlar bilan bir davrada.',
        is_paid BOOLEAN DEFAULT FALSE,
        contact_email VARCHAR(255) DEFAULT '',
        contact_phone VARCHAR(50) DEFAULT '',
        telegram_url VARCHAR(255) DEFAULT '',
        instagram_url VARCHAR(255) DEFAULT '',
        youtube_url VARCHAR(255) DEFAULT '',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Audit logs
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(255),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

      -- Community messages (Networking Chat)
      CREATE TABLE IF NOT EXISTS community_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_community_messages_cid_created ON community_messages(community_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_community_messages_user ON community_messages(user_id);
    `;

    await query(sql);

    const defaultSettingsQuery = `
      INSERT INTO site_settings (id, site_name, description)
      VALUES (1, 'Davra', 'Sizga mos odamlar bilan bir davrada.')
      ON CONFLICT (id) DO NOTHING;
    `;
    await query(defaultSettingsQuery);

    console.log("Barcha jadvallar muvaffaqiyatli yaratildi va sozlandi.");
  } catch (error) {
    hasError = true;
    console.error("Migratsiyada xatolik yuz berdi:", error.message || error);
  } finally {
    await pool.end();
    process.exit(hasError ? 1 : 0);
  }
};

migrate();
