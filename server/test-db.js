import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT 
        m.id as match_id,
        u.id as partner_id,
        p.display_name as partner_name,
        p.profile_images as partner_images,
        m.matched_at
      FROM matches m
      JOIN users u ON (u.id = m.user_one_id OR u.id = m.user_two_id)
      JOIN profiles p ON u.id = p.user_id
      WHERE m.is_active = true
      LIMIT 1
    `);
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
