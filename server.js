require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./src/routes/auth.routes');
const stateRoutes = require('./src/routes/state.routes');
const taskRoutes = require('./src/routes/tasks.routes');
const attendanceRoutes = require('./src/routes/attendance.routes');
const violationRoutes = require('./src/routes/violations.routes');
const ratingRoutes = require('./src/routes/ratings.routes');
const notificationRoutes = require('./src/routes/notifications.routes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

/* تقديم صور إثبات المهام كملفات ثابتة */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true, time: Date.now() }));

app.use('/api/auth', authRoutes);
app.use('/api/state', stateRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/notifications', notificationRoutes);

/* معالج أخطاء عام */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'حدث خطأ غير متوقع في الخادم' });
});

app.listen(PORT, () => {
  console.log(`Nicotine Store backend يعمل على http://localhost:${PORT}`);
});
