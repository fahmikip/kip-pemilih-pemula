function validateRegistration_(input) {
  const data = input || {};
  const clean = {
    name: sanitizeText_(data.name, 100), nis: normalizeNis_(data.nis), schoolId: sanitizeText_(data.schoolId, 40),
    className: sanitizeText_(data.className, 30), birthDate: sanitizeText_(data.birthDate, 10),
    gender: sanitizeText_(data.gender, 20).toUpperCase(), whatsapp: normalizePhone_(data.whatsapp),
    email: normalizeEmail_(data.email), password: String(data.password || ''), agreement: data.agreement === true
  };
  const errors = [];
  if (clean.name.length < 3) errors.push('Nama lengkap minimal 3 karakter.');
  if (!/^[A-Z0-9.-]{4,30}$/.test(clean.nis)) errors.push('NIS/NISN tidak valid.');
  if (!/^SCH_[a-f0-9]{20}$/i.test(clean.schoolId)) errors.push('Sekolah tidak valid.');
  if (!clean.className) errors.push('Kelas wajib diisi.');
  if (!isIsoDate_(clean.birthDate) || new Date(clean.birthDate + 'T00:00:00Z').getTime() > Date.now()) errors.push('Tanggal lahir tidak valid.');
  if (clean.gender && ['LAKI-LAKI','PEREMPUAN','LAINNYA'].indexOf(clean.gender) < 0) errors.push('Jenis kelamin tidak valid.');
  if (!/^0\d{9,14}$/.test(clean.whatsapp)) errors.push('Nomor WhatsApp tidak valid.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email) || clean.email.length > 150) errors.push('Email tidak valid.');
  if (clean.password.length < 10 || !/[A-Za-z]/.test(clean.password) || !/\d/.test(clean.password)) errors.push('Password minimal 10 karakter dan memuat huruf serta angka.');
  if (!clean.agreement) errors.push('Persetujuan ketentuan program wajib diberikan.');
  return { valid: errors.length === 0, errors: errors, data: clean };
}

function validateLogin_(input) {
  const identifier = sanitizeText_((input || {}).identifier, 150).toLowerCase();
  const password = String((input || {}).password || '');
  return { valid: identifier.length >= 4 && password.length >= 1, identifier: identifier, password: password };
}
