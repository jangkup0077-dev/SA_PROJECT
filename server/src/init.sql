-- 1. สร้างตาราง Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    suspension_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. สร้างตาราง Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE, 
    display_name VARCHAR(100),
    bio TEXT,
    country VARCHAR(50),
    age INT,
    profile_images TEXT[] DEFAULT '{}', -- เก็บ URL ของรูปได้หลายอันเป็น Array
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. สร้างตาราง Games
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    game_name VARCHAR(100) NOT NULL,
    game_icon_url VARCHAR(255)
);

-- 4. สร้างตาราง User Game Interests
CREATE TABLE IF NOT EXISTS user_game_interests (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    game_id INT REFERENCES games(id) ON DELETE CASCADE
);

-- 5. สร้างตาราง Swipes
CREATE TABLE IF NOT EXISTS swipes (
    id SERIAL PRIMARY KEY,
    requester_id INT REFERENCES users(id) ON DELETE CASCADE,
    target_id INT REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(10) CHECK (status IN ('LIKE', 'SKIP')), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. สร้างตาราง Matches
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    user_one_id INT REFERENCES users(id) ON DELETE CASCADE,
    user_two_id INT REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. สร้างตาราง Message (ระบบแชท)
CREATE TABLE IF NOT EXISTS message (
    id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    message_content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. สร้างตาราง Admin Logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INT REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- เช่น delete_profile, banned_user
    target_id INT, -- เก็บ id ของคนที่โดนแบน หรือเกมที่ถูกเพิ่ม
    reason TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. สร้างตาราง Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- MATCH_CREATED, NEW_MESSAGE, PROFILE_LIKED, REPORT_UPDATE, ACCOUNT_SUSPENDED
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entity_id INT, -- ID ของสิ่งที่เกี่ยวข้อง (เช่น match_id, user_id, message_id)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);

-- 10. สร้างตาราง Reports
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_id INT REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, REVIEWING, RESOLVED, REJECTED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- ==========================================
-- Schema Migration for existing tables
-- ==========================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_until TIMESTAMP;
ALTER TABLE admin_logs ADD COLUMN IF NOT EXISTS reason TEXT;

-- ==========================================
-- Insert Mock Data (ข้อมูลตั้งต้นให้เทสได้เลย)
-- ==========================================
 INSERT INTO games (game_name, game_icon_url) VALUES 
 ('ROV', 'https://example.com/rov.png'),
 ('Valorant', 'https://example.com/valorant.png'),
 ('Genshin Impact', 'https://example.com/genshin.png');

-- สร้าง Admin User (รหัสผ่านคือ password123 ที่ผ่านการ hash แล้ว)
-- ใส่ไว้เพื่อให้เพื่อนที่ทำหน้า Admin มีไอดีเข้าใช้งานได้เลย
-- INSERT INTO users (name, email, password, is_admin) VALUES 
-- ('Admin', 'admin@gamematch.com', '$2b$10$wTfA9DIfp.v83H5R9A0pU.Hh9jV.b1J0Q0XyZ1.o/oBv1lU1r.6yq', TRUE);