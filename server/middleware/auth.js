const { query } = require('../db');

const requireUser = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  if (req.session && req.session.userId) {
    req.user = { id: req.session.userId };
    return next();
  }

  return res.status(401).json({ error: true, message: "Avtorizatsiya talab qilinadi." });
};

const requireAdmin = async (req, res, next) => {
  try {
    const adminId = req.session && req.session.adminId;
    
    if (!adminId) {
      return res.status(401).json({ error: true, message: "Avtorizatsiya talab qilinadi." });
    }

    const result = await query("SELECT id FROM admins WHERE id = $1", [adminId]);
    if (result.rows.length === 0) {
      return res.status(403).json({ error: true, message: "Ruxsat berilmagan." });
    }

    req.admin = { id: adminId };
    return next();
  } catch (error) {
    console.error("Admin middleware xatosi:", error);
    return res.status(500).json({ error: true, message: "Serverda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring." });
  }
};

module.exports = { requireUser, requireAdmin };
