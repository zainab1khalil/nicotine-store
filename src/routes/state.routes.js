const express = require('express');
const { state } = require('../db');
const { requireAuth } = require('../middleware/requireAuth');
const { publicUser } = require('../utils');

const router = express.Router();

/*
 * GET /api/state
 * نقطة واحدة تُرجع كل بيانات التطبيق دفعة واحدة (المهام، سجل الإنجاز،
 * الحضور، المخالفات، الإشعارات، التقييمات، والمستخدمين)، بدل استدعاءات
 * متعددة متفرقة. الواجهة تستدعيها عند الفتح وبشكل دوري (polling) لتبقى
 * البيانات محدثة بين جهاز الموظف وجهاز المدير.
 */
router.get('/', requireAuth, (req, res) => {
  res.json({
    tasks: state.tasks,
    taskLog: state.taskLog,
    attendance: state.attendance,
    violations: state.violations,
    notifications: state.notifications,
    shiftRatings: state.shiftRatings,
    users: state.users.map(publicUser),
    serverTime: Date.now(),
  });
});

module.exports = router;
