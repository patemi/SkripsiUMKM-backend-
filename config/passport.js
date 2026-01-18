const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// Konfigurasi Google OAuth Strategy - hanya jika credentials tersedia
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('✅ Google OAuth configured');
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/user/auth/google/callback',
        scope: ['profile', 'email']
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Cek apakah user dengan Google ID sudah ada
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    // User sudah ada, update lastLogin
                    user.lastLogin = new Date();
                    user.lastActivity = new Date();
                    await user.save();
                    return done(null, user);
                }

                // Cek apakah email sudah terdaftar
                const existingUserByEmail = await User.findOne({
                    email_user: profile.emails[0].value
                });

                if (existingUserByEmail) {
                    // Email sudah terdaftar, link dengan Google account
                    existingUserByEmail.googleId = profile.id;
                    existingUserByEmail.isEmailVerified = true;
                    existingUserByEmail.profilePicture = profile.photos[0]?.value || '';
                    existingUserByEmail.lastLogin = new Date();
                    existingUserByEmail.lastActivity = new Date();
                    await existingUserByEmail.save();
                    return done(null, existingUserByEmail);
                }

                // Buat user baru
                user = await User.create({
                    nama_user: profile.displayName,
                    email_user: profile.emails[0].value,
                    googleId: profile.id,
                    authProvider: 'google',
                    isEmailVerified: true, // Email dari Google sudah verified
                    profilePicture: profile.photos[0]?.value || '',
                    lastLogin: new Date(),
                    lastActivity: new Date()
                });

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    ));
} else {
    console.log('⚠️ Google OAuth not configured - GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing');
}

// Serialize user untuk session
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user dari session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;

