// Shipped cue gains live in static/assets/audio/sounds.json (config).
// Standalone clip regions replace the legacy sprite regions for these cues.
export const recordingRoutes = {
	sfx_btn_spin: { file: 'symbolFastWhoosh.wav', duration: 300, loop: false },
	sfx_anticipation_start: { file: 'anticipationTick.wav', duration: 2869.82, loop: true },
	sfx_scatter_riser: { file: 'windupAnticipation006343.wav', duration: 4922.93, loop: false },
	sfx_bonus_continue_spell: {
		file: 'bonusContinueHealingSpell003701.mp3',
		duration: 3395.918,
		loop: false,
	},
	sfx_bonus_continue_wood_zap: {
		file: 'bonusContinueWoodZap003828.wav',
		duration: 1875.034,
		loop: false,
	},
	sfx_bonus_summary_modest: { file: 'bonusSummaryLevel1.mp3', duration: 3030.204, loop: false },
	sfx_bonus_summary_strong: { file: 'bonusSummaryLevel2.mp3', duration: 6034.286, loop: false },
	sfx_farm_entry_riser: { file: 'farmEntryGuitarSlide.mp3', duration: 6034.286, loop: false },
	sfx_multiplier_landing: { file: 'wildLandingCurrent.mp3', duration: 999.48, loop: false },
	sfx_reel_stop_1: { file: 'reelStopWood.wav', duration: 252.6, loop: false },
	sfx_reel_stop_2: { file: 'reelStopWood.wav', duration: 252.6, loop: false },
	sfx_reel_stop_3: { file: 'reelStopWood.wav', duration: 252.6, loop: false },
	sfx_reel_stop_4: { file: 'reelStopWood.wav', duration: 252.6, loop: false },
	sfx_reel_stop_5: { file: 'reelStopWood.wav', duration: 252.6, loop: false },
};
export function configureShippedAudio(audio, assetBase = '') {
	const sprite = { ...audio.sprite };
	const sources = {};
	for (const [name, route] of Object.entries(recordingRoutes)) {
		if (!sprite[name]) throw new Error(`Missing shipped audio cue: ${name}`);
		sprite[name] = [0, route.duration, route.loop];
		sources[name] = `${assetBase}/assets/audio/effects/${route.file}`;
	}
	const src = audio.src.map((path) =>
		path.startsWith('./assets/') ? `${assetBase}/${path.slice(2)}` : path,
	);
	return { audio: { ...audio, src, sprite }, sources };
}
export const audioMix = {
	duckLevel: 0.75,
	duckAttack: 90,
	duckRelease: 250,
	reelStopRates: [0.97, 1.02, 1, 0.96, 1.04],
	riserAttackClearance: 160,
	riserActive: 3900,
};
