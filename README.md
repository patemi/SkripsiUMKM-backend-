# UMKM Management System - Backend API

Backend API untuk sistem manajemen UMKM menggunakan Express.js dan MongoDB.

## 🚀 Teknologi

- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (JSON Web Token)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Validation**: express-validator

## 📁 Struktur Folder

```
backend/
├── config/
│   └── database.js          # Konfigurasi MongoDB
├── controllers/
│   ├── umkmController.js    # Controller UMKM
│   ├── adminController.js   # Controller Admin
│   ├── userController.js    # Controller User
│   └── activityLogController.js  # Controller Activity Log
├── middleware/
│   ├── auth.js             # Middleware autentikasi
│   └── upload.js           # Middleware upload file
├── models/
│   ├── Umkm.js            # Model UMKM
│   ├── Admin.js           # Model Admin
│   ├── User.js            # Model User
│   └── ActivityLog.js     # Model Activity Log
├── routes/
│   ├── umkmRoutes.js      # Routes UMKM
│   ├── adminRoutes.js     # Routes Admin
│   ├── userRoutes.js      # Routes User
│   └── activityLogRoutes.js  # Routes Activity Log
├── uploads/               # Folder upload foto
├── .env                   # Environment variables
├── .env.example          # Contoh environment variables
├── server.js             # Entry point aplikasi
└── package.json          # Dependencies
```

## ⚙️ Setup & Instalasi

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

Copy file `.env.example` menjadi `.env` dan sesuaikan:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/umkm_db
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Setup MongoDB

Pastikan MongoDB sudah terinstall dan berjalan di komputer Anda.

**Windows:**
```bash
# Start MongoDB service
net start MongoDB
```

Atau install MongoDB Community Server dari: https://www.mongodb.com/try/download/community

### 4. Buat Folder Uploads

```bash
mkdir uploads
```

### 5. Jalankan Server

**Development mode (dengan nodemon):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server akan berjalan di `http://localhost:5000`

## 📚 API Endpoints

### Authentication

#### Admin
- `POST /api/admin/register` - Register admin baru
- `POST /api/admin/login` - Login admin
- `GET /api/admin/profile` - Get profil admin (Auth)
- `GET /api/admin` - Get semua admin (Auth Admin)

#### User
- `POST /api/user/register` - Register user baru
- `POST /api/user/login` - Login user
- `GET /api/user/profile` - Get profil user (Auth)
- `GET /api/user` - Get semua user (Auth Admin)
- `GET /api/user/stats` - Get statistik user (Auth Admin)

### UMKM

- `GET /api/umkm` - Get semua UMKM (Public)
  - Query params: `?status=approved&kategori=Kuliner&search=keyword`
- `GET /api/umkm/top` - Get top UMKM by views (Public)
  - Query params: `?limit=5`
- `GET /api/umkm/:id` - Get detail UMKM (Public)
- `POST /api/umkm` - Create UMKM baru (Auth)
- `PUT /api/umkm/:id` - Update UMKM (Auth)
- `DELETE /api/umkm/:id` - Delete UMKM (Auth Admin)
- `POST /api/umkm/:id/verify` - Verifikasi UMKM (Auth Admin)
- `GET /api/umkm/stats/overview` - Get statistik UMKM (Auth Admin)

### Activity Logs

- `GET /api/activity-logs` - Get semua activity logs (Auth Admin)
- `GET /api/activity-logs/admin/:adminId` - Get logs by admin (Auth Admin)
- `GET /api/activity-logs/umkm/:umkmId` - Get logs by UMKM (Auth Admin)

## 🔐 Authentication

API menggunakan JWT untuk authentication. Setelah login, gunakan token di header:

```
Authorization: Bearer <your_token_here>
```

## 📝 Contoh Request

### Register Admin

```bash
POST http://localhost:5000/api/admin/register
Content-Type: application/json

{
  "nama_admin": "Admin Utama",
  "username_admin": "admin",
  "password_admin": "admin123",
  "role": "superadmin"
}
```

### Login Admin

```bash
POST http://localhost:5000/api/admin/login
Content-Type: application/json

{
  "username_admin": "admin",
  "password_admin": "admin123"
}
```

### Create UMKM

```bash
POST http://localhost:5000/api/umkm
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "nama_umkm": "Warung Makan Bu Siti",
  "kategori": "Kuliner",
  "deskripsi": "Warung makan dengan menu masakan rumahan",
  "pembayaran": ["Tunai", "QRIS"],
  "alamat": "Jl. Merdeka No. 123",
  "maps": "https://maps.google.com/...",
  "jam_operasional": {
    "senin": "08:00 - 20:00",
    "selasa": "08:00 - 20:00",
    "rabu": "08:00 - 20:00",
    "kamis": "08:00 - 20:00",
    "jumat": "08:00 - 20:00",
    "sabtu": "08:00 - 20:00",
    "minggu": "Tutup"
  },
  "kontak": {
    "telepon": "081234567890",
    "whatsapp": "081234567890",
    "email": "warungbusiti@email.com",
    "instagram": "@warungbusiti",
    "facebook": "Warung Bu Siti"
  },
  "foto_umkm": [File, File]  // Upload via form-data
}
```

### Verify UMKM

```bash
POST http://localhost:5000/api/umkm/:id/verify
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action": "approve",
  "reason": ""
}

// Atau untuk reject:
{
  "action": "reject",
  "reason": "Foto tidak jelas"
}
```

## 🗄️ Database Schema

### Collection: umkms
- id_umkm (ObjectId - auto)
- nama_umkm (String)
- foto_umkm (Array of Strings)
- kategori (String - enum)
- deskripsi (String)
- pembayaran (Array of Strings)
- alamat (String)
- maps (String)
- jam_operasional (Object)
- kontak (Object)
- status (String - enum: pending/approved/rejected)
- views (Number)
- user_id (ObjectId ref User)
- timestamps

### Collection: admins
- id_admin (ObjectId - auto)
- nama_admin (String)
- username_admin (String - unique)
- password_admin (String - hashed)
- role (String - enum: admin/superadmin)
- timestamps

### Collection: users
- id_user (ObjectId - auto)
- nama_user (String)
- email_user (String - unique)
- username (String - unique)
- password_user (String - hashed)
- timestamps

### Collection: activitylogs
- admin_id (ObjectId ref Admin)
- admin_name (String)
- umkm_id (ObjectId ref UMKM)
- umkm_nama (String)
- action (String - enum: approved/rejected)
- reason (String)
- timestamps

## 🔧 Fitur

✅ CRUD UMKM dengan upload foto (max 5 foto)
✅ Authentication & Authorization (JWT)
✅ Password hashing dengan bcryptjs
✅ Verifikasi UMKM oleh admin (approve/reject)
✅ Activity logs untuk tracking verifikasi
✅ Statistik UMKM per kategori
✅ Top UMKM berdasarkan views
✅ Search & filter UMKM
✅ File upload dengan Multer
✅ Error handling
✅ Input validation

## 🌐 Integrasi dengan Frontend

Update file `.env` di frontend Next.js:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Contoh fetch di frontend:

```javascript
// Fetch semua UMKM
const response = await fetch('http://localhost:5000/api/umkm?status=approved');
const data = await response.json();

// Login admin
const response = await fetch('http://localhost:5000/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username_admin: 'admin', password_admin: 'admin123' })
});
const data = await response.json();
localStorage.setItem('token', data.token);

// Create UMKM dengan token
const formData = new FormData();
formData.append('nama_umkm', 'Warung Makan');
// ... field lainnya
formData.append('foto_umkm', file1);
formData.append('foto_umkm', file2);

const response = await fetch('http://localhost:5000/api/umkm', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: formData
});
```

## 📦 Dependencies

- **express**: ^4.18.2 - Web framework
- **mongoose**: ^8.0.0 - MongoDB ODM
- **cors**: ^2.8.5 - CORS middleware
- **dotenv**: ^16.3.1 - Environment variables
- **bcryptjs**: ^2.4.3 - Password hashing
- **jsonwebtoken**: ^9.0.2 - JWT authentication
- **multer**: ^1.4.5 - File upload
- **express-validator**: ^7.0.1 - Input validation
- **nodemon**: ^3.0.1 - Development auto-reload

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solusi**: Pastikan MongoDB service berjalan. Windows: `net start MongoDB`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solusi**: Ubah PORT di `.env` atau kill process yang menggunakan port 5000

### Upload Folder Error
**Solusi**: Buat folder `uploads` di root backend: `mkdir uploads`

## 📄 License

ISC

## 👨‍💻 Author

UMKM Management System Backend API
