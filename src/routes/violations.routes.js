const express = require('express');
const { state, persist, uid } = require('../db');
const { requireAuth, requireManager } = require('../middleware/requireAuth');
const { pushNotification } = require('../utils');

const router = express.Router();

/* GET /api/violations -> كل المخالفات (اختياري: ?employeeId=) */
router.get('/', requireAuth, (req, res) => {
  const { employeeId } = req.query;
  const rows = employeeId ? state.violations.filter((v) => v.employeeId === employeeId) : state.violations;
  res.json({ violations: rows });
});

/* POST /api/violations (مدير فقط) -> تسجيل مخالفة جديدة */
router.post('/', requireAuth, requireManager, (req, res) => {
  const { employeeId, kind, description } = req.body;
  if (!employeeId || !kind || !description || !String(description).trim()) {
    return res.status(400).json({ error: 'الرجاء تعبئة كل الحقول' });
  }
  const emp = state.users.find((u) => u.id === employeeId);
  if (!emp) return res.status(404).json({ error: 'الموظف غير موجود' });

  const entry = { id: uid(), employeeId, kind, description: String(description).trim(), date: Date.now() };
  state.violations.unshift(entry);
  persist('violations');

  pushNotification({
    type: 'violation',
    message: `تم تسجيل مخالفة (${kind}): ${entry.description}`,
    employeeId,
    forRole: employeeId,
  });

  res.status(201).json({ violation: entry });
});

module.exports = router;
