import { Pool } from 'pg';
import dotenv from 'dotenv';

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
      
      client.release(); 
      
      break; 
    } catch (err: any) {
      retries -= 1
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
