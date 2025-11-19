# Quick Start - UMKM Backend

## 🚀 Cara Cepat Menjalankan Backend

### 1. Install MongoDB
Pastikan MongoDB sudah terinstall dan berjalan:
```bash
# Windows (run as administrator)
net start MongoDB
```

Jika belum install, lihat panduan lengkap di `SETUP_GUIDE.md`

### 2. Jalankan Seeder (Data Awal)
```bash
npm run seed
```

### 3. Jalankan Server
```bash
npm run dev
```

Server berjalan di: `http://localhost:5000`

## 📌 Data Login Default

**Admin:**
- Username: `admin`
- Password: `admin123`

**User 1:**
- Username: `budi`
- Password: `user123`

**User 2:**
- Username: `siti`
- Password: `user123`

## 🧪 Test API

### Login Admin
```bash
POST http://localhost:5000/api/admin/login
Content-Type: application/json

{
  "username_admin": "admin",
  "password_admin": "admin123"
}
```

### Get All UMKM
```bash
GET http://localhost:5000/api/umkm?status=approved
```

### Get Top UMKM
```bash
GET http://localhost:5000/api/umkm/top?limit=5
```

## 📚 Dokumentasi Lengkap

- **Panduan Setup MongoDB**: `SETUP_GUIDE.md`
- **API Documentation**: `README.md`
- **Collections Schema**: Lihat di `README.md`

## ⚙️ Commands

```bash
npm start      # Production mode
npm run dev    # Development mode (dengan nodemon)
npm run seed   # Reset & isi data awal
```

## 🔗 Endpoints Utama

- `/api/umkm` - CRUD UMKM
- `/api/admin` - Authentication admin
- `/api/user` - Authentication user
- `/api/activity-logs` - Logs verifikasi

---

**Butuh bantuan?** Baca `SETUP_GUIDE.md` untuk troubleshooting lengkap!
