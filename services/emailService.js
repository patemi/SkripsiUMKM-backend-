const nodemailer = require('nodemailer');

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

function getEmailConfig() {
  return {
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: parseBoolean(process.env.SMTP_SECURE),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromEmail: process.env.EMAIL_FROM || process.env.SMTP_USER,
    fromName: process.env.EMAIL_FROM_NAME || 'SoraUMKM',
  };
}

function isEmailConfigured() {
  const config = getEmailConfig();
  const hasService = !!config.service;
  const hasHost = !!config.host;
  return (hasService || hasHost) && !!config.user && !!config.pass && !!config.fromEmail;
}

function createTransporter() {
  const config = getEmailConfig();

  const transportOptions = {
    auth: {
      user: config.user,
      pass: config.pass,
    },
  };

  if (config.service) {
    transportOptions.service = config.service;
  } else {
    transportOptions.host = config.host;
    transportOptions.port = config.port;
    transportOptions.secure = config.secure;
  }

  return nodemailer.createTransport(transportOptions);
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const config = getEmailConfig();
  const transporter = createTransporter();

  const escapedName = name || 'Pengguna';

  await transporter.sendMail({
    from: `${config.fromName} <${config.fromEmail}>`,
    to,
    subject: 'Reset Password SoraUMKM',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 12px;">Halo ${escapedName},</h2>
        <p>Kami menerima permintaan reset password untuk akun SoraUMKM Anda.</p>
        <p>Silakan klik tombol di bawah ini untuk membuat password baru:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background:#2563eb;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">
            Reset Password
          </a>
        </p>
        <p>Atau salin link berikut ke browser Anda:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Link ini berlaku selama <strong>30 menit</strong>.</p>
        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
        <p style="color:#6b7280;font-size:12px;">Email ini dikirim otomatis oleh sistem SoraUMKM.</p>
      </div>
    `,
  });
}

async function sendEmailVerificationCode({ to, name, code }) {
  const config = getEmailConfig();
  const transporter = createTransporter();

  const escapedName = name || 'Pengguna';

  await transporter.sendMail({
    from: `${config.fromName} <${config.fromEmail}>`,
    to,
    subject: 'Kode Verifikasi Email SoraUMKM',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 12px;">Halo ${escapedName},</h2>
        <p>Terima kasih sudah mendaftar di SoraUMKM.</p>
        <p>Masukkan kode verifikasi berikut untuk mengaktifkan akun Anda:</p>
        <div style="margin: 20px 0; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #2563eb;">
          ${code}
        </div>
        <p>Kode ini berlaku selama <strong>15 menit</strong>.</p>
        <p>Jika Anda tidak melakukan pendaftaran, abaikan email ini.</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
        <p style="color:#6b7280;font-size:12px;">Email ini dikirim otomatis oleh sistem SoraUMKM.</p>
      </div>
    `,
  });
}

module.exports = {
  isEmailConfigured,
  sendPasswordResetEmail,
  sendEmailVerificationCode,
};
