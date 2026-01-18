const XLSX = require('xlsx');
const UMKM = require('../models/Umkm');
const User = require('../models/User');

// @desc    Export UMKM data to Excel
// @route   GET /api/export/umkm
// @access  Admin only
exports.exportUMKMToExcel = async (req, res) => {
    try {
        const { status, kategori } = req.query;

        let query = {};
        if (status) query.status = status;
        if (kategori) query.kategori = kategori;

        const umkmList = await UMKM.find(query)
            .populate('user_id', 'nama_user email_user')
            .sort({ createdAt: -1 });

        // Transform data for Excel
        const data = umkmList.map((umkm, index) => ({
            'No': index + 1,
            'Nama UMKM': umkm.nama_umkm,
            'Kategori': umkm.kategori,
            'Deskripsi': umkm.deskripsi || '-',
            'Alamat': umkm.alamat || '-',
            'Kecamatan': umkm.kecamatan || '-',
            'No. Telepon': umkm.nomor_telepon || '-',
            'WhatsApp': umkm.whatsapp || '-',
            'Instagram': umkm.instagram || '-',
            'Status': umkm.status,
            'Views': umkm.views || 0,
            'Pemilik': umkm.user_id?.nama_user || '-',
            'Email Pemilik': umkm.user_id?.email_user || '-',
            'Tanggal Dibuat': new Date(umkm.createdAt).toLocaleDateString('id-ID'),
            'Tanggal Update': new Date(umkm.updatedAt).toLocaleDateString('id-ID')
        }));

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Set column widths
        const colWidths = [
            { wch: 5 },   // No
            { wch: 30 },  // Nama UMKM
            { wch: 15 },  // Kategori
            { wch: 50 },  // Deskripsi
            { wch: 40 },  // Alamat
            { wch: 15 },  // Kecamatan
            { wch: 15 },  // No. Telepon
            { wch: 15 },  // WhatsApp
            { wch: 20 },  // Instagram
            { wch: 10 },  // Status
            { wch: 8 },   // Views
            { wch: 20 },  // Pemilik
            { wch: 25 },  // Email Pemilik
            { wch: 15 },  // Tanggal Dibuat
            { wch: 15 }   // Tanggal Update
        ];
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data UMKM');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set response headers
        const filename = `data_umkm_${new Date().toISOString().slice(0, 10)}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.send(buffer);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal mengexport data',
            error: error.message
        });
    }
};

// @desc    Export Users data to Excel
// @route   GET /api/export/users
// @access  Admin only
exports.exportUsersToExcel = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        const data = users.map((user, index) => ({
            'No': index + 1,
            'Nama': user.nama_user,
            'Email': user.email_user,
            'Username': user.username || '-',
            'Auth Provider': user.authProvider || 'local',
            'Email Verified': user.isEmailVerified ? 'Ya' : 'Tidak',
            'Last Login': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('id-ID') : '-',
            'Tanggal Daftar': new Date(user.createdAt).toLocaleDateString('id-ID')
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        worksheet['!cols'] = [
            { wch: 5 },   // No
            { wch: 25 },  // Nama
            { wch: 30 },  // Email
            { wch: 20 },  // Username
            { wch: 12 },  // Auth Provider
            { wch: 15 },  // Email Verified
            { wch: 15 },  // Last Login
            { wch: 15 }   // Tanggal Daftar
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Users');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        const filename = `data_users_${new Date().toISOString().slice(0, 10)}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.send(buffer);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal mengexport data users',
            error: error.message
        });
    }
};
