# Test Growth API Endpoint

## Cara Test Growth Endpoint

### 1. Test dengan Browser/Postman

**Login dulu untuk mendapatkan token:**
```
POST http://localhost:5000/api/admin/login
Content-Type: application/json

{
  "username_admin": "admin",
  "password_admin": "admin123"
}

Response:
{
  "success": true,
  "token": "eyJhbGc..."  // Copy token ini
}
```

**Test Growth Endpoint:**
```
GET http://localhost:5000/api/growth
Authorization: Bearer <paste_token_disini>

Expected Response:
{
  "success": true,
  "count": 1,
  "data": [
    {
      "month": "November 2025",
      "umkm": 3,
      "users": 2
    }
  ]
}
```

---

### 2. Cek Data di MongoDB

```bash
# Buka mongosh
mongosh

# Gunakan database
use umkm_db

# Cek UMKM
db.umkms.find({ status: "approved" })

# Cek Users
db.users.find()

# Cek count
db.umkms.countDocuments({ status: "approved" })
db.users.countDocuments()
```

---

### 3. Jika Data Kosong, Jalankan Seeder

```bash
cd backend
npm run seed
```

Output:
```
MongoDB Connected: localhost
Menghapus data lama...
Membuat admin...
✓ Admin berhasil dibuat
Membuat users...
✓ Users berhasil dibuat
Membuat UMKM...
✓ UMKM berhasil dibuat
```

---

### 4. Test di Frontend

1. Buka: `http://localhost:3000/login`
2. Login dengan: `admin` / `admin123`
3. Buka: `http://localhost:3000/admin/analytics`
4. **F12 → Console** untuk lihat logs:
   - "Fetching growth data from: http://localhost:5000/api/growth"
   - "Growth data response: {...}"

---

## Troubleshooting

### Grafik tidak muncul?

**Cek Console Browser (F12):**
```javascript
// Error: "Token tidak ditemukan"
→ Login ulang

// Error: "Failed to fetch"
→ Backend tidak running, jalankan: npm run dev

// Error: "Belum ada data pertumbuhan"
→ Jalankan seeder: npm run seed

// Success tapi grafik kosong
→ Data ada tapi tidak ter-render, refresh halaman
```

---

### Backend Error?

```bash
# Cek backend logs
cd backend
npm run dev

# Harus muncul:
Server berjalan di port 5000
MongoDB Connected: localhost
```

---

### MongoDB Not Connected?

```bash
# Windows (run as admin)
net start MongoDB

# Check connection
mongosh
> show dbs
> use umkm_db
> db.stats()
```

---

## Data Format Expected

```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "month": "Januari 2025",
      "umkm": 1,
      "users": 1
    },
    {
      "month": "Februari 2025",
      "umkm": 2,
      "users": 2
    },
    {
      "month": "November 2025",
      "umkm": 5,
      "users": 3
    }
  ]
}
```

Chart akan render data ini menjadi:
- **X-axis**: month (Januari 2025, Februari 2025, ...)
- **Y-axis**: umkm & users (cumulative count)
- **Line Chart**: Smooth curve showing growth
- **Bar Chart**: Bars comparing UMKM vs Users

---

## Quick Fix Commands

```bash
# Reset everything
cd backend
npm run seed

# Restart backend
npm run dev

# Restart frontend (di terminal lain)
cd ../web_umkm
npm run dev
```

Setelah itu:
1. Login: http://localhost:3000/login
2. Dashboard: http://localhost:3000/admin
3. Analytics: http://localhost:3000/admin/analytics
4. Refresh (F5) jika perlu

✅ Grafik harus muncul!
