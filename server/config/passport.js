const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { query } = require('../db');

let isGoogleConfigured = false;

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  isGoogleConfigured = true;

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const fullName = profile.displayName || 'Foydalanuvchi';
          const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

          const upsertQuery = `
            INSERT INTO users (google_id, email, full_name, avatar_url, last_login_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (google_id)
            DO UPDATE SET
              full_name = EXCLUDED.full_name,
              avatar_url = EXCLUDED.avatar_url,
              last_login_at = NOW()
            RETURNING *;
          `;

          const result = await query(upsertQuery, [profile.id, email, fullName, avatarUrl]);
          const user = result.rows[0];

          if (user.is_blocked) {
            return done(null, false, { message: 'blocked' });
          }

          return done(null, user);
        } catch (error) {
          console.error('Google Auth Error:', error);
          return done(error, null);
        }
      }
    )
  );

}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return done(null, false);
    }
    const user = result.rows[0];
    if (user.is_blocked) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = { isGoogleConfigured };
