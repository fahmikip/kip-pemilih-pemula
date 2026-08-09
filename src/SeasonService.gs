function seasonRecord_(data,id,createdAt) {
  const timestamp=nowIso_();
  return {SeasonID:id,NamaSeason:data.name,Tema:data.theme,Deskripsi:data.description,TanggalMulai:data.startDate,TanggalSelesai:data.endDate,Status:data.status,Reward:data.reward,JumlahSoal:data.questionCount,PoinPerSoal:data.pointPerQuestion,MaxAttempt:data.maxAttempt,DurasiQuiz:data.durationSeconds,RandomQuestion:data.randomQuestion,RandomAnswer:data.randomAnswer,ShowExplanation:data.showExplanation,CreatedAt:createdAt||timestamp,UpdatedAt:timestamp};
}

function listSeasons(adminToken) {
  try { requireSession_(adminToken,['ADMIN','SUPERADMIN']); return apiSuccess_({seasons:readTable_('Seasons').sort((a,b)=>dateOnly_(b.TanggalMulai).localeCompare(dateOnly_(a.TanggalMulai)))}); }
  catch(error){return apiError_(error.message,error.publicCode||'SEASON_LIST_FAILED');}
}

function createSeason(adminToken,payload) {
  try {
    const admin=requireSession_(adminToken,['ADMIN','SUPERADMIN']), result=validateSeason_(payload);
    if(!result.valid)return apiError_(result.errors[0],'VALIDATION_ERROR');
    const id=generateId_('Seasons'); appendRecords_('Seasons',[seasonRecord_(result.data,id)]);
    logActivity_(admin.user.UserID,'ADMIN_UPDATE','Seasons',id,'Membuat season','');
    return apiSuccess_({seasonId:id},'Season berhasil dibuat.');
  } catch(error){console.error(error);return apiError_(error.publicCode?error.message:'Season gagal dibuat.',error.publicCode||'SEASON_CREATE_FAILED');}
}

function updateSeason(adminToken,seasonId,payload) {
  try {
    const admin=requireSession_(adminToken,['ADMIN','SUPERADMIN']), id=sanitizeText_(seasonId,40), existing=findOne_('Seasons','SeasonID',id);
    if(!existing)return apiError_('Season tidak ditemukan.','SEASON_NOT_FOUND');
    if(existing.Status==='ACTIVE')return apiError_('Nonaktifkan season sebelum mengubah konfigurasi quiz.','ACTIVE_SEASON_LOCKED');
    const result=validateSeason_(payload); if(!result.valid)return apiError_(result.errors[0],'VALIDATION_ERROR');
    updateRecord_('Seasons','SeasonID',id,seasonRecord_(result.data,id,existing.CreatedAt));
    logActivity_(admin.user.UserID,'ADMIN_UPDATE','Seasons',id,'Memperbarui season','');
    return apiSuccess_({},'Season berhasil diperbarui.');
  } catch(error){return apiError_(error.publicCode?error.message:'Season gagal diperbarui.',error.publicCode||'SEASON_UPDATE_FAILED');}
}

function activateSeason(adminToken,seasonId) {
  try {
    const admin=requireSession_(adminToken,['ADMIN','SUPERADMIN']), id=sanitizeText_(seasonId,40);
    return withDocumentLock_(function(){
      const seasons=readTable_('Seasons'), target=seasons.find(item=>item.SeasonID===id);
      if(!target)return apiError_('Season tidak ditemukan.','SEASON_NOT_FOUND');
      if(dateOnly_(target.TanggalSelesai)<Utilities.formatDate(new Date(),APP.TIME_ZONE,'yyyy-MM-dd'))return apiError_('Season yang sudah berakhir tidak dapat diaktifkan.','SEASON_ENDED');
      const activeQuestionCount=readTable_('Questions').filter(item=>item.Status==='ACTIVE').length;
      if(activeQuestionCount<Number(target.JumlahSoal))return apiError_('Soal aktif belum mencukupi kebutuhan season.','INSUFFICIENT_QUESTIONS');
      seasons.filter(item=>item.Status==='ACTIVE'&&item.SeasonID!==id).forEach(item=>updateRecord_('Seasons','SeasonID',item.SeasonID,{Status:'SCHEDULED',UpdatedAt:nowIso_()}));
      updateRecord_('Seasons','SeasonID',id,{Status:'ACTIVE',UpdatedAt:nowIso_()}); upsertSetting_('ACTIVE_SEASON',id,'STRING','Season aktif manual',admin.user.UserID); CacheService.getScriptCache().remove('setting:ACTIVE_SEASON');
      logActivity_(admin.user.UserID,'ADMIN_UPDATE','Seasons',id,'Mengaktifkan season',''); return apiSuccess_({seasonId:id},'Season berhasil diaktifkan.');
    });
  } catch(error){return apiError_(error.publicCode?error.message:'Season gagal diaktifkan.',error.publicCode||'SEASON_ACTIVATE_FAILED');}
}

function deactivateSeason(adminToken,seasonId) {
  try { const admin=requireSession_(adminToken,['ADMIN','SUPERADMIN']),id=sanitizeText_(seasonId,40),season=findOne_('Seasons','SeasonID',id);if(!season)return apiError_('Season tidak ditemukan.','SEASON_NOT_FOUND');updateRecord_('Seasons','SeasonID',id,{Status:'FINISHED',UpdatedAt:nowIso_()});if(getSetting_('ACTIVE_SEASON','')===id)upsertSetting_('ACTIVE_SEASON','','STRING','Season aktif manual',admin.user.UserID);CacheService.getScriptCache().remove('setting:ACTIVE_SEASON');logActivity_(admin.user.UserID,'ADMIN_UPDATE','Seasons',id,'Menonaktifkan season','');return apiSuccess_({},'Season dinonaktifkan.'); }
  catch(error){return apiError_(error.message,error.publicCode||'SEASON_DEACTIVATE_FAILED');}
}
