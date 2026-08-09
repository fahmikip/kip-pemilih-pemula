function nowIso_() {
  return Utilities.formatDate(new Date(), APP.TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function generateId_(entity) {
  const prefix = ID_PREFIX[entity] || 'ID';
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 20);
}

function normalizeEmail_(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeNis_(value) {
  return String(value || '').replace(/\s+/g, '').toUpperCase();
}

function apiSuccess_(data, message) {
  return { success: true, message: message || 'Success', data: data || {} };
}

function apiError_(message, code) {
  return { success: false, message: message || 'Terjadi kesalahan. Silakan coba kembali.', code: code || 'INTERNAL_ERROR' };
}

function withDocumentLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return callback(); } finally { lock.releaseLock(); }
}

function safeJson_(value) {
  return JSON.stringify(value == null ? null : value);
}
