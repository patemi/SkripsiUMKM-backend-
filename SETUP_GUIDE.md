# Panduan Lengkap Setup Backend UMKM

## 📋 Prerequisites

Sebelum memulai, pastikan sudah terinstall:
- Node.js (v14 atau lebih baru)
- MongoDB (v4.4 atau lebih baru)
- Git (optional)

---

## 🔧 Instalasi MongoDB di Windows

### Opsi 1: MongoDB Community Server (Recommended)

1. **Download MongoDB**
   - Kunjungi: https://www.mongodb.com/try/download/community
   - Pilih versi: Windows x64
   - Download file MSI installer

2. **Install MongoDB**
   - Jalankan file installer yang sudah didownload
   - Pilih "Complete" installation
   - Centang "Install MongoDB as a Service"
   - Centang "Install MongoDB Compass" (GUI tool)
   - Klik Install

3. **Verifikasi Instalasi**
   ```bash
   # Buka Command Prompt dan jalankan:
   mongod --version
   ```

4. **Start MongoDB Service**
   ```bash
   # Jalankan sebagai administrator:
   net start MongoDB
   ```

5. **Stop MongoDB Service** (jika diperlukan)
   ```bash
   net stop MongoDB
   ```

### Opsi 2: MongoDB Atlas (Cloud - Gratis)

Jika tidak ingin install lokal, bisa gunakan MongoDB Atlas:

1. Daftar di: https://www.mongodb.com/cloud/atlas/register
2. Buat cluster gratis (M0 Sandbox)
3. Setup Database Access (username & password)
4. Setup Network Access (Allow access from anywhere: 0.0.0.0/0)
5. Get connection string dari "Connect" > "Connect your application"
6. Update MONGODB_URI di `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/umkm_db?retryWrites=true&w=majority
   ```

---

## 🚀 Setup Backend

### 1. Install Dependencies

```bash
cd backend
npm install
```

Output yang diharapkan:
```
added 100+ packages in 30s
```

### 2. Setup Environment Variables

File `.env` sudah dibuat dengan konfigurasi default. Jika ingin mengubah:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/umkm_db
JWT_SECRET=umkm_secret_key_2024_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

**Catatan Penting:**
- Untuk production, ganti `JWT_SECRET` dengan string random yang kuat
- Jika pakai MongoDB Atlas, ganti `MONGODB_URI` dengan connection string Atlas

### 3. Jalankan Seeder (Data Awal)

```bash
npm run seed
```

Output yang diharapkan:
```
MongoDB Connected: localhost
Menghapus data lama...
Membuat admin...
✓ Admin berhasil dibuat
Membuat users...
✓ Users berhasil dibuat
Membuat UMKM...
✓ UMKM berhasil dibuat

=================================
Seeding berhasil!
=================================

Data Login:
Admin:
  Username: admin
  Password: admin123

User 1:
  Username: budi
  Password: user123

User 2:
  Username: siti
  Password: user123
=================================
```

### 4. Jalankan Server

**Development mode (dengan auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Output yang diharapkan:
```
Server berjalan di port 5000
Environment: development
MongoDB Connected: localhost
```

### 5. Test API

Buka browser atau Postman dan akses:
```
http://localhost:5000
```

Response yang diharapkan:
```json
{
  "success": true,
  "message": "API UMKM Management System",
  "version": "1.0.0",
  "endpoints": {
    "umkm": "/api/umkm",
    "admin": "/api/admin",
    "user": "/api/user",
    "activityLogs": "/api/activity-logs"
  }
}
```

---

## 🧪 Testing API dengan Postman/Thunder Client

### 1. Install Postman
- Download dari: https://www.postman.com/downloads/
- Atau gunakan VS Code extension: Thunder Client

### 2. Test Login Admin

**Request:**
```
POST http://localhost:5000/api/admin/login
Content-Type: application/json

Body:
{
  "username_admin": "admin",
  "password_admin": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "id": "...",
    "nama_admin": "Admin Utama",
    "username_admin": "admin",
    "role": "superadmin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Copy token** untuk digunakan di request selanjutnya!

### 3. Test Get All UMKM

**Request:**
```
GET http://localhost:5000/api/umkm?status=approved
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [...]
}
```

### 4. Test Verify UMKM (butuh token admin)

**Request:**
```
POST http://localhost:5000/api/umkm/{id}/verify
Authorization: Bearer {paste_token_disini}
Content-Type: application/json

Body:
{
  "action": "approve",
  "reason": ""
}
```

---

## 🗂️ Struktur Database MongoDB

Setelah seeding, database akan memiliki 4 collections:

### 1. admins
```javascript
{
  "_id": ObjectId("..."),
  "nama_admin": "Admin Utama",
  "username_admin": "admin",
  "password_admin": "$2a$10$...", // hashed
  "role": "superadmin",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### 2. users
```javascript
{
  "_id": ObjectId("..."),
  "nama_user": "Budi Santoso",
  "email_user": "budi@example.com",
  "username": "budi",
  "password_user": "$2a$10$...", // hashed
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### 3. umkms
```javascript
{
  "_id": ObjectId("..."),
  "nama_umkm": "Warung Makan Bu Siti",
  "foto_umkm": [],
  "kategori": "Kuliner",
  "deskripsi": "...",
  "pembayaran": ["Tunai", "QRIS"],
  "alamat": "...",
  "maps": "...",
  "jam_operasional": {
    "senin": "08:00 - 20:00",
    ...
  },
  "kontak": {
    "telepon": "081234567890",
    ...
  },
  "status": "approved",
  "views": 156,
  "user_id": ObjectId("..."),
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### 4. activitylogs
```javascript
{
  "_id": ObjectId("..."),
  "admin_id": ObjectId("..."),
  "admin_name": "Admin Utama",
  "umkm_id": ObjectId("..."),
  "umkm_nama": "Warung Makan Bu Siti",
  "action": "approved",
  "reason": "",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

---

## 🔍 Melihat Data di MongoDB

### Menggunakan MongoDB Compass (GUI)

1. Buka MongoDB Compass
2. Connect ke: `mongodb://localhost:27017`
3. Pilih database: `umkm_db`
4. Browse collections: admins, users, umkms, activitylogs

### Menggunakan MongoDB Shell

```bash
# Buka MongoDB Shell
mongosh

# Gunakan database
use umkm_db

# Lihat collections
show collections

# Lihat data admins
db.admins.find().pretty()

# Lihat data UMKM
db.umkms.find().pretty()

# Lihat data users
db.users.find().pretty()

# Count documents
db.umkms.countDocuments()
```

---

## 🔄 Reset Database (Jalankan Seeder Ulang)

Jika ingin reset semua data ke kondisi awal:

```bash
npm run seed
```

Ini akan:
1. Hapus semua data lama
2. Buat ulang admin, users, dan UMKM
3. Reset ke kondisi awal

---

## 🐛 Troubleshooting

### Error: MongoDB not running

```
MongoServerError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solusi:**
```bash
# Windows (run as administrator)
net start MongoDB

# Atau restart MongoDB service dari Services (services.msc)
```

### Error: Port 5000 already in use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solusi:**
```bash
# Cari process yang menggunakan port 5000
netstat -ano | findstr :5000

# Kill process (ganti PID dengan nomor yang muncul)
taskkill /PID {PID} /F

# Atau ubah PORT di .env
PORT=5001
```

### Error: Cannot find module

```
Error: Cannot find module 'express'
```

**Solusi:**
```bash
# Install ulang dependencies
npm install
```

### Error: Invalid connection string

**Solusi:**
- Periksa MONGODB_URI di `.env`
- Pastikan tidak ada spasi atau karakter aneh
- Untuk MongoDB Atlas, pastikan username/password benar

---

## ✅ Checklist Setup

- [ ] Node.js terinstall (`node --version`)
- [ ] MongoDB terinstall atau setup MongoDB Atlas
- [ ] MongoDB service berjalan (`net start MongoDB` atau Atlas cluster aktif)
- [ ] Clone/download backend folder
- [ ] `npm install` berhasil
- [ ] File `.env` sudah ada dan terisi
- [ ] `npm run seed` berhasil
- [ ] `npm run dev` berjalan
- [ ] Browser bisa akses http://localhost:5000
- [ ] Test login admin berhasil
- [ ] MongoDB Compass bisa connect (optional)

---

## 📚 Next Steps

Setelah backend berjalan:

1. **Test semua endpoint** dengan Postman/Thunder Client
2. **Integrasi dengan frontend** Next.js
3. **Update frontend** untuk fetch dari API backend
4. **Deploy** (optional):
   - Backend: Heroku, Railway, Render
   - Database: MongoDB Atlas

---

## 🆘 Butuh Bantuan?

Jika mengalami masalah:
1. Cek error message di terminal
2. Periksa MongoDB service status
3. Pastikan semua dependencies terinstall
4. Coba jalankan `npm run seed` ulang

Dokumentasi lengkap ada di `backend/README.md`
