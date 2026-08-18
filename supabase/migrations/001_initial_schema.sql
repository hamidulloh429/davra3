-- Migration 001: Initial Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(20) UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT DEFAULT '',
    location TEXT DEFAULT '',
    website TEXT DEFAULT '',
    social_links JSONB DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    blocked_by UUID REFERENCES profiles(id),
    blocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. user_settings
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public','members','private')),
    show_email BOOLEAN DEFAULT FALSE,
    allow_messages BOOLEAN DEFAULT TRUE,
    allow_mentions BOOLEAN DEFAULT TRUE,
    notify_new_message BOOLEAN DEFAULT TRUE,
    notify_mention BOOLEAN DEFAULT TRUE,
    notify_circle_activity BOOLEAN DEFAULT TRUE,
    notify_system BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, slug, sort_order) VALUES 
('Texnologiya', 'texnologiya', 1),
('San''at', 'sanat', 2),
('Sport', 'sport', 3),
('Ta''lim', 'talim', 4),
('Biznes', 'biznes', 5),
('Sog''liq', 'sogliq', 6),
('Sayohat', 'sayohat', 7),
('Musiqa', 'musiqa', 8),
('Ijtimoiy', 'ijtimoiy', 9),
('Boshqa', 'boshqa', 10);

-- 4. circles
CREATE TABLE circles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    cover_image TEXT DEFAULT '',
    icon_url TEXT DEFAULT '',
    category_id UUID REFERENCES categories(id),
    creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    privacy_type VARCHAR(20) DEFAULT 'public' CHECK (privacy_type IN ('public','private','invite_only')),
    rules JSONB DEFAULT '[]',
    is_archived BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_circles_category ON circles(category_id);
CREATE INDEX idx_circles_creator ON circles(creator_id);

-- 5. circle_members
CREATE TABLE circle_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner','moderator','member')),
    is_muted BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(circle_id, user_id)
);

CREATE INDEX idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX idx_circle_members_user ON circle_members(user_id);

-- 6. messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text','image','video','file')),
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_circle_created ON messages(circle_id, created_at DESC);
CREATE INDEX idx_messages_user ON messages(user_id);

-- 7. message_reactions
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);

-- 8. message_attachments
CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    original_name TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    duration REAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);

-- 9. notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    body TEXT DEFAULT '',
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, is_read, created_at DESC);

-- 10. reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    target_type VARCHAR(20) NOT NULL,
    target_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','rejected')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_reporter ON reports(reporter_id);

-- 11. admins
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_email TEXT NOT NULL UNIQUE,
    google_id TEXT UNIQUE,
    name TEXT DEFAULT '',
    login TEXT UNIQUE,
    password_hash TEXT,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin','admin','moderator')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ
);

INSERT INTO admins (google_email, role) VALUES ('hamidulloh429@gmail.com', 'super_admin');

-- 12. admin_sessions
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_admin_sessions_admin ON admin_sessions(admin_id);

-- 13. audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- 14. site_settings
CREATE TABLE site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_name TEXT DEFAULT 'Davra',
    description TEXT DEFAULT 'Sizga mos odamlar bilan bir davrada.',
    logo_url TEXT DEFAULT '',
    favicon_url TEXT DEFAULT '',
    primary_color TEXT DEFAULT '#123CCF',
    accent_color TEXT DEFAULT '#B7FF00',
    hero_title TEXT DEFAULT 'YOUR COMMUNITY. YOUR DAVRA.',
    hero_subtitle TEXT DEFAULT 'Qiziqishlaringizga mos davralarni toping, yangi insonlar bilan tanishing.',
    contact_email TEXT DEFAULT '',
    telegram_url TEXT DEFAULT '',
    instagram_url TEXT DEFAULT '',
    footer_text TEXT DEFAULT '',
    terms_url TEXT DEFAULT '',
    privacy_url TEXT DEFAULT '',
    support_url TEXT DEFAULT '',
    registration_enabled BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    max_image_size INTEGER DEFAULT 10485760,
    max_video_size INTEGER DEFAULT 104857600,
    max_message_length INTEGER DEFAULT 2000,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (id) VALUES (1);

-- 15. invitations
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    invitee_email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_invitations_circle ON invitations(circle_id);
CREATE INDEX idx_invitations_inviter ON invitations(inviter_id);

-- 16. join_requests
CREATE TABLE join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    reviewed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    UNIQUE(circle_id, user_id)
);

CREATE INDEX idx_join_requests_circle ON join_requests(circle_id);
CREATE INDEX idx_join_requests_user ON join_requests(user_id);
