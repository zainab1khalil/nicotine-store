const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { state, persist, uid } = require('../db');
const { requireAuth, requireManager } = require('../middleware/requireAuth');
const { pushNotification } = require('../utils');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'task-photos');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = (file.mimetype && file.mimetype.split('/')[1]) || 'jpg';
      cb(null, `${uid()}.${ext === 'jpeg' ? 'jpg' : ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB كحد أقصى للصورة
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('الملف يجب أن يكون صورة'));
    cb(null, true);
  },
});

/* GET /api/tasks -> قائمة المهام */
router.get('/', requireAuth, (req, res) => {
  res.json({ tasks: state.tasks });
});

/* POST /api/tasks (مدير فقط) -> إضافة مهمة جديدة */
router.post('/', requireAuth, requireManager, (req, res) => {
  const { name, type, intervalDays, perShiftCount, note, icon } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'الرجاء إدخال اسم المهمة' });
  }
  if (type !== 'interval' && type !== 'pershift') {
    return res.status(400).json({ error: 'نوع الجدولة غير صحيح' });
  }
  const task = {
    id: uid(),
    order: state.tasks.length + 1,
    name: String(name).trim(),
    icon: icon || 'fa-star',
    type,
    intervalDays: type === 'interval' ? parseInt(intervalDays || 5, 10) : null,
    perShiftCount: type === 'pershift' ? parseInt(perShiftCount || 1, 10) : null,
    note: note ? String(note).trim() : '',
  };
  state.tasks.push(task);
  persist('tasks');
  pushNotification({
    type: 'newtask',
    message: `تمت إضافة مهمة جديدة: ${task.name}`,
    employeeId: null,
    forRole: 'ghaith',
  });
  pushNotification({
    type: 'newtask',
    message: `تمت إضافة مهمة جديدة: ${task.name}`,
    employeeId: null,
    forRole: 'zaid',
  });
  res.status(201).json({ task });
});

/* DELETE /api/tasks/:id (مدير فقط) -> حذف مهمة */
router.delete('/:id', requireAuth, requireManager, (req, res) => {
  const idx = state.tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'المهمة غير موجودة' });
  const [removed] = state.tasks.splice(idx, 1);
  persist('tasks');
  res.json({ ok: true, removed });
});

/* POST /api/tasks/:id/complete -> تسجيل إنجاز مهمة (مع صورة اختيارية) */
router.post('/:id/complete', requireAuth, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'تعذّر رفع الصورة' });
    next();
  });
}, (req, res) => {
  const task = state.tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'المهمة غير موجودة' });

  const employeeId = req.user.role === 'manager' && req.body.employeeId ? req.body.employeeId : req.user.id;
  const entryId = uid();
  let photoUrl = null;
  if (req.file) {
    photoUrl = `/uploads/task-photos/${req.file.filename}`;
  }

  const entry = {
    id: entryId,
    taskId: task.id,
    taskName: task.name,
    employeeId,
    completedAt: Date.now(),
    photoUrl,
    photo: photoUrl,
  };
  state.taskLog.unshift(entry);
  persist('taskLog');

  const emp = state.users.find((u) => u.id === employeeId);
  pushNotification({
    type: 'task',
    message: `${emp ? emp.name : employeeId} أكمل مهمة: ${task.name}`,
    employeeId,
    forRole: 'manager',
  });

  res.status(201).json({ entry });
});

module.exports = router;
