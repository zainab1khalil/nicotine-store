const { verifyToken } = require('../auth');
const { state } = require('../db');

/* يتحقق من وجود Bearer token صالح، ويرفق المستخدم الحالي في req.user */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'يلزم تسجيل الدخول' });
  try {
    const payload = verifyToken(token);
    const user = state.users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: 'المستخدم غير موجود' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'جلسة غير صالحة أو منتهية، الرجاء تسجيل الدخول مجدداً' });
  }
}

/* يسمح فقط للمدير بالمتابعة */
function requireManager(req, res, next) {
  if (!req.user || req.user.role !== 'manager') {
    return res.status(403).json({ error: 'هذا الإجراء متاح للمدير فقط' });
  }
  next();
}

module.exports = { requireAuth, requireManager };
