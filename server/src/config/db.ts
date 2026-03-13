import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const connectDB = async (retries = 5) => {
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log('✅ Database Connected Successfully');
      
      try {
        const check = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'users'
          );
        `);
        
        if (!check.rows[0].exists) {
          console.log('📦 Database is empty! Auto-running init.sql...');
          
          const sqlPath = path.join(process.cwd(), 'src/init.sql');
          const sql = fs.readFileSync(sqlPath, 'utf8');
          await client.query(sql);
          
          console.log('🎉 Database tables & mock data created successfully!');
        } else {
          console.log('⚡ Database is already initialized.');
        }
      } catch (initErr: any) {
        console.error('❌ Auto Init DB Failed:', initErr.message);
      }

      client.release(); // คืนการเชื่อมต่อ
      break; 
    } catch (err: any) {
      retries -= 1;
      console.error(`❌ Database Connection Failed: ${err.message}`);
      console.error(`Retrying in 3 seconds... (Retries left: ${retries})`);
      
      if (retries === 0) {
        console.error('🚨 Could not connect to database after multiple attempts. Exiting...');
        process.exit(1); 
      }
      
      await new Promise(res => setTimeout(res, 3000));
    }
  }
};
