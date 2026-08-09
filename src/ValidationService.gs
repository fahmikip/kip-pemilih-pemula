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

function validateSeason_(input) {
  const data = input || {};
  const clean = {
    name:sanitizeText_(data.name,120), theme:sanitizeText_(data.theme,100), description:sanitizeText_(data.description,1000),
    startDate:sanitizeText_(data.startDate,10), endDate:sanitizeText_(data.endDate,10), status:sanitizeText_(data.status || 'DRAFT',20).toUpperCase(),
    reward:sanitizeText_(data.reward,150), questionCount:Number(data.questionCount), pointPerQuestion:Number(data.pointPerQuestion),
    maxAttempt:Number(data.maxAttempt), durationSeconds:Number(data.durationSeconds), randomQuestion:data.randomQuestion !== false,
    randomAnswer:data.randomAnswer !== false, showExplanation:sanitizeText_(data.showExplanation || 'AFTER_ANSWER',30).toUpperCase()
  };
  const errors=[];
  if(clean.name.length<4)errors.push('Nama season minimal 4 karakter.');
  if(!clean.theme)errors.push('Tema season wajib diisi.');
  if(!isIsoDate_(clean.startDate)||!isIsoDate_(clean.endDate)||clean.startDate>clean.endDate)errors.push('Periode season tidak valid.');
  if(['DRAFT','SCHEDULED','FINISHED','ARCHIVED'].indexOf(clean.status)<0)errors.push('Status season tidak valid; gunakan fungsi aktivasi untuk status ACTIVE.');
  if(!Number.isInteger(clean.questionCount)||clean.questionCount<1||clean.questionCount>100)errors.push('Jumlah soal harus 1–100.');
  if(!Number.isInteger(clean.pointPerQuestion)||clean.pointPerQuestion<0||clean.pointPerQuestion>1000)errors.push('Poin per soal tidak valid.');
  if(!Number.isInteger(clean.maxAttempt)||clean.maxAttempt<1||clean.maxAttempt>10)errors.push('Maksimal percobaan harus 1–10.');
  if(!Number.isInteger(clean.durationSeconds)||clean.durationSeconds<60||clean.durationSeconds>10800)errors.push('Durasi quiz harus 60–10800 detik.');
  if(['AFTER_ANSWER','AFTER_QUIZ','NEVER'].indexOf(clean.showExplanation)<0)errors.push('Pengaturan pembahasan tidak valid.');
  return {valid:errors.length===0,errors:errors,data:clean};
}

function validateQuestion_(input) {
  const data=input||{};
  const clean={category:sanitizeText_(data.category,100),question:sanitizeText_(data.question,1000),optionA:sanitizeText_(data.optionA,500),optionB:sanitizeText_(data.optionB,500),optionC:sanitizeText_(data.optionC,500),optionD:sanitizeText_(data.optionD,500),correctAnswer:sanitizeText_(data.correctAnswer,1).toUpperCase(),explanation:sanitizeText_(data.explanation,2000),difficulty:sanitizeText_(data.difficulty||'EASY',20).toUpperCase(),point:Number(data.point),status:sanitizeText_(data.status||'ACTIVE',20).toUpperCase()};
  const errors=[];
  if(!clean.category)errors.push('Kategori wajib diisi.');
  if(clean.question.length<10)errors.push('Pertanyaan minimal 10 karakter.');
  if([clean.optionA,clean.optionB,clean.optionC,clean.optionD].some(item=>!item))errors.push('Empat pilihan jawaban wajib diisi.');
  if(new Set([clean.optionA,clean.optionB,clean.optionC,clean.optionD].map(item=>item.toLowerCase())).size!==4)errors.push('Pilihan jawaban tidak boleh sama.');
  if(['A','B','C','D'].indexOf(clean.correctAnswer)<0)errors.push('Jawaban benar harus A, B, C, atau D.');
  if(['EASY','MEDIUM','HARD'].indexOf(clean.difficulty)<0)errors.push('Difficulty tidak valid.');
  if(!Number.isInteger(clean.point)||clean.point<0||clean.point>1000)errors.push('Point soal tidak valid.');
  if(['ACTIVE','INACTIVE'].indexOf(clean.status)<0)errors.push('Status soal tidak valid.');
  return {valid:errors.length===0,errors:errors,data:clean};
}
