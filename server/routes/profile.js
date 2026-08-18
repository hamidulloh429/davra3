const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
sharp.cache(false); // Release Windows file handles immediately after processing
const { query } = require('../db');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

// Ensure avatars directory exists (supports Railway Persistent Volume via UPLOADS_DIR)
const uploadsBaseDir = process.env.UPLOADS_DIR || path.resolve(__dirname, '../uploads');
const uploadsAvatarsDir = path.join(uploadsBaseDir, 'avatars');
if (!fs.existsSync(uploadsAvatarsDir)) {
  fs.mkdirSync(uploadsAvatarsDir, { recursive: true });
}

// Safe asynchronous file deletion with exponential retry for Windows file locks
const safeDeleteFile = (filePath, maxRetries = 5) => {
  if (!filePath) return;
  let attempts = 0;
  const tryUnlink = () => {
    fs.unlink(filePath, (err) => {
      if (err && (err.code === 'EBUSY' || err.code === 'EPERM') && attempts < maxRetries) {
        attempts++;
        setTimeout(tryUnlink, 250 * attempts);
      }
    });
  };
  tryUnlink();
};

// Multer in-memory storage for secure processing
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      const err = new Error("Faqat JPG, PNG yoki WEBP formatidagi rasmlarni yuklash mumkin.");
      err.code = 'INVALID_FILE_TYPE';
      cb(err, false);
    }
  }
});

// Middleware to handle multer upload errors cleanly
const handleUpload = (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: true, message: "Rasm hajmi 5 MB dan oshmasligi kerak." });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: true, message: err.message });
      }
      return res.status(400).json({ error: true, message: "Rasmni yuklashda xatolik yuz berdi." });
    }
    next();
  });
};

// GET /api/profile
router.get('/', requireUser, async (req, res, next) => {
  try {
    const userRes = await query('SELECT id, email, full_name, avatar_url, bio, location, interests, is_blocked, created_at, last_login_at FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: true, message: "Foydalanuvchi topilmadi." });

    const communitiesRes = await query(
      `SELECT c.*, cm.role 
       FROM community_members cm
       JOIN communities c ON cm.community_id = c.id
       WHERE cm.user_id = $1 ORDER BY cm.joined_at DESC`,
      [req.user.id]
    );

    const eventsRes = await query(
      `SELECT e.* 
       FROM event_members em
       JOIN events e ON em.event_id = e.id
       WHERE em.user_id = $1 AND e.event_date > NOW() ORDER BY e.event_date ASC`,
      [req.user.id]
    );

    res.json({
      profile: userRes.rows[0],
      communities: communitiesRes.rows,
      events: eventsRes.rows
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/profile
router.put('/', requireUser, async (req, res, next) => {
  try {
    const { bio, location, interests, full_name } = req.body;
    
    if (full_name !== undefined && full_name.trim() === '') {
      return res.status(400).json({ error: true, message: "To'liq ism bo'sh bo'lishi mumkin emas." });
    }

    const updated = await query(
      `UPDATE users 
       SET bio = COALESCE($1, bio), 
           location = COALESCE($2, location), 
           interests = COALESCE($3, interests),
           full_name = COALESCE($4, full_name),
           updated_at = NOW() 
       WHERE id = $5 RETURNING id, email, full_name, avatar_url, bio, location, interests, created_at, last_login_at`,
      [bio, location, interests, full_name, req.user.id]
    );

    res.json({ profile: updated.rows[0] });
  } catch (error) {
    next(error);
  }
});

// POST /api/profile/avatar — Upload & change profile picture
router.post('/avatar', requireUser, handleUpload, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: "Iltimos, rasm faylini tanlang." });
    }

    // Inspect real image format with sharp to prevent disguised/corrupted files
    let metadata;
    try {
      metadata = await sharp(req.file.buffer).metadata();
    } catch (sharpErr) {
      return res.status(400).json({ error: true, message: "Yuklangan fayl buzilgan yoki yaroqsiz rasm formati." });
    }

    const validFormats = ['jpeg', 'jpg', 'png', 'webp'];
    if (!metadata.format || !validFormats.includes(metadata.format.toLowerCase())) {
      return res.status(400).json({ error: true, message: "Faqat JPG, PNG yoki WEBP formatidagi rasmlarni yuklash mumkin." });
    }

    // Fetch existing avatar to delete old local file
    const oldUserRes = await query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
    const oldAvatarUrl = oldUserRes.rows[0]?.avatar_url;

    // Process image: square crop (400x400), optimize as WebP
    const filename = `avatar-${req.user.id}-${Date.now()}.webp`;
    const targetPath = path.join(uploadsAvatarsDir, filename);

    await sharp(req.file.buffer)
      .rotate() // Auto-orient based on EXIF
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 })
      .toFile(targetPath);

    if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
      const oldFilename = path.basename(oldAvatarUrl.split('?')[0]);
      if (oldFilename !== filename) {
        const oldPath = path.join(uploadsAvatarsDir, oldFilename);
        safeDeleteFile(oldPath);
      }
    }

    const newAvatarUrl = `/uploads/avatars/${filename}`;

    // Update database
    const updateRes = await query(
      `UPDATE users 
       SET avatar_url = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, email, full_name, avatar_url, bio, location, interests, created_at, last_login_at`,
      [newAvatarUrl, req.user.id]
    );

    res.json({
      success: true,
      message: "Rasm muvaffaqiyatli yuklandi.",
      profile: updateRes.rows[0],
      avatar_url: newAvatarUrl
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    next(error);
  }
});

// Also support PUT /api/profile/avatar
router.put('/avatar', requireUser, handleUpload, (req, res, next) => {
  // Reuse POST logic
  return router.handle({ ...req, method: 'POST' }, res, next);
});

// DELETE /api/profile/avatar — Remove profile picture
router.delete('/avatar', requireUser, async (req, res, next) => {
  try {
    const oldUserRes = await query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
    const oldAvatarUrl = oldUserRes.rows[0]?.avatar_url;

    if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
      const oldFilename = path.basename(oldAvatarUrl.split('?')[0]);
      const oldPath = path.join(uploadsAvatarsDir, oldFilename);
      safeDeleteFile(oldPath);
    }

    const updateRes = await query(
      `UPDATE users 
       SET avatar_url = NULL, updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, email, full_name, avatar_url, bio, location, interests, created_at, last_login_at`,
      [req.user.id]
    );

    res.json({
      success: true,
      message: "Profil rasmi muvaffaqiyatli o'chirildi.",
      profile: updateRes.rows[0],
      avatar_url: null
    });
  } catch (error) {
    console.error("Avatar delete error:", error);
    next(error);
  }
});

module.exports = router;
