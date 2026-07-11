const express = require('express');
const bcrypt = require('bcryptjs');
const { state, persist } = require('../db');
const { signToken } = require('../auth');
const { requireAuth, requireManager } = require('../middleware/requireAuth');
const { publicUser } = require('../utils');

const router = express.Router();

/* POST /api/auth/login  { identifier, code } -> { token, user } */
router.post('/login', (req, res) => {
  const identifier = String(req.body.identifier || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  if (!identifier || !code) {
    return res.status(400).json({ error: 'الرجاء إدخال البريد/الهاتف والكود' });
  }
  const user = state.users.find((u) => {
    const emailMatch = u.email && u.email.toLowerCase() === identifier;
    const phoneMatch = u.phone && u.phone.replace(/\s/g, '') === identifier.replace(/\s/g, '');
    return emailMatch || phoneMatch;
  });
  if (!user || !bcrypt.compareSync(code, user.codeHash)) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة، تحقق من البريد/الهاتف والكود.' });
  }
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

/* GET /api/auth/me -> بيانات المستخدم الحالي (للتحقق من صلاحية الجلسة عند فتح التطبيق) */
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

/* GET /api/auth/users -> كل المستخدمين (بدون الأكواد) — يُستخدم لعرض الأسماء والشفتات في الواجهة */
router.get('/users', requireAuth, (req, res) => {
  res.json({ users: state.users.map(publicUser) });
});

/* PUT /api/auth/credentials (مدير فقط) — تحديث البريد/الهاتف/الكود لكل مستخدم */
router.put('/credentials', requireAuth, requireManager, (req, res) => {
  const updates = req.body.users; // { [id]: { email, phone, code } }
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'صيغة الطلب غير صحيحة' });
  }
  Object.keys(updates).forEach((id) => {
    const user = state.users.find((u) => u.id === id);
    if (!user) return;
    const { email, phone, code } = updates[id];
    if (typeof email === 'string') user.email = email.trim();
    if (typeof phone === 'string') user.phone = phone.trim();
    if (typeof code === 'string' && code.trim()) user.codeHash = bcrypt.hashSync(code.trim(), 10);
  });
  persist('users');
  res.json({ ok: true, users: state.users.map(publicUser) });
});

module.exports = router;
