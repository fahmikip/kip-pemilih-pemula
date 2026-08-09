function createSession_(user, deviceId) {
  const token = randomToken_();
  const timestamp = nowIso_();
  appendRecords_('Sessions', [{SessionToken:token,UserID:user.UserID,Role:user.Role,CreatedAt:timestamp,ExpiredAt:addHoursIso_(APP.SESSION_HOURS),Status:'ACTIVE',DeviceID:sanitizeText_(deviceId,100),LastSeenAt:timestamp}]);
  return token;
}

function requireSession_(token, allowedRoles) {
  const safeToken = String(token || '');
  if (!/^[a-f0-9]{64}$/i.test(safeToken)) throw authError_('Sesi tidak valid.', 'INVALID_SESSION');
  const session = findOne_('Sessions', 'SessionToken', safeToken);
  if (!session || session.Status !== 'ACTIVE') throw authError_('Sesi tidak valid.', 'INVALID_SESSION');
  if (new Date(session.ExpiredAt).getTime() <= Date.now()) {
    updateRecord_('Sessions', 'SessionToken', safeToken, {Status:'EXPIRED', LastSeenAt:nowIso_()});
    throw authError_('Sesi telah berakhir. Silakan masuk kembali.', 'SESSION_EXPIRED');
  }
  if (allowedRoles && allowedRoles.indexOf(session.Role) < 0) throw authError_('Anda tidak memiliki akses.', 'FORBIDDEN');
  const user = findOne_('Users', 'UserID', session.UserID);
  if (!user || user.Status !== 'ACTIVE' || user.Role !== session.Role) throw authError_('Akun tidak aktif.', 'ACCOUNT_INACTIVE');
  updateRecord_('Sessions', 'SessionToken', safeToken, {LastSeenAt:nowIso_()});
  return {session:session, user:user};
}

function revokeSession_(token) {
  return updateRecord_('Sessions', 'SessionToken', token, {Status:'REVOKED', LastSeenAt:nowIso_()});
}

function revokeUserSessions_(userId) {
  const sessions = readTable_('Sessions').filter(item => item.UserID === userId && item.Status === 'ACTIVE');
  sessions.forEach(item => updateRecord_('Sessions', 'SessionToken', item.SessionToken, {Status:'REVOKED', LastSeenAt:nowIso_()}));
  return sessions.length;
}

function authError_(message, code) {
  const error = new Error(message); error.publicCode = code; return error;
}
