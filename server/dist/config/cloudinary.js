import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();
// ตั้งค่า Cloudinary (ดึงมาจาก .env)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// ตั้งค่าให้ Multer อัปโหลดไปเก็บที่ Cloudinary อัตโนมัติ
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'game-match-profiles', // ชื่อโฟลเดอร์ที่จะสร้างใน Cloudinary
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        };
    },
});
export const upload = multer({ storage: storage });
