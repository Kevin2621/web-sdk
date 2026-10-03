// Social-mode display labels; keep internal keys and game logic unchanged.
const sweeps: Record<string, Record<string, string>> = {
	en: {
		BET: 'PLAY',
		PAYLINES: 'WIN LINES',
		PAYLINE: 'WIN LINE',
		PAYTABLE: 'WIN TABLE',
	},
	ar: {
		BET: 'اللعب',
		PAYLINES: 'خطوط الفوز',
		PAYLINE: 'خط الفوز',
		PAYTABLE: 'جدول الفوز',
	},
	de: {
		BET: 'SPIEL',
		PAYLINES: 'GEWINNLINIEN',
		PAYLINE: 'GEWINNLINIE',
		PAYTABLE: 'GEWINNTABELLE',
	},
	es: {
		BET: 'JUEGO',
		PAYLINES: 'LÍNEAS GANADORAS',
		PAYLINE: 'LÍNEA GANADORA',
		PAYTABLE: 'TABLA DE PREMIOS',
	},
	fi: {
		BET: 'PELI',
		PAYLINES: 'VOITTOLINJAT',
		PAYLINE: 'VOITTOLINJA',
		PAYTABLE: 'VOITTOTAULUKKO',
	},
	fr: {
		BET: 'JEU',
		PAYLINES: 'LIGNES GAGNANTES',
		PAYLINE: 'LIGNE GAGNANTE',
		PAYTABLE: 'TABLE DES GAINS',
	},
	hi: {
		BET: 'खेल',
		PAYLINES: 'जीत की लाइनें',
		PAYLINE: 'जीत की लाइन',
		PAYTABLE: 'जीत की तालिका',
	},
	id: {
		BET: 'MAIN',
		PAYLINES: 'GARIS KEMENANGAN',
		PAYLINE: 'GARIS KEMENANGAN',
		PAYTABLE: 'TABEL KEMENANGAN',
	},
	ja: {
		BET: 'プレイ',
		PAYLINES: '当選ライン',
		PAYLINE: '当選ライン',
		PAYTABLE: '当選表',
	},
	ko: {
		BET: '플레이',
		PAYLINES: '당첨 라인',
		PAYLINE: '당첨 라인',
		PAYTABLE: '당첨표',
	},
	pl: {
		BET: 'GRA',
		PAYLINES: 'LINIE WYGRYWAJĄCE',
		PAYLINE: 'LINIA WYGRYWAJĄCA',
		PAYTABLE: 'TABELA WYGRANYCH',
	},
	pt: {
		BET: 'JOGADA',
		PAYLINES: 'LINHAS VENCEDORAS',
		PAYLINE: 'LINHA VENCEDORA',
		PAYTABLE: 'TABELA DE PRÊMIOS',
	},
	ru: {
		BET: 'ИГРА',
		PAYLINES: 'ВЫИГРЫШНЫЕ ЛИНИИ',
		PAYLINE: 'ВЫИГРЫШНАЯ ЛИНИЯ',
		PAYTABLE: 'ТАБЛИЦА ВЫИГРЫШЕЙ',
	},
	tr: {
		BET: 'OYUN',
		PAYLINES: 'KAZANÇ ÇİZGİLERİ',
		PAYLINE: 'KAZANÇ ÇİZGİSİ',
		PAYTABLE: 'KAZANÇ TABLOSU',
	},
	vi: {
		BET: 'CHƠI',
		PAYLINES: 'DÒNG THẮNG',
		PAYLINE: 'DÒNG THẮNG',
		PAYTABLE: 'BẢNG THẮNG',
	},
	zh: {
		BET: '游玩',
		PAYLINES: '获胜线',
		PAYLINE: '获胜线',
		PAYTABLE: '获胜表',
	},
	da: {
		BET: 'SPIL',
		PAYLINES: 'GEVINSTLINJER',
		PAYLINE: 'GEVINSTLINJE',
		PAYTABLE: 'GEVINSTTABEL',
	},
};
export default sweeps;
