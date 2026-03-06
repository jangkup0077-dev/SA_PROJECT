import { pool } from './config/db.js';

async function wipeData() {
    try {
        console.log('Connecting to the database via app pool...');
        // DELETE from users will cascade to profiles, swipes, matches, messages, user_game_interests
        const res = await pool.query('DELETE FROM users;');
        console.log(`Successfully wiped ${res.rowCount} users and all their related data (profiles, swipes, matches, chats).`);
    } catch (err) {
        console.error('Error wiping data:', err);
    } finally {
        process.exit(0);
    }
}

wipeData();
