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

function randomToken_() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
}

function addHoursIso_(hours) {
  return new Date(Date.now() + Number(hours) * 3600000).toISOString();
}

function sanitizeText_(value, maxLength) {
  return String(value == null ? '' : value).trim().replace(/[\u0000-\u001F\u007F]/g, '').slice(0, maxLength || 255);
}

function normalizePhone_(value) {
  let phone = String(value || '').replace(/[^0-9+]/g, '');
  if (phone.indexOf('+62') === 0) phone = '0' + phone.slice(3);
  if (phone.indexOf('62') === 0) phone = '0' + phone.slice(2);
  return phone;
}

function isIsoDate_(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3]);
}

function constantTimeEqual_(left, right) {
  const a = String(left || ''), b = String(right || '');
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) difference |= (a.charCodeAt(index % Math.max(a.length, 1)) || 0) ^ (b.charCodeAt(index % Math.max(b.length, 1)) || 0);
  return difference === 0;
}
