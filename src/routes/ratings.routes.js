const express = require('express');
const { state, persist, uid } = require('../db');
const { requireAuth, requireManager } = require('../middleware/requireAuth');
const { pushNotification } = require('../utils');

const router = express.Router();

function ratingIdFor(taskId, empId, dateKey) {
  return `r_${empId}_${dateKey}_${taskId}`;
}

/* GET /api/ratings -> كل التقييمات (اختياري: ?employeeId=) */
router.get('/', requireAuth, (req, res) => {
  const { employeeId } = req.query;
  const rows = employeeId ? state.shiftRatings.filter((r) => r.employeeId === employeeId) : state.shiftRatings;
  res.json({ shiftRatings: rows });
});

/* POST /api/ratings (مدير فقط) -> تقييم إنجاز مهمة لموظف عن شفت معيّن */
router.post('/', requireAuth, requireManager, (req, res) => {
  const { taskId, employeeId, dateKey, rating, note } = req.body;
  if (!taskId || !employeeId || !dateKey || !['excellent', 'ok', 'bad'].includes(rating)) {
    return res.status(400).json({ error: 'بيانات التقييم غير مكتملة' });
  }
  const task = state.tasks.find((t) => t.id === taskId);
  const id = ratingIdFor(taskId, employeeId, dateKey);
  const entry = {
    id,
    taskId,
    employeeId,
    taskName: task ? task.name : '',
    shiftDate: dateKey,
    rating,
    note: note || '',
    ratedAt: Date.now(),
    ratedBy: 'manager',
  };
  state.shiftRatings = state.shiftRatings.filter((r) => r.id !== id);
  state.shiftRatings.unshift(entry);
  persist('shiftRatings');

  const label = rating === 'excellent' ? 'ممتاز' : rating === 'ok' ? 'مقبول' : 'سيء';
  pushNotification({
    type: rating === 'bad' ? 'violation' : 'task',
    message: `قيّم المدير مهمتك "${task ? task.name : ''}": ${label}`,
    employeeId,
    forRole: employeeId,
  });

  if (rating === 'bad') {
    const violation = {
      id: uid(),
      employeeId,
      kind: 'أدائية',
      description: `تقييم سيء على مهمة: ${task ? task.name : ''}${note ? ` — ${note}` : ''}`,
      date: Date.now(),
    };
    state.violations.unshift(violation);
    persist('violations');
  }

  res.status(201).json({ rating: entry });
});

module.exports = router;
