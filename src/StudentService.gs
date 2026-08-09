function resolveActiveSeason_() {
  const today = Utilities.formatDate(new Date(), APP.TIME_ZONE, 'yyyy-MM-dd');
  const seasons = readTable_('Seasons');
  const manualId = getSetting_('ACTIVE_SEASON', '');
  const manual = manualId ? seasons.find(item => item.SeasonID === manualId && item.Status === 'ACTIVE') : null;
  return manual || seasons.find(item => ['ACTIVE','SCHEDULED'].indexOf(item.Status)>=0 && dateOnly_(item.TanggalMulai) <= today && dateOnly_(item.TanggalSelesai) >= today) || null;
}

function maskPublicName_(name) {
  const parts = sanitizeText_(name,100).split(/\s+/).filter(Boolean);
  if (getSetting_('MASK_PUBLIC_NAME','TRUE') !== 'TRUE' || parts.length < 2) return parts[0] || 'Peserta';
  return parts[0] + ' ' + parts.slice(1).map(item => item.charAt(0).toUpperCase() + '.').join(' ');
}

function getStudentDashboard(token) {
  try {
    const auth = requireSession_(token, ['STUDENT']);
    const user = auth.user, season = resolveActiveSeason_();
    const leaderboard = season ? buildLeaderboard_(season.SeasonID) : [];
    const leaderboardVisible = getSetting_('SHOW_LEADERBOARD','TRUE') === 'TRUE';
    const ownRank = leaderboard.find(item => item.userId === user.UserID);
    const sessions = season ? readTable_('QuizSessions').filter(item => item.UserID === user.UserID && item.SeasonID === season.SeasonID) : [];
    const completed = sessions.filter(item => item.Status === 'COMPLETED').length;
    const maxAttempt = season ? Number(season.MaxAttempt || 1) : 0;
    const progress = maxAttempt ? Math.min(100, Math.round(completed / maxAttempt * 100)) : 0;
    const materials = readTable_('Materials').filter(item => item.Status === 'PUBLISHED').sort((a,b) => String(b.PublishedAt).localeCompare(String(a.PublishedAt))).slice(0,5).map(item => ({id:item.MaterialID,title:item.Title,category:item.Category,thumbnail:item.Thumbnail || '',content:item.Content,videoUrl:item.VideoURL || ''}));
    const now = Date.now();
    const announcements = readTable_('Announcements').filter(item => item.Status === 'PUBLISHED' && ['ALL','STUDENT'].indexOf(item.Audience)>=0 && (!item.ExpiresAt || new Date(item.ExpiresAt+'T23:59:59').getTime() >= now)).sort((a,b) => String(b.PublishedAt).localeCompare(String(a.PublishedAt))).slice(0,5).map(item => ({id:item.AnnouncementID,title:item.Title,content:item.Content,publishedAt:item.PublishedAt}));
    return apiSuccess_({
      user:publicUser_(user), point:ownRank ? ownRank.point : 0, rank:leaderboardVisible&&ownRank ? ownRank.rank : null,
      season:season ? {id:season.SeasonID,name:season.NamaSeason,theme:season.Tema,description:season.Deskripsi,start:season.TanggalMulai,end:season.TanggalSelesai,maxAttempt:maxAttempt} : null,
      progress:progress, completedQuiz:completed,
      topThree:leaderboardVisible?leaderboard.slice(0,3).map(item => ({rank:item.rank,name:item.name,school:item.school,point:item.point})):[],
      leaderboard:leaderboardVisible?leaderboard.slice(0,50).map(item => ({rank:item.rank,name:item.name,school:item.school,point:item.point})):[],
      materials:materials, announcements:announcements, latestWinner:publicWinners_().slice(0,1)[0]||null
    });
  } catch (error) { console.error(error); return apiError_(error.publicCode ? error.message : 'Dashboard gagal dimuat.', error.publicCode || 'DASHBOARD_FAILED'); }
}

function getStudentProfile(token) {
  try {
    const user = requireSession_(token,['STUDENT']).user;
    const school = findOne_('Schools','SchoolID',user.SchoolID);
    return apiSuccess_({profile:{name:user.Name,nis:user.NIS,school:school ? school.NamaSekolah : '',className:user.Class,birthDate:String(user.BirthDate || '').slice(0,10),gender:user.Gender || '',whatsapp:user.WhatsApp,email:user.Email,status:user.Status,createdAt:user.CreatedAt}});
  } catch (error) { return apiError_(error.message, error.publicCode || 'PROFILE_FAILED'); }
}
