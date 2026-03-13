-- ==========================================
-- Game Match Database Schema
-- ==========================================

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
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. สร้างตาราง Profiles
CREATE TABLE IF NOT EXISTS profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    bio TEXT,
    birth_date DATE,
    country VARCHAR(50),
    profile_image_url TEXT[] DEFAULT '{}',
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
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    game_id INT REFERENCES games(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, game_id)
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
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unmatched_at TIMESTAMP
);

-- 7. สร้างตาราง Messages (ระบบแชท)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) DEFAULT 'TEXT',
    message_content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- 8. สร้างตาราง User Bans
CREATE TABLE IF NOT EXISTS user_bans (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    admin_id INT REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- 9. สร้างตาราง Reports
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_id INT REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(255),
    report_type VARCHAR(50) NOT NULL,
	images TEXT[] DEFAULT '{}',
    description TEXT,
    media_url TEXT,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED', 'DISMISSED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- 10. สร้างตาราง Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entity_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);

-- 11. สร้างตาราง Admin Logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_id INT,
    reason TEXT,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- Insert Mock Data
-- ==========================================

-- Insert Games
INSERT INTO games (game_name, game_icon_url) VALUES 
('Arena of Valor (ROV)', 'https://ui-avatars.com/api/?name=ROV&background=random'),
('Valorant', 'https://ui-avatars.com/api/?name=Valorant&background=random'),
('Genshin Impact', 'https://ui-avatars.com/api/?name=Genshin&background=random'),
('Fortnite', 'https://ui-avatars.com/api/?name=Fortnite&background=random'),
('PUBG Mobile', 'https://ui-avatars.com/api/?name=PUBG&background=random'),
('Free Fire', 'https://ui-avatars.com/api/?name=Free_Fire&background=random'),
('Call of Duty: Mobile', 'https://ui-avatars.com/api/?name=CODM&background=random'),
('Minecraft', 'https://ui-avatars.com/api/?name=Minecraft&background=random'),
('Roblox', 'https://ui-avatars.com/api/?name=Roblox&background=random'),
('League of Legends', 'https://ui-avatars.com/api/?name=LOL&background=random'),
('League of Legends: Wild Rift', 'https://ui-avatars.com/api/?name=Wild_Rift&background=random'),
('Mobile Legends: Bang Bang', 'https://ui-avatars.com/api/?name=MLBB&background=random'),
('Honor of Kings', 'https://ui-avatars.com/api/?name=HOK&background=random'),
('Dota 2', 'https://ui-avatars.com/api/?name=Dota2&background=random'),
('Counter-Strike 2', 'https://ui-avatars.com/api/?name=CS2&background=random'),
('Apex Legends', 'https://ui-avatars.com/api/?name=Apex&background=random'),
('Among Us', 'https://ui-avatars.com/api/?name=Among_Us&background=random'),
('Clash of Clans', 'https://ui-avatars.com/api/?name=COC&background=random'),
('Clash Royale', 'https://ui-avatars.com/api/?name=CR&background=random'),
('Brawl Stars', 'https://ui-avatars.com/api/?name=Brawl&background=random'),
('Stumble Guys', 'https://ui-avatars.com/api/?name=Stumble&background=random'),
('Fall Guys', 'https://ui-avatars.com/api/?name=Fall_Guys&background=random'),
('Rocket League', 'https://ui-avatars.com/api/?name=RL&background=random'),
('Warframe', 'https://ui-avatars.com/api/?name=Warframe&background=random'),
('Destiny 2', 'https://ui-avatars.com/api/?name=Destiny2&background=random'),
('World of Warcraft', 'https://ui-avatars.com/api/?name=WOW&background=random'),
('Final Fantasy XIV', 'https://ui-avatars.com/api/?name=FFXIV&background=random'),
('Albion Online', 'https://ui-avatars.com/api/?name=Albion&background=random'),
('Black Desert Online', 'https://ui-avatars.com/api/?name=BDO&background=random'),
('Tower of Fantasy', 'https://ui-avatars.com/api/?name=TOF&background=random'),
('Lost Ark', 'https://ui-avatars.com/api/?name=Lost_Ark&background=random'),
('ARK: Survival Evolved', 'https://ui-avatars.com/api/?name=ARK&background=random'),
('Rust', 'https://ui-avatars.com/api/?name=Rust&background=random'),
('DayZ', 'https://ui-avatars.com/api/?name=DayZ&background=random'),
('Terraria', 'https://example.com/terraria.png'),
('Don''t Starve Together', 'https://example.com/dont_starve_together.png'),
('Sea of Thieves', 'https://example.com/sea_of_thieves.png'),
('Phasmophobia', 'https://ui-avatars.com/api/?name=Phasmo&background=random'),
('Dead by Daylight', 'https://ui-avatars.com/api/?name=DBD&background=random'),
('War Thunder', 'https://ui-avatars.com/api/?name=WT&background=random'),
('World of Tanks Blitz', 'https://ui-avatars.com/api/?name=WOTB&background=random'),
('Asphalt 9: Legends', 'https://ui-avatars.com/api/?name=Asphalt9&background=random'),
('Trackmania', 'https://ui-avatars.com/api/?name=TM&background=random'),
('The Battle of Polytopia', 'https://ui-avatars.com/api/?name=Polytopia&background=random'),
('Dota Underlords', 'https://ui-avatars.com/api/?name=Underlords&background=random'),
('Teamfight Tactics', 'https://ui-avatars.com/api/?name=TFT&background=random'),
('Ludo King', 'https://ui-avatars.com/api/?name=Ludo&background=random'),
('Standoff 2', 'https://ui-avatars.com/api/?name=Standoff2&background=random'),
('Critical Ops', 'https://ui-avatars.com/api/?name=COPS&background=random'),
('Delta Force', 'https://ui-avatars.com/api/?name=Delta&background=random'),
('Destiny: Rising', 'https://ui-avatars.com/api/?name=DR&background=random')
ON CONFLICT DO NOTHING;

-- Insert Users
INSERT INTO users (id, name, email, password, is_admin, last_active_at, created_at, updated_at) VALUES
(1, 'Example1', 'example1@gmail.com', '$2b$10$JBEx3Q1TdfbmLO22iuI9dOBJqkHIpLrzXX0Tj.b.etV.ZOjSXbIx.', FALSE, '2026-03-11 10:43:26.478294', '2026-03-11 10:43:26.478294', '2026-03-11 10:43:26.478294'),
(2, 'Example2', 'example2@gmail.com', '$2b$10$vbjOEV7/s6eMYYwUxrjOwulRIqnNBXKnJPrt9S5LMrBqM9g4q34Uy', FALSE, '2026-03-11 10:54:49.992932', '2026-03-11 10:54:49.992932', '2026-03-11 10:54:49.992932');

-- Reset the sequence for users id
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Insert Profiles
INSERT INTO profiles (user_id, display_name, bio, birth_date, country, profile_image_url, updated_at) VALUES
(
1,
'Example1',
'EXAMPLE 1',
'2004-01-04',
'Thailand',
ARRAY[
'https://res.cloudinary.com/dmapbnek4/image/upload/v1773225811/game-match-profiles/g8jp0pjzxkg9zqhwaopq.png',
'https://res.cloudinary.com/dmapbnek4/image/upload/v1773225815/game-match-profiles/gplhvtgyvdnlhc8gnkih.png',
'https://res.cloudinary.com/dmapbnek4/image/upload/v1773225821/game-match-profiles/x0fehplqwmr5il9st9iy.png',
'https://res.cloudinary.com/dmapbnek4/image/upload/v1773225828/game-match-profiles/e23g9oc3nl2kzwtq2hzq.png'
],
'2026-03-11 10:52:02.205843'
),
(
2,
'Example2',
'EXAMPLE2',
'2000-01-04',
'Thailand',
ARRAY[
'https://res.cloudinary.com/dmapbnek4/image/upload/v1773226491/game-match-profiles/oegzedaxp9iveocetxgm.png',
'https://res.cloudinary.com/dmapbnek4/image/upload/v1773226492/game-match-profiles/grchlqwduwalkiwgsnae.png',
'https://res.cloudinary.com/dmapbnek4/image/upload/v1773226493/game-match-profiles/vhpiofgxtlhhphdbk7sm.png',
'https://res.cloudinary.com/dmapbnek4/image/upload/v1773226494/game-match-profiles/danpbqigwzrrxao49enj.png'
],
'2026-03-11 10:54:55.243212'
);

-- Insert User Game Interests
INSERT INTO user_game_interests (user_id, game_id) VALUES
(1,1),
(1,3),
(2,1),
(2,2);