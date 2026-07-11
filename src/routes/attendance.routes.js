const express = require('express');
const { state, persist, uid } = require('../db');
const { requireAuth } = require('../middleware/requireAuth');
const { pushNotification } = require('../utils');

const router = express.Router();
const LATE_GRACE_MIN = 5;

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
}

/* GET /api/attendance -> كل سجلات الحضور (اختياري: ?employeeId=) */
router.get('/', requireAuth, (req, res) => {
  const { employeeId } = req.query;
  const rows = employeeId ? state.attendance.filter((a) => a.employeeId === employeeId) : state.attendance;
  res.json({ attendance: rows });
});

/* POST /api/attendance/checkin -> تسجيل حضور للمستخدم الحالي */
router.post('/checkin', requireAuth, (req, res) => {
  const emp = req.user;
  const alreadyOpen = state.attendance.find((a) => a.employeeId === emp.id && !a.checkOut);
  if (alreadyOpen) return res.status(400).json({ error: 'لديك جلسة حضور مفتوحة بالفعل، سجّل الانصراف أولاً' });

  const t = Date.now();
  const hour = new Date(t).getHours() + new Date(t).getMinutes() / 60;
  const late = hour > emp.shiftStart + LATE_GRACE_MIN / 60;
  const rec = { id: uid(), employeeId: emp.id, checkIn: t, checkOut: null, late };
  state.attendance.unshift(rec);
  persist('attendance');

  pushNotification({
    type: 'checkin',
    message: `${emp.name} سجّل حضوره الساعة ${fmtTime(t)}${late ? ' (متأخر)' : ''}`,
    employeeId: emp.id,
    forRole: 'manager',
  });

  res.status(201).json({ record: rec });
});

/* POST /api/attendance/checkout -> تسجيل انصراف للمستخدم الحالي */
router.post('/checkout', requireAuth, (req, res) => {
  const emp = req.user;
  const sess = state.attendance.find((a) => a.employeeId === emp.id && !a.checkOut);
  if (!sess) return res.status(400).json({ error: 'لا توجد جلسة حضور مفتوحة' });

  const t = Date.now();
  sess.checkOut = t;
  persist('attendance');

  pushNotification({
    type: 'checkout',
    message: `${emp.name} سجّل انصرافه الساعة ${fmtTime(t)}`,
    employeeId: emp.id,
    forRole: 'manager',
  });

  res.json({ record: sess });
});

module.exports = router;
