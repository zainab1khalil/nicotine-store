/*
 * db.js — طبقة قاعدة بيانات بسيطة قائمة على ملفات JSON.
 * لا تحتاج أي خادم خارجي (لا Supabase ولا Postgres) — كل البيانات
 * محفوظة داخل مجلد backend/data كملفات JSON، وتُحمّل في الذاكرة عند
 * تشغيل الخادم وتُكتب على القرص عند كل تعديل.
 *
 * هذا يكفي تماماً لحجم بيانات محل صغير (عشرات/مئات السجلات يومياً)،
 * وأبسط بكثير من إدارة قاعدة بيانات SQL كاملة.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const FILES = {
  users: 'users.json',
  tasks: 'tasks.json',
  taskLog: 'task_log.json',
  attendance: 'attendance.json',
  violations: 'violations.json',
  notifications: 'notifications.json',
  shiftRatings: 'shift_ratings.json',
};

function filePath(name) {
  return path.join(DATA_DIR, FILES[name]);
}

function readJsonFile(name, fallback) {
  const p = filePath(name);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, JSON.stringify(fallback, null, 2));
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error(`تعذّرت قراءة ${name}.json، سيتم استخدام قيمة افتراضية`, e);
    return fallback;
  }
}

function writeJsonFile(name, data) {
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
}

/* بيانات ابتدائية (Seed) — نفس الموظفين والمهام الافتراضية من التطبيق الأصلي */
const DEFAULT_TASKS = [
  { id: 't1', order: 1, name: 'تنظيف الجوسات (سوائل الفيب)', icon: 'fa-flask', type: 'interval', intervalDays: 15, note: 'يقوم بها الموظفان معاً' },
  { id: 't2', order: 2, name: 'تنظيف الخزن', icon: 'fa-warehouse', type: 'interval', intervalDays: 4, note: 'كل 4 أيام على الشفت' },
  { id: 't3', order: 3, name: 'تنظيف رف الآيكوس (IQOS)', icon: 'fa-layer-group', type: 'interval', intervalDays: 5, note: 'كل 5 أيام على الشفت' },
  { id: 't4', order: 4, name: 'تنظيف الأجهزة', icon: 'fa-mobile-screen-button', type: 'interval', intervalDays: 5, note: 'كل 5 أيام على الشفت' },
  { id: 't5', order: 5, name: 'تنظيف خزن الكارتريدجات', icon: 'fa-box-archive', type: 'interval', intervalDays: 5, note: 'كل 5 أيام على الشفت' },
  { id: 't6', order: 6, name: 'تنظيف الديسبوزيبل', icon: 'fa-vial', type: 'interval', intervalDays: 7, note: 'أسبوعياً على الشفت' },
  { id: 't7', order: 7, name: 'تنظيف أرضية المحل', icon: 'fa-broom', type: 'pershift', perShiftCount: 2, note: 'مرتين كل شفت' },
  { id: 't8', order: 8, name: 'تنظيف الجام الخارجي', icon: 'fa-store', type: 'interval', intervalDays: 5, note: 'كل 5 أيام أو عند الاتساخ' },
  { id: 't9', order: 9, name: 'تنظيف الجام الداخلي', icon: 'fa-window-restore', type: 'pershift', perShiftCount: 1, note: 'كلما اتسخ - على الشفتين' },
  { id: 't10', order: 10, name: 'تنظيف البلندر وميز الكاشير والطاولات', icon: 'fa-blender', type: 'pershift', perShiftCount: 1, note: 'كل شفت' },
  { id: 't11', order: 11, name: 'غسل المحل', icon: 'fa-soap', type: 'interval', intervalDays: 30, note: 'شهرياً' },
  { id: 't12', order: 12, name: 'رمي النفايات', icon: 'fa-trash', type: 'pershift', perShiftCount: 1, note: 'إن امتلأت - على الشفتين' },
  { id: 't13', order: 13, name: 'تنظيف الإعلانات وأجهزة التيستر', icon: 'fa-tags', type: 'interval', intervalDays: 1, note: 'يومياً' },
  { id: 't14', order: 14, name: 'الانتباه للنواقص وتواريخ الإكسباير', icon: 'fa-calendar-xmark', type: 'pershift', perShiftCount: 1, note: 'على كل شفت' },
];

/* ملاحظة: الأكواد الافتراضية هنا نفس أكواد التطبيق الأصلي كنقطة انطلاق فقط.
   يجب على المدير تغييرها فوراً من "إعدادات أكواد الدخول" بعد أول تشغيل. */
const DEFAULT_USERS = [
  { id: 'zaid', name: 'زيد علي', role: 'employee', shiftLabel: 'الشفت الصباحي', shiftStart: 9, shiftEnd: 17, color: '#f0b429', email: 'zaid@nicotinestore.com', phone: '07701111111', code: '1111' },
  { id: 'ghaith', name: 'غيث ارشد', role: 'employee', shiftLabel: 'الشفت المسائي', shiftStart: 15, shiftEnd: 24, color: '#c97f1e', email: 'ghaith@nicotinestore.com', phone: '07702222222', code: '2222' },
  { id: 'manager', name: 'ابراهيم خليل', role: 'manager', shiftLabel: 'المدير', shiftStart: 0, shiftEnd: 24, color: '#5aa9e6', email: 'ibrahim@nicotinestore.com', phone: '07703333333', code: '9999' },
];

const bcrypt = require('bcryptjs');

function seedUsersIfNeeded() {
  const p = filePath('users');
  if (fs.existsSync(p)) return;
  const seeded = DEFAULT_USERS.map((u) => {
    const { code, ...rest } = u;
    return { ...rest, codeHash: bcrypt.hashSync(code, 10) };
  });
  writeJsonFile('users', seeded);
}
seedUsersIfNeeded();

/* الحالة في الذاكرة، محمّلة من الملفات عند بدء التشغيل */
const state = {
  users: readJsonFile('users', []),
  tasks: readJsonFile('tasks', DEFAULT_TASKS),
  taskLog: readJsonFile('taskLog', []),
  attendance: readJsonFile('attendance', []),
  violations: readJsonFile('violations', []),
  notifications: readJsonFile('notifications', []),
  shiftRatings: readJsonFile('shiftRatings', []),
};

/* حفظ مجموعة بيانات كاملة على القرص بعد أي تعديل عليها في الذاكرة */
function persist(name) {
  writeJsonFile(name, state[name]);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

module.exports = { state, persist, uid, DEFAULT_TASKS };
