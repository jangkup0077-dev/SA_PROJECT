import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ฟังก์ชันสำหรับ Test Connection แบบมี Retry
export const connectDB = async (retries = 5) => {
  while (retries > 0) {
    try {
      await pool.connect();
      console.log('✅ Database Connected Successfully');

      // Create Admin Setup
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      const adminName = process.env.ADMIN_NAME;

      if (adminEmail && adminPassword && adminName) {
        const checkAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
        if (checkAdmin.rowCount === 0) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(adminPassword, salt);
          await pool.query(
            'INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, $4)',
            [adminName, adminEmail, hashedPassword, true]
          );
          console.log(`✅ Default Admin user created: ${adminEmail}`);
        }
      }

      break; // สำเร็จแล้ว ให้ออกจาก Loop
    } catch (err) {
      retries -= 1;
      console.error(`❌ Database Connection Failed. Retrying in 3 seconds... (Retries left: ${retries})`);
      
      if (retries === 0) {
        console.error('🚨 Could not connect to database after multiple attempts. Exiting...');
        process.exit(1); // ถ้าลองครบ 5 รอบยังไม่ได้ ค่อยให้โปรแกรมปิดตัวเอง
      }
      
      // รอ 3 วินาทีก่อนลองเชื่อมต่อใหม่
      await new Promise(res => setTimeout(res, 3000));
    }
  }
};