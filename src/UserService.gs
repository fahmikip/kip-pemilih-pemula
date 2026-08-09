function listPublicSchools() {
  try {
    const schools = readTable_('Schools').filter(item => item.Status === 'ACTIVE').map(item => ({schoolId:item.SchoolID,name:item.NamaSekolah,type:item.Jenis,district:item.Kecamatan})).sort((a,b) => a.name.localeCompare(b.name));
    return apiSuccess_({schools:schools});
  } catch (error) { console.error(error); return apiError_('Daftar sekolah belum tersedia.', 'SCHOOLS_UNAVAILABLE'); }
}

function validateStudent(adminToken, userId) {
  try {
    const admin = requireSession_(adminToken, ['ADMIN','SUPERADMIN']);
    const user = findOne_('Users','UserID',sanitizeText_(userId,40));
    if (!user || user.Role !== 'STUDENT') return apiError_('Peserta tidak ditemukan.', 'USER_NOT_FOUND');
    updateRecord_('Users','UserID',user.UserID,{Status:'ACTIVE',UpdatedAt:nowIso_()});
    logActivity_(admin.user.UserID,'ADMIN_UPDATE','Users',user.UserID,'Validasi akun peserta','');
    return apiSuccess_({}, 'Peserta berhasil divalidasi.');
  } catch (error) { return apiError_(error.message, error.publicCode || 'VALIDATION_FAILED'); }
}

function adminResetPassword(adminToken, userId, newPassword) {
  try {
    const admin = requireSession_(adminToken, ['ADMIN','SUPERADMIN']);
    const user = findOne_('Users','UserID',sanitizeText_(userId,40));
    if (!user) return apiError_('Pengguna tidak ditemukan.', 'USER_NOT_FOUND');
    if (user.Role !== 'STUDENT' && admin.user.Role !== 'SUPERADMIN') return apiError_('Hanya superadmin yang dapat mereset akun administrator.', 'FORBIDDEN');
    const credential = createPasswordRecord_(String(newPassword || ''));
    updateRecord_('Users','UserID',user.UserID,{PasswordHash:credential.PasswordHash,PasswordSalt:credential.PasswordSalt,UpdatedAt:nowIso_()});
    revokeUserSessions_(user.UserID);
    logActivity_(admin.user.UserID,'ADMIN_UPDATE','Users',user.UserID,'Reset password dan pencabutan sesi','');
    return apiSuccess_({}, 'Password berhasil direset dan semua sesi pengguna dicabut.');
  } catch (error) { return apiError_(error.publicCode ? error.message : 'Reset password gagal.', error.publicCode || 'RESET_FAILED'); }
}
