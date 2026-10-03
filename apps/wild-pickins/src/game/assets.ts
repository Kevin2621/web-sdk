import { base } from '$app/paths';

export default {
	...Object.fromEntries(
		[1, 2, 3].map((i) => [
			`wpCurtainSeed${i}`,
			{ type: 'sprite' as const, src: `${base}/assets/seed-transition/seed${i}.png` },
		]),
	),
	wpCurtainCluster: { type: 'sprite', src: `${base}/assets/seed-transition/seeds-cluster.png` },
	...Object.fromEntries(
		[1, 2, 3].map((i) => [
			`wpRefreshCloud${i}`,
			{
				type: 'sprite' as const,
				src: `${base}/assets/art-refresh/cloud-${i}.png`,
			},
		]),
	),
	...Object.fromEntries(
		['H1', 'H2', 'H3', 'L1', 'L2', 'L3', 'L4', 'L5', 'S'].map((name) => [
			`wpRefresh${name}`,
			{ type: 'sprite' as const, src: `${base}/assets/art-refresh/${name}.png` },
		]),
	),
	wpRefreshEnvironment: {
		type: 'sprite',
		src: `${base}/assets/art-refresh/environment-v3.png`,
		preload: true,
	},
	wpBaseScene: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/environment-board/skeletons.atlas`,
			skeleton: `${base}/assets/spines/environment-board/skeleton.json`,
			scale: 1,
		},
	},
	wpScatterBag: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/scatter-bag/spine.atlas`,
			skeleton: `${base}/assets/spines/scatter-bag/skeleton-animated.json`,
			scale: 1,
		},
	},
	wpWildSpine: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/W/skeleton.atlas`,
			skeleton: `${base}/assets/spines/W/skeleton.json`,
			scale: 1,
		},
	},
	loader: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/loader/loader.atlas`,
			skeleton: `${base}/assets/spines/loader/loader.json`,
			scale: 2,
		},
		preload: true,
	},
	pressToContinueText: {
		type: 'sprites',
		src: `${base}/assets/sprites/pressToContinueText/MM_pressanywhere.json`,
		preload: true,
	},
	H1: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/symbols/symbols.atlas`,
			skeleton: `${base}/assets/spines/symbols/h1.json`,
			scale: 2,
		},
	},
	H2: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/symbols/symbols.atlas`,
			skeleton: `${base}/assets/spines/symbols/h2.json`,
			scale: 2,
		},
	},
	H3: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/symbols/symbols.atlas`,
			skeleton: `${base}/assets/spines/symbols/h3.json`,
			scale: 2,
		},
	},
	H4: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/symbols/symbols.atlas`,
			skeleton: `${base}/assets/spines/symbols/h4.json`,
			scale: 2,
		},
	},
	H5: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/symbols/symbols.atlas`,
			skeleton: `${base}/assets/spines/symbols/h5.json`,
			scale: 2,
		},
	},
	L1: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/symbols/symbols.atlas`,
			skeleton: `${base}/assets/spines/symbols/l1.json`,
			scale: 2,
		},
	},
	L2: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/symbols/symbols.atlas`,
			skeleton: `${base}/assets/spines/symbols/l2.json`,
			scale: 2,
		},
	},
	L3: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/symbols/symbols.atlas`,
			skeleton: `${base}/assets/spines/symbols/l3.json`,
			scale: 2,
		},
	},
	L4: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/symbols/symbols.atlas`,
			skeleton: `${base}/assets/spines/symbols/l4.json`,
			scale: 2,
		},
	},
	M: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/symbols2/symbols2.atlas`,
			skeleton: `${base}/assets/spines/symbols2/M.json`,
			scale: 2,
		},
	},
	S: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/symbols2/symbols2.atlas`,
			skeleton: `${base}/assets/spines/symbols2/S.json`,
			scale: 2,
		},
	},
	explosion: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/symbols3/symbols3.atlas`,
			skeleton: `${base}/assets/spines/symbols3/explosion.json`,
			scale: 2,
		},
	},
	W: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/symbols3/symbols3.atlas`,
			skeleton: `${base}/assets/spines/symbols3/W.json`,
			scale: 2,
		},
	},
	reelsFrame: {
		type: 'sprites',
		src: `${base}/assets/sprites/reelsFrame/reels_frame.json`,
	},
	payFrame: {
		type: 'sprite',
		src: `${base}/assets/sprites/payFrame/payFrame.png`,
	},
	anticipation: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/anticipation/anticipation.atlas`,
			skeleton: `${base}/assets/spines/anticipation/anticipation.json`,
			scale: 2,
		},
	},
	goldFont: {
		type: 'font',
		src: `${base}/assets/fonts/goldFont/mm_gold.xml`,
	},
	goldBlur: {
		type: 'font',
		src: `${base}/assets/fonts/goldBlur/miningfont_gold_blur.xml`,
	},
	silverFont: {
		type: 'font',
		src: `${base}/assets/fonts/silverFont/mm_silver.xml`,
	},
	purpleFont: {
		type: 'font',
		src: `${base}/assets/fonts/purpleFont/mm_purple.xml`,
	},
	bigwin: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/bigwin/big_wins.atlas`,
			skeleton: `${base}/assets/spines/bigwin/mm_bigwin.json`,
			scale: 2,
		},
	},
	globalMultiplier: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/globalMultiplier/multiframe.atlas`,
			skeleton: `${base}/assets/spines/globalMultiplier/multiframe.json`,
			scale: 2,
		},
	},
	fsIntro: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/fsIntro/fs_screen.atlas`,
			skeleton: `${base}/assets/spines/fsIntro/fs_screen.json`,
			scale: 2,
		},
	},
	fsIntroNumber: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/fsIntro/fs_screen.atlas`,
			skeleton: `${base}/assets/spines/fsIntro/fs_screen_number.json`,
			scale: 2,
		},
	},
	fsOutroNumber: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/fsIntro/fs_screen.atlas`,
			skeleton: `${base}/assets/spines/fsIntro/fs_total_number.json`,
			scale: 2,
		},
	},
	foregroundAnimation: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/foregroundAnimation/mm_bg.atlas`,
			skeleton: `${base}/assets/spines/foregroundAnimation/mm_bg.json`,
			scale: 2,
		},
		preload: true,
	},
	foregroundFeatureAnimation: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/foregroundFeatureAnimation/mm_bg_feature.atlas`,
			skeleton: `${base}/assets/spines/foregroundFeatureAnimation/mm_bg_feature.json`,
			scale: 2,
		},
		preload: true,
	},
	tumble_multiplier: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/tumbleWin/tumble_win.atlas`,
			skeleton: `${base}/assets/spines/tumbleWin/tumble_multiplier.json`,
			scale: 2,
		},
	},
	tumble_win: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/tumbleWin/tumble_win.atlas`,
			skeleton: `${base}/assets/spines/tumbleWin/tumble_win.json`,
			scale: 2,
		},
	},
	reelhouse: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/reelhouse/reelhouse_glow.atlas`,
			skeleton: `${base}/assets/spines/reelhouse/reelhouse_glow.json`,
			scale: 2,
		},
	},
	progressBar: {
		type: 'sprites',
		src: `${base}/assets/sprites/progressBar/progressBar.json`,
		preload: true,
	},
	freeSpins: {
		type: 'sprites',
		src: `${base}/assets/sprites/freeSpins/freeSpins.json`,
	},
	winSmall: {
		type: 'sprites',
		src: `${base}/assets/sprites/winSmall/MM_Localisation_winsmall.json`,
	},
	clusterWin: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/clusterWin/clusterpay.atlas`,
			skeleton: `${base}/assets/spines/clusterWin/clusterpay.json`,
			scale: 2,
		},
	},
	transition: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/transition/transition.atlas`,
			skeleton: `${base}/assets/spines/transition/transition.json`,
			scale: 2,
		},
	},
	symbolsStatic: {
		type: 'sprites',
		src: `${base}/assets/sprites/symbolsStatic/symbolsStatic.json`,
	},
	coins: {
		type: 'spriteSheet',
		src: `${base}/assets/sprites/coin/SD2_Coin.json`,
	},
	sound: {
		type: 'audio',
		src: `${base}/assets/audio/sounds.json`,
		preload: true,
	},
} as const;
