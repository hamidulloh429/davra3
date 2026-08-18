const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { query } = require('../db');
const { isGoogleConfigured } = require('../config/passport');
const { validateRequired, validateEmail, validateStringLength } = require('../validators');
const router = express.Router();

router.get('/status', (req, res) => {
  res.json({
    googleConfigured: isGoogleConfigured,
    isAuthenticated: !!(req.isAuthenticated && req.isAuthenticated() && req.user)
  });
});

router.post('/register', async (req, res, next) => {
  try {
    const { full_name, email, password, confirm_password } = req.body;

    // Validation
    const nameErr = validateRequired(full_name, 'To\'liq ism') || validateStringLength(full_name, 2, 100, 'To\'liq ism');
    if (nameErr) return res.status(400).json({ error: true, message: nameErr });

    const emailRequiredErr = validateRequired(email, 'Elektron pochta');
    if (emailRequiredErr) return res.status(400).json({ error: true, message: emailRequiredErr });

    const emailFormatErr = validateEmail(email);
    if (emailFormatErr) return res.status(400).json({ error: true, message: emailFormatErr });

    const passRequiredErr = validateRequired(password, 'Parol');
    if (passRequiredErr) return res.status(400).json({ error: true, message: passRequiredErr });

    const passLengthErr = validateStringLength(password, 6, 128, 'Parol');
    if (passLengthErr) return res.status(400).json({ error: true, message: passLengthErr });

    if (confirm_password !== undefined && password !== confirm_password) {
      return res.status(400).json({ error: true, message: "Kiritilgan parollar bir-biriga mos kelmadi." });
    }

    // Check duplicate email (case-insensitive)
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: true, message: "Ushbu elektron pochta manzili allaqachon ro'yxatdan o'tgan." });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const insertResult = await query(
      `INSERT INTO users (full_name, email, password_hash, is_blocked, last_login_at)
       VALUES ($1, $2, $3, FALSE, NOW())
       RETURNING id, full_name, email, avatar_url, bio, location, interests, is_blocked, created_at`,
      [full_name.trim(), normalizedEmail, password_hash]
    );

    const newUser = insertResult.rows[0];

    // Log the user in via passport session
    req.logIn(newUser, (err) => {
      if (err) {
        console.error('Session login error after registration:', err);
        return res.status(201).json({
          message: "Ro'yxatdan muvaffaqiyatli o'tdingiz!",
          user: newUser
        });
      }
      return res.status(201).json({
        message: "Ro'yxatdan muvaffaqiyatli o'tdingiz!",
        user: newUser
      });
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const emailErr = validateRequired(email, 'Elektron pochta');
    if (emailErr) return res.status(400).json({ error: true, message: emailErr });

    const passErr = validateRequired(password, 'Parol');
    if (passErr) return res.status(400).json({ error: true, message: passErr });

    const normalizedEmail = String(email).trim().toLowerCase();
    const result = await query('SELECT * FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: true, message: "Elektron pochta yoki parol noto'g'ri." });
    }

    const user = result.rows[0];

    if (user.is_blocked) {
      return res.status(403).json({ error: true, message: "Sizning hisobingiz bloklangan. Iltimos, administrator bilan bog'laning." });
    }

    if (!user.password_hash) {
      return res.status(400).json({ 
        error: true, 
        message: "Ushbu hisob Google orqali ochilgan. Iltimos, Google orqali kiring." 
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: true, message: "Elektron pochta yoki parol noto'g'ri." });
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // Omit sensitive hash
    delete user.password_hash;

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({ message: "Tizimga muvaffaqiyatli kirdingiz!", user });
    });
  } catch (error) {
    next(error);
  }
});

router.get('/google', (req, res, next) => {
  if (!isGoogleConfigured) {
    return res.status(400).json({ 
      error: true, 
      message: 'Google orqali kirish hozircha sozlanmagan. Administrator Google OAuth sozlamalarini yakunlashi kerak.' 
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}?auth=failed`,
    failureMessage: true
  }, (err, user, info) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    if (err || !user) {
      const isBlocked = info && info.message === 'blocked';
      const redirectUrl = isBlocked 
        ? `${clientUrl}?auth=blocked`
        : `${clientUrl}?auth=failed`;
      return res.redirect(redirectUrl);
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.redirect(`${clientUrl}?auth=failed`);
      }
      return res.redirect(clientUrl);
    });
  })(req, res, next);
});

router.get('/me', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return res.json({ user: req.user });
  }
  return res.json({ user: null });
});

router.post('/logout', (req, res, next) => {
  if (req.logout) {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        return res.json({ message: 'Tizimdan chiqildi.' });
      });
    });
  } else {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.json({ message: 'Tizimdan chiqildi.' });
    });
  }
});

module.exports = router;
