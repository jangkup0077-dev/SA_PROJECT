import pg from 'pg';
import dotenv from 'dotenv';
import url from 'url';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
let poolConfig = {};

if (dbUrl) {
    const params = new URL(dbUrl);
    poolConfig = {
        user: params.username,
        password: params.password,
        host: params.hostname,
        port: params.port,
        database: params.pathname.split('/')[1]
    };
    // sometimes localhost auth fails vs 127.0.0.1
    if (poolConfig.host === 'localhost') {
        poolConfig.host = '127.0.0.1';
    }
}

const pool = new pg.Pool(poolConfig);

async function wipeData() {
    try {
        console.log('Connecting to the database at', poolConfig.host, poolConfig.database);

        // DELETE from users will cascade to profiles, swipes, matches, messages, user_game_interests
        // but we want to keep admin maybe? Actually, let's just wipe all
        const res = await pool.query('DELETE FROM users;');

        console.log(`Successfully wiped ${res.rowCount} users and all their related data (profiles, swipes, matches, chats).`);
    } catch (err) {
        console.error('Error wiping data:', err);
    } finally {
        await pool.end();
    }
}

wipeData();
