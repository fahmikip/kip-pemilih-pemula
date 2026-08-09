function shuffle_(items){const result=items.slice();for(let index=result.length-1;index>0;index-=1){const swap=Math.floor(Math.random()*(index+1));const value=result[index];result[index]=result[swap];result[swap]=value;}return result;}

function quizExpired_(session,season){return Date.now()-new Date(session.StartedAt).getTime()>=Number(season.DurasiQuiz||1800)*1000;}

function expireQuiz_(session){updateRecord_('QuizSessions','SessionID',session.SessionID,{Status:'EXPIRED',FinishedAt:nowIso_(),UpdatedAt:nowIso_()});}

function quizPublicResult_(session){return {sessionId:session.SessionID,correct:Number(session.Correct||0),wrong:Number(session.Wrong||0),score:Number(session.Score||0),quizPoint:Number(session.QuizPoint===undefined?session.TotalPoint:session.QuizPoint),bonus:Number(session.Bonus||0),totalAwarded:Number(session.TotalPoint||0),totalBalance:Number(session.TotalBalance||0),duration:Number(session.Duration||0),status:session.Status};}

function prepareQuestion_(session,season,userId){
  const questionIds=JSON.parse(String(session.QuestionIDs||'[]'));
  const answers=readTable_('QuizAnswers').filter(item=>item.SessionID===session.SessionID);
  const answered=new Set(answers.filter(item=>item.Status==='ANSWERED').map(item=>item.QuestionID));
  const questionId=questionIds.find(id=>!answered.has(id));
  if(!questionId)return finalizeQuiz_(session,season);
  const question=findOne_('Questions','QuestionID',questionId);
  if(!question){updateRecord_('QuizSessions','SessionID',session.SessionID,{Status:'INVALID',UpdatedAt:nowIso_()});throw authError_('Sesi quiz tidak valid. Hubungi administrator.','QUIZ_INVALID');}
  let answer=answers.find(item=>item.QuestionID===questionId&&item.Status==='PENDING');
  let storedOptions;
  if(answer){storedOptions=JSON.parse(String(answer.PresentedOptions));}
  else{
    const base=['A','B','C','D'].map(key=>({id:randomToken_().slice(0,16),key:key,text:String(question['Pilihan'+key])}));
    storedOptions=season.RandomAnswer===false||String(season.RandomAnswer).toUpperCase()==='FALSE'?base:shuffle_(base);
    answer={AnswerID:generateId_('QuizAnswers'),SessionID:session.SessionID,UserID:userId,QuestionID:questionId,PresentedOptions:safeJson_(storedOptions),SelectedOptionID:'',IsCorrect:'',Point:0,AnsweredAt:'',Nonce:randomToken_(),Status:'PENDING'};
    appendRecords_('QuizAnswers',[answer]);updateRecord_('QuizSessions','SessionID',session.SessionID,{AnswerNonce:answer.Nonce,UpdatedAt:nowIso_()});
  }
  const remaining=Math.max(0,Number(season.DurasiQuiz||1800)-Math.floor((Date.now()-new Date(session.StartedAt).getTime())/1000));
  return {completed:false,question:{answerId:answer.AnswerID,nonce:answer.Nonce,category:question.Kategori,text:question.Pertanyaan,options:storedOptions.map(option=>({id:option.id,text:option.text})),position:answered.size+1,total:questionIds.length,remainingSeconds:remaining}};
}

function finalizeQuiz_(session,season){
  const answers=readTable_('QuizAnswers').filter(item=>item.SessionID===session.SessionID&&item.Status==='ANSWERED');
  const correct=answers.filter(item=>item.IsCorrect===true||String(item.IsCorrect).toUpperCase()==='TRUE').length,wrong=answers.length-correct,total=JSON.parse(String(session.QuestionIDs||'[]')).length;
  if(answers.length<total)return {completed:false};
  const finished=nowIso_(),duration=Math.max(0,Math.floor((Date.now()-new Date(session.StartedAt).getTime())/1000)),score=total?Math.round(correct/total*100):0,point=answers.reduce((sum,item)=>sum+Number(item.Point||0),0),award=awardQuizPoints_(session,point,correct,total);
  if(total>0&&duration<total*3)recordFraudOnce_(session.UserID,session.SessionID,'UNREALISTIC_DURATION','Quiz diselesaikan lebih cepat dari ambang review',{duration:duration,questions:total});
  updateRecord_('QuizSessions','SessionID',session.SessionID,{FinishedAt:finished,Correct:correct,Wrong:wrong,Score:score,Bonus:award.bonus,TotalPoint:award.totalAwarded,Duration:duration,Status:'COMPLETED',AnswerNonce:'',UpdatedAt:finished});
  const result=Object.assign({},session,{FinishedAt:finished,Correct:correct,Wrong:wrong,Score:score,QuizPoint:award.quizPoint,Bonus:award.bonus,TotalPoint:award.totalAwarded,TotalBalance:award.totalBalance,Duration:duration,Status:'COMPLETED'});
  logActivity_(session.UserID,'FINISH_QUIZ','QuizSessions',session.SessionID,'Quiz selesai dengan score '+score,'');
  return {completed:true,result:quizPublicResult_(result)};
}

function startQuiz(token,clientInfo){
  try{
    const auth=requireSession_(token,['STUDENT']);
    if(!checkActionRate_(auth.user.UserID,'START_QUIZ',10,60))return apiError_('Terlalu banyak request. Coba kembali sebentar lagi.','RATE_LIMITED');
    return withDocumentLock_(function(){
      const season=resolveActiveSeason_();if(!season)return apiError_('Belum ada season aktif.','NO_ACTIVE_SEASON');
      const all=readTable_('QuizSessions').filter(item=>item.UserID===auth.user.UserID&&item.SeasonID===season.SeasonID);
      let active=all.find(item=>item.Status==='STARTED');
      if(active&&quizExpired_(active,season)){expireQuiz_(active);active=null;}
      if(!active&&all.filter(item=>item.Status!=='INVALID').length>=Number(season.MaxAttempt||1))return apiError_('Batas percobaan quiz telah tercapai.','MAX_ATTEMPT_REACHED');
      if(!active){
        const questions=readTable_('Questions').filter(item=>item.Status==='ACTIVE');if(questions.length<Number(season.JumlahSoal))return apiError_('Soal quiz belum tersedia.','INSUFFICIENT_QUESTIONS');
        const selected=(season.RandomQuestion===false||String(season.RandomQuestion).toUpperCase()==='FALSE'?questions:shuffle_(questions)).slice(0,Number(season.JumlahSoal)).map(item=>item.QuestionID),timestamp=nowIso_();
        active={SessionID:generateId_('QuizSessions'),UserID:auth.user.UserID,SeasonID:season.SeasonID,StartedAt:timestamp,QuestionIDs:safeJson_(selected),Correct:0,Wrong:0,Score:0,Bonus:0,TotalPoint:0,Duration:0,Status:'STARTED',UserAgent:sanitizeText_((clientInfo||{}).userAgent,250),DeviceID:sanitizeText_((clientInfo||{}).deviceId,100),AnswerNonce:'',UpdatedAt:timestamp};appendRecords_('QuizSessions',[active]);logActivity_(auth.user.UserID,'START_QUIZ','QuizSessions',active.SessionID,'Memulai quiz',active.DeviceID);
      }
      const state=prepareQuestion_(active,season,auth.user.UserID);return apiSuccess_({sessionId:active.SessionID,seasonName:season.NamaSeason,completed:state.completed,question:state.question||null,result:state.result||null},active===all.find(item=>item.Status==='STARTED')?'Sesi quiz dilanjutkan.':'Quiz dimulai.');
    });
  }catch(error){console.error(error);return apiError_(error.publicCode?error.message:'Quiz gagal dimulai.',error.publicCode||'QUIZ_START_FAILED');}
}

function submitQuizAnswer(token,payload){
  try{
    const auth=requireSession_(token,['STUDENT']);
    if(!checkActionRate_(auth.user.UserID,'SUBMIT_ANSWER',90,60))return apiError_('Terlalu banyak request. Coba kembali sebentar lagi.','RATE_LIMITED');
    return withDocumentLock_(function(){
      const data=payload||{},session=findOne_('QuizSessions','SessionID',sanitizeText_(data.sessionId,40));
      if(!session||session.UserID!==auth.user.UserID){recordFraudOnce_(auth.user.UserID,sanitizeText_(data.sessionId,40),'PARAMETER_MANIPULATION','Percobaan menggunakan sesi quiz yang tidak dimiliki',{sessionId:sanitizeText_(data.sessionId,40)});return apiError_('Sesi quiz tidak ditemukan.','QUIZ_SESSION_NOT_FOUND');}
      if(session.Status!=='STARTED')return apiError_('Sesi quiz sudah ditutup.','QUIZ_SESSION_CLOSED');
      const season=findOne_('Seasons','SeasonID',session.SeasonID);if(!season)return apiError_('Season tidak ditemukan.','SEASON_NOT_FOUND');
      if(quizExpired_(session,season)){expireQuiz_(session);return apiError_('Waktu quiz telah habis.','QUIZ_EXPIRED');}
      const answer=findOne_('QuizAnswers','AnswerID',sanitizeText_(data.answerId,40));
      if(!answer||answer.SessionID!==session.SessionID||answer.UserID!==auth.user.UserID)return apiError_('Jawaban tidak valid.','ANSWER_INVALID');
      if(answer.Status!=='PENDING'){recordFraudOnce_(auth.user.UserID,session.SessionID,'ANSWER_REPLAY','Jawaban yang sama dikirim ulang',{answerId:answer.AnswerID});return apiError_('Jawaban sudah pernah dikirim.','ANSWER_REPLAY');}
      if(!constantTimeEqual_(answer.Nonce,sanitizeText_(data.nonce,100))){recordFraudOnce_(auth.user.UserID,session.SessionID,'NONCE_INVALID','Nonce jawaban tidak valid',{answerId:answer.AnswerID});return apiError_('Token jawaban tidak valid.','ANSWER_NONCE_INVALID');}
      const options=JSON.parse(String(answer.PresentedOptions)),selected=options.find(item=>item.id===sanitizeText_(data.optionId,40));if(!selected){recordFraudOnce_(auth.user.UserID,session.SessionID,'OPTION_INVALID','Option ID tidak terdapat pada opsi yang disajikan',{answerId:answer.AnswerID});return apiError_('Pilihan jawaban tidak valid.','OPTION_INVALID');}
      const question=findOne_('Questions','QuestionID',answer.QuestionID);if(!question)return apiError_('Soal tidak ditemukan.','QUESTION_NOT_FOUND');
      const correct=selected.key===question.JawabanBenar,point=correct?Number(question.Point||season.PoinPerSoal||0):0,timestamp=nowIso_();
      updateRecord_('QuizAnswers','AnswerID',answer.AnswerID,{SelectedOptionID:selected.id,IsCorrect:correct,Point:point,AnsweredAt:timestamp,Status:'ANSWERED'});updateRecord_('QuizSessions','SessionID',session.SessionID,{AnswerNonce:'',UpdatedAt:timestamp});logActivity_(auth.user.UserID,'ANSWER_QUESTION','QuizAnswers',answer.AnswerID,'Mengirim jawaban quiz','');
      const fresh=Object.assign({},session,{UpdatedAt:timestamp}),next=prepareQuestion_(fresh,season,auth.user.UserID),show=season.ShowExplanation==='AFTER_ANSWER';
      return apiSuccess_({correct:correct,earnedPoint:point,explanation:show?question.Pembahasan:'',correctAnswer:show?String(question['Pilihan'+question.JawabanBenar]):'',completed:next.completed,nextQuestion:next.question||null,result:next.result||null},next.completed?'Quiz selesai.':correct?'Jawaban benar.':'Jawaban belum tepat.');
    });
  }catch(error){console.error(error);return apiError_(error.publicCode?error.message:'Jawaban gagal dikirim.',error.publicCode||'ANSWER_SUBMIT_FAILED');}
}
