function findPointTransaction_(userId,sourceType,sourceId){return readTable_('PointTransactions').find(item=>item.UserID===userId&&item.SourceType===sourceType&&item.SourceID===sourceId&&item.Status==='VALID')||null;}

function appendPointOnce_(userId,seasonId,sourceType,sourceId,point,description){
  const existing=findPointTransaction_(userId,sourceType,sourceId);if(existing)return existing;
  const record={PointID:generateId_('PointTransactions'),UserID:userId,SeasonID:seasonId||'',SourceType:sourceType,SourceID:sourceId,Point:Number(point),Description:sanitizeText_(description,500),CreatedAt:nowIso_(),Status:'VALID'};
  appendRecords_('PointTransactions',[record]);return record;
}

function calculateUserPoint_(userId,seasonId){return readTable_('PointTransactions').filter(item=>item.UserID===userId&&item.Status==='VALID'&&(!seasonId||item.SeasonID===seasonId)).reduce((sum,item)=>sum+Number(item.Point||0),0);}

function refreshUserPointCache_(userId){const total=calculateUserPoint_(userId,'');updateRecord_('Users','UserID',userId,{TotalPointCache:total,UpdatedAt:nowIso_()});return total;}

function awardQuizPoints_(session,basePoint,correct,totalQuestions){
  const base=appendPointOnce_(session.UserID,session.SeasonID,'QUIZ',session.SessionID,basePoint,'Point jawaban benar quiz');
  const completeBonus=Math.max(0,Number(getSetting_('COMPLETE_QUIZ_BONUS','0'))),perfectBonus=Math.max(0,Number(getSetting_('PERFECT_SCORE_BONUS','0')));
  const bonuses=[];
  if(completeBonus>0)bonuses.push(appendPointOnce_(session.UserID,session.SeasonID,'BONUS',session.SessionID+':COMPLETE',completeBonus,'Bonus menyelesaikan quiz'));
  if(totalQuestions>0&&correct===totalQuestions&&perfectBonus>0)bonuses.push(appendPointOnce_(session.UserID,session.SeasonID,'BONUS',session.SessionID+':PERFECT',perfectBonus,'Bonus perfect score'));
  const bonus=bonuses.reduce((sum,item)=>sum+Number(item.Point||0),0),balance=refreshUserPointCache_(session.UserID);
  CacheService.getScriptCache().remove('leaderboard:'+session.SeasonID);
  return {quizPoint:Number(base.Point||0),bonus:bonus,totalAwarded:Number(base.Point||0)+bonus,totalBalance:balance};
}

function getPointHistory(token,seasonId){
  try{const auth=requireSession_(token,['STUDENT']),id=sanitizeText_(seasonId,40),rows=readTable_('PointTransactions').filter(item=>item.UserID===auth.user.UserID&&item.Status==='VALID'&&(!id||item.SeasonID===id)).sort((a,b)=>String(b.CreatedAt).localeCompare(String(a.CreatedAt))).slice(0,100).map(item=>({pointId:item.PointID,seasonId:item.SeasonID,sourceType:item.SourceType,point:Number(item.Point),description:item.Description,createdAt:item.CreatedAt}));return apiSuccess_({transactions:rows,total:rows.reduce((sum,item)=>sum+item.point,0)});}catch(error){return apiError_(error.message,error.publicCode||'POINT_HISTORY_FAILED');}
}

function adminAdjustPoint(adminToken,payload){
  try{const admin=requireSession_(adminToken,['ADMIN','SUPERADMIN']),data=payload||{},userId=sanitizeText_(data.userId,40),seasonId=sanitizeText_(data.seasonId,40),point=Number(data.point),reason=sanitizeText_(data.reason,500);if(!findOne_('Users','UserID',userId))return apiError_('Peserta tidak ditemukan.','USER_NOT_FOUND');if(seasonId&&!findOne_('Seasons','SeasonID',seasonId))return apiError_('Season tidak ditemukan.','SEASON_NOT_FOUND');if(!Number.isInteger(point)||point===0||Math.abs(point)>10000)return apiError_('Nilai penyesuaian point tidak valid.','VALIDATION_ERROR');if(reason.length<5)return apiError_('Alasan penyesuaian wajib diisi.','VALIDATION_ERROR');return withDocumentLock_(function(){const sourceType=point<0?'PENALTY':'ADMIN',sourceId='ADJ_'+Utilities.getUuid().replace(/-/g,''),transaction=appendPointOnce_(userId,seasonId,sourceType,sourceId,point,reason),balance=refreshUserPointCache_(userId);logActivity_(admin.user.UserID,'ADMIN_UPDATE','PointTransactions',transaction.PointID,'Penyesuaian point untuk '+userId+': '+point+' — '+reason,'');return apiSuccess_({pointId:transaction.PointID,balance:balance},'Point berhasil disesuaikan.');});}catch(error){return apiError_(error.publicCode?error.message:'Penyesuaian point gagal.',error.publicCode||'POINT_ADJUST_FAILED');}
}

function reconcilePointCaches(adminToken){
  try{const admin=requireSession_(adminToken,['ADMIN','SUPERADMIN']);return withDocumentLock_(function(){const sheet=getDatabase_().getSheetByName('Users'),values=sheet.getDataRange().getValues(),headers=values[0],idColumn=headers.indexOf('UserID'),cacheColumn=headers.indexOf('TotalPointCache'),updatedColumn=headers.indexOf('UpdatedAt'),totals=readTable_('PointTransactions').filter(item=>item.Status==='VALID').reduce((map,item)=>{map[item.UserID]=(map[item.UserID]||0)+Number(item.Point||0);return map;},{}),timestamp=nowIso_();for(let row=1;row<values.length;row+=1){values[row][cacheColumn]=totals[values[row][idColumn]]||0;values[row][updatedColumn]=timestamp;}if(values.length>1)sheet.getRange(2,1,values.length-1,headers.length).setValues(values.slice(1));logActivity_(admin.user.UserID,'ADMIN_UPDATE','Users','POINT_CACHE','Rekonsiliasi cache point '+(values.length-1)+' pengguna','');return apiSuccess_({users:Math.max(0,values.length-1)},'Cache point berhasil direkonsiliasi.');});}catch(error){return apiError_(error.message,error.publicCode||'POINT_RECONCILE_FAILED');}
}
