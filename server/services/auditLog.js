const { query } = require('../db');

const logAction = async (adminId, action, targetType, targetId, metadata = {}) => {
  try {
    await query(
      `INSERT INTO audit_logs (admin_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId || null, action, targetType || null, targetId ? String(targetId) : null, metadata]
    );
  } catch (error) {
    console.error('Audit log saqlashda xatolik:', error);
  }
};

module.exports = { logAction };
