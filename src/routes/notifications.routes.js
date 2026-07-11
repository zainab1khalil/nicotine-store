const express = require('express');
const { state, persist } = require('../db');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

/* يحسب إشعارات المستخدم الحالي: المدير يرى forRole==='manager'، والموظف يرى forRole===نفس معرفه */
function notifsFor(user) {
  const target = user.role === 'manager' ? 'manager' : user.id;
  return state.notifications.filter((n) => n.forRole === target);
}

/* GET /api/notifications -> إشعارات المستخدم الحالي */
router.get('/', requireAuth, (req, res) => {
  res.json({ notifications: notifsFor(req.user) });
});

/* POST /api/notifications/read-all -> تعليم كل إشعارات المستخدم الحالي كمقروءة */
router.post('/read-all', requireAuth, (req, res) => {
  const mine = notifsFor(req.user);
  mine.forEach((n) => { n.read = true; });
  persist('notifications');
  res.json({ ok: true });
});

module.exports = router;
