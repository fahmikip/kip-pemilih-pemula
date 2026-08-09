const DATABASE_SCHEMA = Object.freeze({
  Users: ['UserID','Name','NIS','SchoolID','Class','BirthDate','Gender','WhatsApp','Email','PasswordHash','PasswordSalt','Role','Status','TotalPointCache','FraudScore','CreatedAt','UpdatedAt','LastLogin'],
  Schools: ['SchoolID','NamaSekolah','NPSN','Jenis','Alamat','Kecamatan','Status','CreatedAt','UpdatedAt'],
  Seasons: ['SeasonID','NamaSeason','Tema','Deskripsi','TanggalMulai','TanggalSelesai','Status','Reward','JumlahSoal','PoinPerSoal','MaxAttempt','DurasiQuiz','RandomQuestion','RandomAnswer','ShowExplanation','CreatedAt','UpdatedAt'],
  Questions: ['QuestionID','Kategori','Pertanyaan','PilihanA','PilihanB','PilihanC','PilihanD','JawabanBenar','Pembahasan','Difficulty','Point','Status','CreatedAt','UpdatedAt'],
  QuizSessions: ['SessionID','UserID','SeasonID','StartedAt','FinishedAt','QuestionIDs','Correct','Wrong','Score','Bonus','TotalPoint','Duration','Status','IPAddress','UserAgent','DeviceID','AnswerNonce','UpdatedAt'],
  QuizAnswers: ['AnswerID','SessionID','UserID','QuestionID','PresentedOptions','SelectedOptionID','IsCorrect','Point','AnsweredAt','Nonce','Status'],
  PointTransactions: ['PointID','UserID','SeasonID','SourceType','SourceID','Point','Description','CreatedAt','Status'],
  Achievements: ['AchievementID','Code','Name','Description','Badge','BonusPoint','Status','CreatedAt','UpdatedAt'],
  UserAchievements: ['UserAchievementID','UserID','AchievementID','SeasonID','AwardedAt','PointTransactionID','Status'],
  Materials: ['MaterialID','Title','Category','Thumbnail','Content','VideoURL','Status','PublishedAt','CreatedAt','UpdatedAt'],
  Announcements: ['AnnouncementID','Title','Content','Audience','Status','PublishedAt','ExpiresAt','CreatedAt','UpdatedAt'],
  Winners: ['WinnerID','SeasonID','UserID','Rank','Point','Reward','StatusReward','SelectionStatus','ReviewNote','SelectedAt','SelectedBy'],
  Rewards: ['RewardID','SeasonID','NamaReward','Nominal','WinnerID','NomorTujuan','Provider','Status','TanggalKirim','Catatan','CreatedAt','UpdatedAt'],
  Sessions: ['SessionToken','UserID','Role','CreatedAt','ExpiredAt','Status','DeviceID','LastSeenAt'],
  FraudLogs: ['FraudLogID','UserID','SessionID','RuleCode','Score','RiskLevel','Description','Evidence','Status','CreatedAt','ReviewedAt','ReviewedBy'],
  ActivityLogs: ['LogID','UserID','Action','Entity','EntityID','Description','Device','Timestamp'],
  Settings: ['Key','Value','Type','Description','UpdatedAt','UpdatedBy']
});

const ID_PREFIX = Object.freeze({
  Users:'USR', Schools:'SCH', Seasons:'SEA', Questions:'QUE', QuizSessions:'QZS',
  QuizAnswers:'QAN', PointTransactions:'PNT', Achievements:'ACH', UserAchievements:'UAC',
  Materials:'MAT', Announcements:'ANN', Winners:'WIN', Rewards:'RWD',
  FraudLogs:'FRD', ActivityLogs:'LOG'
});
