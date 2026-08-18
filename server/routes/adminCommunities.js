const express = require('express');
const { query } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { logAction } = require('../services/auditLog');
const router = express.Router();

router.use(requireAdmin);

const slugify = (text) => {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, u.full_name as owner_name, u.email as owner_email,
        (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id) as member_count,
        (SELECT COUNT(*) FROM community_messages cmsg WHERE cmsg.community_id = c.id) as message_count
       FROM communities c
       LEFT JOIN users u ON c.owner_id = u.id
       ORDER BY c.created_at DESC`
    );
    res.json({ communities: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description, category, cover_image, visibility, owner_id } = req.body;
    if (!name) return res.status(400).json({ error: true, message: "Jamiyat nomi kiritilishi shart." });

    let baseSlug = slugify(name);
    if (!baseSlug) baseSlug = 'jamiyat';
    
    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;
    while(slugExists) {
      const check = await query('SELECT id FROM communities WHERE slug = $1', [slug]);
      if (check.rows.length === 0) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const inserted = await query(
      `INSERT INTO communities (name, slug, description, category, cover_image, visibility, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, slug, description || '', category || 'Umumiy', cover_image || '', visibility || 'public', owner_id || null]
    );

    await logAction(req.admin.id, 'create_community', 'community', inserted.rows[0].id);
    res.status(201).json({ community: inserted.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const commId = req.params.id;
    const { name, description, category, cover_image, visibility } = req.body;

    const updated = await query(
      `UPDATE communities 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description), 
           category = COALESCE($3, category), 
           cover_image = COALESCE($4, cover_image), 
           visibility = COALESCE($5, visibility), 
           updated_at = NOW() 
       WHERE id = $6 RETURNING *`,
      [name, description, category, cover_image, visibility, commId]
    );

    if (updated.rows.length === 0) return res.status(404).json({ error: true, message: "Jamiyat topilmadi." });

    await logAction(req.admin.id, 'update_community', 'community', commId);
    res.json({ community: updated.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const commId = req.params.id;
    const deleted = await query('DELETE FROM communities WHERE id = $1 RETURNING id', [commId]);
    
    if (deleted.rows.length === 0) return res.status(404).json({ error: true, message: "Jamiyat topilmadi." });

    await logAction(req.admin.id, 'delete_community', 'community', commId);
    res.json({ message: "Jamiyat muvaffaqiyatli o'chirildi." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
