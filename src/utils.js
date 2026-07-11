const { state, persist, uid } = require('./db');

/* يضيف إشعاراً جديداً ويحفظه، ويحتفظ فقط بآخر 200 إشعار */
function pushNotification({ type, message, employeeId, forRole }) {
  const entry = { id: uid(), type, message, employeeId, forRole, createdAt: Date.now(), read: false };
  state.notifications.unshift(entry);
  state.notifications = state.notifications.slice(0, 200);
  persist('notifications');
  return entry;
}

function publicUser(u) {
  const { codeHash, ...rest } = u;
  return rest;
}

module.exports = { pushNotification, publicUser };
