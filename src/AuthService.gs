function publicUser_(user) {
  const school = user.SchoolID ? findOne_('Schools', 'SchoolID', user.SchoolID) : null;
  return {userId:user.UserID,name:user.Name,schoolId:user.SchoolID || '',schoolName:school ? school.NamaSekolah : '',className:user.Class || '',role:user.Role,status:user.Status,totalPoint:Number(user.TotalPointCache || 0),fraudScore:Number(user.FraudScore || 0)};
}

function rateLimitKey_(identifier) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(identifier));
  return 'login:' + Utilities.base64EncodeWebSafe(digest).slice(0, 32);
}

function checkLoginRate_(identifier) {
  const cache = CacheService.getScriptCache();
  const key = rateLimitKey_(identifier);
  const count = Number(cache.get(key) || 0);
  if (count >= APP.LOGIN_LIMIT) throw authError_('Terlalu banyak percobaan. Coba kembali beberapa menit lagi.', 'RATE_LIMITED');
  cache.put(key, String(count + 1), APP.LOGIN_WINDOW_SECONDS);
  return key;
}

function registerStudent(payload) {
  try {
    if (getSetting_('REGISTRATION_OPEN', 'FALSE') !== 'TRUE') return apiError_('Pendaftaran sedang ditutup.', 'REGISTRATION_CLOSED');
    const result = validateRegistration_(payload);
    if (!result.valid) return apiError_(result.errors[0], 'VALIDATION_ERROR');
    return withDocumentLock_(function () {
      const data = result.data;
      const school = findOne_('Schools', 'SchoolID', data.schoolId);
      if (!school || school.Status !== 'ACTIVE') return apiError_('Sekolah tidak tersedia.', 'SCHOOL_NOT_FOUND');
      const users = readTable_('Users');
      if (users.some(user => normalizeNis_(user.NIS) === data.nis)) return apiError_('NIS/NISN sudah terdaftar.', 'DUPLICATE_NIS');
      if (users.some(user => normalizeEmail_(user.Email) === data.email)) return apiError_('Email sudah terdaftar.', 'DUPLICATE_EMAIL');
      const credential = createPasswordRecord_(data.password);
      const timestamp = nowIso_();
      const userId = generateId_('Users');
      appendRecords_('Users', [{UserID:userId,Name:data.name,NIS:data.nis,SchoolID:data.schoolId,Class:data.className,BirthDate:data.birthDate,Gender:data.gender,WhatsApp:data.whatsapp,Email:data.email,PasswordHash:credential.PasswordHash,PasswordSalt:credential.PasswordSalt,Role:'STUDENT',Status:'PENDING',TotalPointCache:0,FraudScore:0,CreatedAt:timestamp,UpdatedAt:timestamp}]);
      logActivity_(userId,'REGISTER','Users',userId,'Registrasi peserta baru',payload.deviceId);
      return apiSuccess_({status:'PENDING'}, 'Registrasi berhasil. Akun menunggu validasi administrator.');
    });
  } catch (error) { console.error(error); return apiError_('Registrasi gagal. Silakan coba kembali.', error.publicCode || 'REGISTER_FAILED'); }
}

function login(payload) {
  try {
    const input = validateLogin_(payload);
    if (!input.valid) return apiError_('Email/NISN dan password wajib diisi.', 'VALIDATION_ERROR');
    const rateKey = checkLoginRate_(input.identifier);
    const users = readTable_('Users');
    const user = users.find(item => normalizeEmail_(item.Email) === input.identifier || normalizeNis_(item.NIS).toLowerCase() === input.identifier);
    const submittedHash = hashPassword_(input.password, user ? user.PasswordSalt : 'invalid-salt');
    if (!user || !constantTimeEqual_(submittedHash, user ? user.PasswordHash : 'invalid-hash')) {
      logActivity_(user ? user.UserID : '', 'LOGIN_FAILED', 'Users', user ? user.UserID : '', 'Kredensial tidak valid', payload.deviceId);
      return apiError_('Email/NISN atau password salah.', 'INVALID_CREDENTIALS');
    }
    if (user.Status !== 'ACTIVE') return apiError_(user.Status === 'PENDING' ? 'Akun masih menunggu validasi administrator.' : 'Akun tidak aktif.', 'ACCOUNT_INACTIVE');
    const token = createSession_(user, payload.deviceId);
    updateRecord_('Users','UserID',user.UserID,{LastLogin:nowIso_(),UpdatedAt:nowIso_()});
    CacheService.getScriptCache().remove(rateKey);
    logActivity_(user.UserID,'LOGIN','Sessions',token.slice(0,12),'Login berhasil',payload.deviceId);
    return apiSuccess_({token:token,expiresIn:APP.SESSION_HOURS * 3600,user:publicUser_(user)}, 'Login berhasil.');
  } catch (error) { console.error(error); return apiError_(error.publicCode ? error.message : 'Login gagal. Silakan coba kembali.', error.publicCode || 'LOGIN_FAILED'); }
}

function logout(token) {
  try {
    const auth = requireSession_(token);
    revokeSession_(token);
    logActivity_(auth.user.UserID,'LOGOUT','Sessions','', 'Logout berhasil','');
    return apiSuccess_({}, 'Logout berhasil.');
  } catch (error) { return apiError_(error.message, error.publicCode || 'LOGOUT_FAILED'); }
}

function getCurrentUser(token) {
  try { return apiSuccess_({user:publicUser_(requireSession_(token).user)}); }
  catch (error) { return apiError_(error.message, error.publicCode || 'AUTH_FAILED'); }
}
