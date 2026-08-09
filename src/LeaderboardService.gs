function assignCompetitionRanks_(rows,valueField){let previous=null,rank=0;return rows.map((item,index)=>{const value=Number(item[valueField]||0);if(previous===null||value!==previous)rank=index+1;previous=value;return Object.assign({rank:rank},item);});}

function leaderboardSeason_(seasonId){if(seasonId){const season=findOne_('Seasons','SeasonID',seasonId);if(!season)throw authError_('Season tidak ditemukan.','SEASON_NOT_FOUND');return season;}return resolveActiveSeason_();}

function buildLeaderboard_(seasonId){
  const valid=readTable_('PointTransactions').filter(item=>item.Status==='VALID'&&item.SeasonID===seasonId),totals=valid.reduce((map,item)=>{map[item.UserID]=(map[item.UserID]||0)+Number(item.Point||0);return map;},{}),schools=readTable_('Schools').reduce((map,item)=>{map[item.SchoolID]=item.NamaSekolah;return map;},{}),rows=readTable_('Users').filter(item=>item.Role==='STUDENT'&&item.Status==='ACTIVE').map(user=>({userId:user.UserID,schoolId:user.SchoolID,name:maskPublicName_(user.Name),school:schools[user.SchoolID]||'',point:Number(totals[user.UserID]||0)})).sort((a,b)=>b.point-a.point||a.name.localeCompare(b.name));
  return assignCompetitionRanks_(rows,'point');
}

function publicParticipantRows_(rows){return rows.map(item=>({rank:item.rank,name:item.name,school:item.school,point:item.point}));}

function buildSchoolLeaderboard_(seasonId){
  const users=readTable_('Users').filter(item=>item.Role==='STUDENT'&&item.Status==='ACTIVE'),userSchool=users.reduce((map,item)=>{map[item.UserID]=item.SchoolID;return map;},{}),schools=readTable_('Schools').filter(item=>item.Status==='ACTIVE'),valid=readTable_('PointTransactions').filter(item=>item.Status==='VALID'&&item.SeasonID===seasonId),completed=readTable_('QuizSessions').filter(item=>item.Status==='COMPLETED'&&item.SeasonID===seasonId),stats={};
  schools.forEach(school=>stats[school.SchoolID]={schoolId:school.SchoolID,school:school.NamaSekolah,point:0,participants:0,activeParticipants:new Set(),quizCompleted:0,scoreTotal:0});
  users.forEach(user=>{if(stats[user.SchoolID])stats[user.SchoolID].participants+=1;});
  valid.forEach(item=>{const schoolId=userSchool[item.UserID];if(stats[schoolId]){stats[schoolId].point+=Number(item.Point||0);stats[schoolId].activeParticipants.add(item.UserID);}});
  completed.forEach(item=>{const schoolId=userSchool[item.UserID];if(stats[schoolId]){stats[schoolId].quizCompleted+=1;stats[schoolId].scoreTotal+=Number(item.Score||0);stats[schoolId].activeParticipants.add(item.UserID);}});
  const rows=Object.keys(stats).map(id=>{const item=stats[id];return {schoolId:item.schoolId,school:item.school,point:item.point,participants:item.participants,activeParticipants:item.activeParticipants.size,quizCompleted:item.quizCompleted,averageScore:item.quizCompleted?Math.round(item.scoreTotal/item.quizCompleted*10)/10:0};}).sort((a,b)=>b.point-a.point||b.quizCompleted-a.quizCompleted||a.school.localeCompare(b.school));
  return assignCompetitionRanks_(rows,'point');
}

function getLeaderboard(token,seasonId,limit){
  try{const auth=requireSession_(token,['STUDENT','ADMIN','SUPERADMIN']);if(getSetting_('SHOW_LEADERBOARD','TRUE')!=='TRUE'&&auth.user.Role==='STUDENT')return apiError_('Leaderboard sedang disembunyikan.','LEADERBOARD_HIDDEN');const season=leaderboardSeason_(sanitizeText_(seasonId,40));if(!season)return apiSuccess_({season:null,rows:[],myRank:null});const rows=buildLeaderboard_(season.SeasonID),max=Math.min(50,Math.max(10,Number(limit)||50)),own=rows.find(item=>item.userId===auth.user.UserID);return apiSuccess_({season:{id:season.SeasonID,name:season.NamaSeason},rows:publicParticipantRows_(rows.slice(0,max)),myRank:own?{rank:own.rank,point:own.point}:null});}catch(error){return apiError_(error.message,error.publicCode||'LEADERBOARD_FAILED');}
}

function getSchoolLeaderboard(token,seasonId,limit){
  try{const auth=requireSession_(token,['STUDENT','ADMIN','SUPERADMIN']);if(getSetting_('SHOW_SCHOOL_RANK','TRUE')!=='TRUE'&&auth.user.Role==='STUDENT')return apiError_('Leaderboard sekolah sedang disembunyikan.','LEADERBOARD_HIDDEN');const season=leaderboardSeason_(sanitizeText_(seasonId,40));if(!season)return apiSuccess_({season:null,rows:[]});return apiSuccess_({season:{id:season.SeasonID,name:season.NamaSeason},rows:buildSchoolLeaderboard_(season.SeasonID).slice(0,Math.min(50,Math.max(10,Number(limit)||50)))});}catch(error){return apiError_(error.message,error.publicCode||'SCHOOL_LEADERBOARD_FAILED');}
}

function getPublicLeaderboard(seasonId){
  try{if(getSetting_('SHOW_LEADERBOARD','TRUE')!=='TRUE')return apiSuccess_({season:null,rows:[]});const season=leaderboardSeason_(sanitizeText_(seasonId,40));if(!season)return apiSuccess_({season:null,rows:[]});const cache=CacheService.getScriptCache(),key='leaderboard:'+season.SeasonID,cached=cache.get(key);if(cached)return apiSuccess_(JSON.parse(cached));const data={season:{id:season.SeasonID,name:season.NamaSeason},rows:publicParticipantRows_(buildLeaderboard_(season.SeasonID).slice(0,3))};cache.put(key,JSON.stringify(data),APP.CACHE_SECONDS);return apiSuccess_(data);}catch(error){return apiError_('Leaderboard belum tersedia.','LEADERBOARD_FAILED');}
}
