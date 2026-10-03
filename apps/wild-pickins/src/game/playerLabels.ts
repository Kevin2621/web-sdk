import sweeps from './sweepsLabels';
const labels:Record<string,string[]>= {
 en:['BET','BALANCE','SPIN','STOP','AUTO SPIN','SPEED','MASTER VOLUME','MUSIC VOLUME','PAYLINES','PAYLINE','PAYTABLE','BASE','BONUS','FREE SPINS','Simulated play'],
 ar:['الرهان','الرصيد','تدوير','إيقاف','تدوير تلقائي','السرعة','مستوى الصوت العام','صوت الموسيقى','خطوط الدفع','خط الدفع','جدول الدفع','أساسي','مكافأة','لفات مجانية','لعب تجريبي'],
 de:['EINSATZ','GUTHABEN','DREHEN','STOPP','AUTOSPIEL','TEMPO','GESAMTLAUTSTÄRKE','MUSIK','GEWINNLINIEN','GEWINNLINIE','GEWINNTABELLE','BASIS','BONUS','FREISPIELE','Simuliertes Spiel'],
 es:['APUESTA','SALDO','GIRAR','PARAR','GIRO AUTOMÁTICO','VELOCIDAD','VOLUMEN GENERAL','MÚSICA','LÍNEAS DE PAGO','LÍNEA','TABLA DE PAGOS','BASE','BONO','GIROS GRATIS','Juego simulado'],
 fi:['PANOS','SALDO','PYÖRÄYTÄ','PYSÄYTÄ','AUTOMAATTI','NOPEUS','YLEISÄÄNENVOIMAKKUUS','MUSIIKKI','VOITTOLINJAT','VOITTOLINJA','VOITTOTAULUKKO','PERUS','BONUS','ILMAISKIERROKSET','Simuloitu peli'],
 fr:['MISE','SOLDE','TOURNER','ARRÊTER','JEU AUTO','VITESSE','VOLUME GÉNÉRAL','MUSIQUE','LIGNES DE GAIN','LIGNE','TABLE DES GAINS','BASE','BONUS','TOURS GRATUITS','Jeu simulé'],
 hi:['दाँव','शेष राशि','घुमाएँ','रोकें','ऑटो स्पिन','गति','मुख्य आवाज़','संगीत','पेलाइन','पेलाइन','भुगतान तालिका','बेस','बोनस','मुफ़्त स्पिन','सिम्युलेटेड खेल'],
 id:['TARUHAN','SALDO','PUTAR','BERHENTI','PUTAR OTOMATIS','KECEPATAN','VOLUME UTAMA','MUSIK','GARIS BAYAR','GARIS','TABEL BAYAR','DASAR','BONUS','PUTARAN GRATIS','Permainan simulasi'],
 ja:['ベット','残高','スピン','停止','自動スピン','速度','全体音量','音楽','ペイライン','ライン','配当表','基本','ボーナス','フリースピン','シミュレーション'],
 ko:['베팅','잔액','스핀','정지','자동 스핀','속도','전체 음량','음악','페이라인','라인','배당표','기본','보너스','무료 스핀','모의 플레이'],
 pl:['STAWKA','SALDO','OBRÓĆ','STOP','AUTOOBROTY','PRĘDKOŚĆ','GŁOŚNOŚĆ GŁÓWNA','MUZYKA','LINIE WYGRYWAJĄCE','LINIA','TABELA WYPŁAT','BAZA','BONUS','DARMOWE OBROTY','Gra symulowana'],
 pt:['APOSTA','SALDO','GIRAR','PARAR','GIRO AUTOMÁTICO','VELOCIDADE','VOLUME GERAL','MÚSICA','LINHAS DE PAGAMENTO','LINHA','TABELA DE PAGAMENTOS','BASE','BÔNUS','GIROS GRÁTIS','Jogo simulado'],
 ru:['СТАВКА','БАЛАНС','ВРАЩАТЬ','СТОП','АВТОИГРА','СКОРОСТЬ','ОБЩАЯ ГРОМКОСТЬ','МУЗЫКА','ЛИНИИ ВЫПЛАТ','ЛИНИЯ','ТАБЛИЦА ВЫПЛАТ','БАЗА','БОНУС','БЕСПЛАТНЫЕ ВРАЩЕНИЯ','Симуляция'],
 tr:['BAHİS','BAKİYE','ÇEVİR','DUR','OTOMATİK','HIZ','ANA SES','MÜZİK','ÖDEME ÇİZGİLERİ','ÇİZGİ','ÖDEME TABLOSU','TEMEL','BONUS','ÜCRETSİZ ÇEVİRME','Simülasyon'],
 vi:['CƯỢC','SỐ DƯ','QUAY','DỪNG','TỰ ĐỘNG','TỐC ĐỘ','ÂM LƯỢNG CHUNG','NHẠC','DÒNG TRẢ THƯỞNG','DÒNG','BẢNG TRẢ THƯỞNG','CƠ BẢN','THƯỞNG','LƯỢT QUAY MIỄN PHÍ','Chơi mô phỏng'],
 zh:['投注','余额','旋转','停止','自动旋转','速度','总音量','音乐','赔付线','线','赔付表','基础','奖励','免费旋转','模拟游戏'],
 da:['INDSATS','SALDO','SPIN','STOP','AUTOSPIN','HASTIGHED','SAMLET LYDSTYRKE','MUSIK','GEVINSTLINJER','LINJE','GEVINSTTABEL','BASIS','BONUS','GRATIS SPINS','Simuleret spil']
};
const keys=['BET','BALANCE','SPIN','STOP','AUTO SPIN','TURBO','MASTER VOLUME','MUSIC VOLUME','PAYLINES','PAYLINE','PAYTABLE','BASE','BONUS','FREE SPINS','Simulated play'];
const controlLabels:Record<string,string[]>= {
 en:['INFO','SOUND','START'],ar:['معلومات','الصوت','ابدأ'],de:['INFO','TON','START'],es:['INFO','SONIDO','INICIAR'],fi:['TIEDOT','ÄÄNI','ALOITA'],fr:['INFOS','SON','DÉMARRER'],hi:['जानकारी','ध्वनि','शुरू'],id:['INFO','SUARA','MULAI'],ja:['情報','音声','開始'],ko:['정보','소리','시작'],pl:['INFO','DŹWIĘK','START'],pt:['INFO','SOM','INICIAR'],ru:['ИНФО','ЗВУК','НАЧАТЬ'],tr:['BİLGİ','SES','BAŞLAT'],vi:['THÔNG TIN','ÂM THANH','BẮT ĐẦU'],zh:['信息','声音','开始'],da:['INFO','LYD','START']
};
export function playerLabel(language:string,key:string,social=false){if(social && sweeps[language]?.[key])return sweeps[language][key];if(key==='NORMAL')return 'Normal';if(key==='QUICK')return 'Quick';if(key==='ULTRA')return 'Ultra';const controlIndex=['INFO','SOUND','START'].indexOf(key);if(controlIndex>=0)return (controlLabels[language]||controlLabels.en)[controlIndex];const index=keys.indexOf(key);return index<0?key:(labels[language]||labels.en)[index];}
