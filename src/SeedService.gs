function seedDemoData() {
  return withDocumentLock_(function () {
    getDatabase_();
    const timestamp = nowIso_();
    const schoolNames = ['SMAN 1 Nusantara','MAN 1 Nusantara','SMKN 1 Nusantara','SMA Harapan Bangsa','SMA Pertiwi'];
    const schools = readTable_('Schools');
    const newSchools = schoolNames.filter(name => !schools.some(item => item.NamaSekolah === name)).map((name, index) => ({
      SchoolID: generateId_('Schools'), NamaSekolah:name, NPSN:'9900000' + (index + 1), Jenis:index === 1 ? 'MA' : index === 2 ? 'SMK' : 'SMA',
      Alamat:'Alamat sekolah demo', Kecamatan:'Kecamatan Demo', Status:'ACTIVE', CreatedAt:timestamp, UpdatedAt:timestamp
    }));
    appendRecords_('Schools', newSchools);

    const questionTemplates = [
      ['Dasar Pemilu','Apa asas pemilu di Indonesia?','Langsung, umum, bebas, rahasia, jujur, dan adil','Cepat dan seragam','Wajib dan terbuka','Bebas tanpa aturan'],
      ['Hak Pemilih','Siapa yang berhak menggunakan hak pilih?','Warga yang memenuhi syarat dalam peraturan','Semua wisatawan','Hanya pejabat','Hanya anggota partai'],
      ['Anti Hoaks','Apa langkah awal saat menerima informasi pemilu yang meragukan?','Periksa sumber resmi dan bukti','Langsung sebarkan','Hapus semua pesan','Percaya pada judul'],
      ['Demokrasi','Mengapa perbedaan pilihan perlu dihormati?','Karena pilihan politik adalah hak warga','Karena semua pilihan sama persis','Agar tidak perlu berdiskusi','Karena pilihan harus dirahasiakan dari petugas'],
      ['Penyelenggara Pemilu','Sikap tepat terhadap informasi tahapan pemilu adalah?','Merujuk kanal resmi penyelenggara','Mengikuti akun anonim','Memilih berita paling viral','Menunggu rumor']
    ];
    const existingQuestions = readTable_('Questions');
    const questions = [];
    for (let index = 0; index < 20; index += 1) {
      const template = questionTemplates[index % questionTemplates.length];
      const text = template[1] + ' (Demo ' + (index + 1) + ')';
      if (!existingQuestions.some(item => item.Pertanyaan === text)) questions.push({
        QuestionID:generateId_('Questions'), Kategori:template[0], Pertanyaan:text,
        PilihanA:template[2], PilihanB:template[3], PilihanC:template[4], PilihanD:template[5],
        JawabanBenar:'A', Pembahasan:'Pelajari materi resmi dan verifikasi informasi secara kritis.',
        Difficulty:index % 3 === 0 ? 'MEDIUM' : 'EASY', Point:10, Status:'ACTIVE', CreatedAt:timestamp, UpdatedAt:timestamp
      });
    }
    appendRecords_('Questions', questions);

    if (!readTable_('Seasons').some(item => item.NamaSeason === 'Season Demo — Kenali Hak Pilihmu')) {
      const start = Utilities.formatDate(new Date(), APP.TIME_ZONE, 'yyyy-MM-01');
      const endDate = new Date(); endDate.setMonth(endDate.getMonth() + 1, 0);
      const seasonId = generateId_('Seasons');
      appendRecords_('Seasons', [{SeasonID:seasonId, NamaSeason:'Season Demo — Kenali Hak Pilihmu', Tema:'Kenali Hak Pilihmu', Deskripsi:'Season demo nonpartisan.', TanggalMulai:start, TanggalSelesai:Utilities.formatDate(endDate, APP.TIME_ZONE, 'yyyy-MM-dd'), Status:'ACTIVE', Reward:'Pulsa Rp100.000', JumlahSoal:10, PoinPerSoal:10, MaxAttempt:1, DurasiQuiz:1800, RandomQuestion:true, RandomAnswer:true, ShowExplanation:'AFTER_ANSWER', CreatedAt:timestamp, UpdatedAt:timestamp}]);
      upsertSetting_('ACTIVE_SEASON', seasonId, 'STRING', 'Season aktif manual', 'SYSTEM');
    }

    const materials = ['Kenali Hak Pilihmu','Pemilih Pemula','Waspada Hoaks','Demokrasi dan Partisipasi','Mengenal Penyelenggara Pemilu'];
    const existingMaterials = readTable_('Materials');
    appendRecords_('Materials', materials.filter(title => !existingMaterials.some(item => item.Title === title)).map(title => ({MaterialID:generateId_('Materials'),Title:title,Category:'Edukasi',Content:'Materi demo netral untuk pengembangan awal.',Status:'PUBLISHED',PublishedAt:timestamp,CreatedAt:timestamp,UpdatedAt:timestamp})));
    const announcements = ['Quiz bulan ini telah dibuka!','Pelajari materi sebelum mengikuti challenge.','Jaga kerahasiaan akun dan password.'];
    const existingAnnouncements = readTable_('Announcements');
    appendRecords_('Announcements', announcements.filter(title => !existingAnnouncements.some(item => item.Title === title)).map(title => ({AnnouncementID:generateId_('Announcements'),Title:title,Content:title,Audience:'ALL',Status:'PUBLISHED',PublishedAt:timestamp,CreatedAt:timestamp,UpdatedAt:timestamp})));
    return apiSuccess_({schools:newSchools.length, questions:questions.length}, 'Data demo selesai dibuat tanpa duplikasi.');
  });
}
