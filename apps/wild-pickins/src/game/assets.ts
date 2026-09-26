import { base } from '$app/paths';
import { refreshAsset } from './artRefresh';

export default {
 ...Object.fromEntries([1,2,3].map(i=>[`wpCurtainSeed${i}`,{type:'sprite' as const,src:`${base}/assets/seed-transition/seed${i}.png`}])),
 wpCurtainCluster:{type:'sprite',src:`${base}/assets/seed-transition/seeds-cluster.png`},
	sound: { type: 'audio', src: `${base}/assets/audio/sounds.json`, preload: true },
 wpScatterBag: {
  type: 'spine',
  src: { atlas: `${base}/assets/spines/scatter-bag/skeleton-animated.atlas`, skeleton: `${base}/assets/spines/scatter-bag/skeleton-animated.json`, scale: 1 },
 },
	wpBaseScene: {
		type: 'spine',
		src: {
			atlas: `${base}/assets/spines/base-scene/skeletons.atlas`,
			skeleton: `${base}/assets/spines/base-scene/skeleton.json`,
			scale: 1,
		},
	},
	...Object.fromEntries(['H1', 'H2', 'H3', 'L1', 'L2', 'L3', 'L4', 'L5', 'W', 'S'].map(name =>
		[`wpRefresh${name}`, { type: 'sprite' as const, src: refreshAsset(name) }])),
	wpRefreshEnvironment: { type: 'sprite', src: refreshAsset('environment-v3'), preload: true },
	wpRefreshFrame: { type: 'sprite', src: refreshAsset('board-frame') },
	wpRefreshBacking: { type: 'sprite', src: refreshAsset('board-back') },
	wpRefreshLeaves: { type: 'sprite', src: refreshAsset('leaf-overhang') },
	wpRefreshCloud1: { type: 'sprite', src: refreshAsset('cloud-1') },
	wpRefreshCloud2: { type: 'sprite', src: refreshAsset('cloud-2') },
	wpRefreshCloud3: { type: 'sprite', src: refreshAsset('cloud-3') },
	wpBakedLetterA: { type: 'sprite', src: `${base}/assets/letters-baked/a.png` },
	wpBakedLetterK: { type: 'sprite', src: `${base}/assets/letters-baked/k.png` },
	wpBakedLetterQ: { type: 'sprite', src: `${base}/assets/letters-baked/q.png` },
	wpBakedLetterJ: { type: 'sprite', src: `${base}/assets/letters-baked/j.png` },
	wpBakedLetter10: { type: 'sprite', src: `${base}/assets/letters-baked/10.png` },

	wpLuckiestGuy: {
		type: 'font',
		src: `${base}/assets/fonts/luckiest-guy/Luckiest-Guy.ttf`,
		preload: true,
	},
	wpPatuaOne: { type: 'font', src: `${base}/assets/fonts/patua-one/Patua-One.ttf`, preload: true },

	wpLetter10: { type: 'sprite', src: `${base}/assets/art-v1/letters-v1/10.png` },
	wpLetterJ: { type: 'sprite', src: `${base}/assets/art-v1/letters-v1/j.png` },
	wpLetterQ: { type: 'sprite', src: `${base}/assets/art-v1/letters-v1/q.png` },
	wpLetterK: { type: 'sprite', src: `${base}/assets/art-v1/letters-v1/k.png` },
	wpLetterA: { type: 'sprite', src: `${base}/assets/art-v1/letters-v1/a.png` },

	wpStone: { type: 'sprite', src: new URL('../../assets/art-v1/stone-v1.png', import.meta.url).href },
	wpWagonWheel: { type: 'sprite', src: new URL('../../assets/art-v1/wagon-wheel-v1.png', import.meta.url).href },
	wpHorseshoe: { type: 'sprite', src: new URL('../../assets/art-v1/horseshoe-v1.png', import.meta.url).href },
	wpPinecone: { type: 'sprite', src: new URL('../../assets/art-v1/pinecone-v1.png', import.meta.url).href },
	wpClayPot: { type: 'sprite', src: new URL('../../assets/art-v1/clay-pot-v1.png', import.meta.url).href },

	wpCorn: { type: 'sprite', src: new URL('../../assets/art-v1/corn-v1.png', import.meta.url).href },
	wpStrawberry: { type: 'sprite', src: new URL('../../assets/art-v1/strawberry-v1.png', import.meta.url).href },
	wpApple: { type: 'sprite', src: new URL('../../assets/art-v1/apple-v1.png', import.meta.url).href },
	wpSunflower: { type: 'sprite', src: new URL('../../assets/art-v1/sunflower-v1.png', import.meta.url).href },

	wpCarrot: { type: 'sprite', src: new URL('../../assets/art-v1/carrot-c.png', import.meta.url).href },
	wpGlove: { type: 'sprite', src: new URL('../../assets/art-v1/glove-b.png', import.meta.url).href },
	wpPumpkin: { type: 'sprite', src: new URL('../../assets/art-v1/pumpkin-a.png', import.meta.url).href },

	loader: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/loader/loader.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/loader/loader.json', import.meta.url).href,
			scale: 2,
		},
		preload: true,
	},
	pressToContinueText: {
		type: 'sprites',
		src: new URL('../../assets/sprites/pressToContinueText/MM_pressanywhere.json', import.meta.url).href,
		preload: true,
	},
	H1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h1.json', import.meta.url).href,
			scale: 2,
		},
	},
	H2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h2.json', import.meta.url).href,
			scale: 2,
		},
	},
	H3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h3.json', import.meta.url).href,
			scale: 2,
		},
	},
	L1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h4.json', import.meta.url).href,
			scale: 2,
		},
	},
	L2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l1.json', import.meta.url).href,
			scale: 2,
		},
	},
	L3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l2.json', import.meta.url).href,
			scale: 2,
		},
	},
	L4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l3.json', import.meta.url).href,
			scale: 2,
		},
	},
	L5: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l4.json', import.meta.url).href,
			scale: 2,
		},
	},
	S: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols2/symbols2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols2/S.json', import.meta.url).href,
			scale: 2,
		},
	},
	explosion: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols3/symbols3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols3/explosion.json', import.meta.url).href,
			scale: 2,
		},
	},
	W: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols3/symbols3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols3/W.json', import.meta.url).href,
			scale: 2,
		},
	},
	reelsFrame: {
		type: 'sprites',
		src: new URL('../../assets/sprites/reelsFrame/reels_frame.json', import.meta.url).href,
	},
	payFrame: {
		type: 'sprite',
		src: new URL('../../assets/sprites/payFrame/payFrame.png', import.meta.url).href,
	},
	anticipation: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/anticipation/anticipation.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/anticipation/anticipation.json', import.meta.url).href,
			scale: 2,
		},
	},
	goldFont: {
		type: 'font',
		src: new URL('../../assets/fonts/goldFont/mm_gold.xml', import.meta.url).href,
	},
	goldBlur: {
		type: 'font',
		src: new URL('../../assets/fonts/goldBlur/miningfont_gold_blur.xml', import.meta.url).href,
	},
	silverFont: {
		type: 'font',
		src: new URL('../../assets/fonts/silverFont/mm_silver.xml', import.meta.url).href,
	},
	purpleFont: {
		type: 'font',
		src: new URL('../../assets/fonts/purpleFont/mm_purple.xml', import.meta.url).href,
	},
	bigwin: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/bigwin/big_wins.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/bigwin/mm_bigwin.json', import.meta.url).href,
			scale: 2,
		},
	},
	globalMultiplier: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/globalMultiplier/multiframe.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/globalMultiplier/multiframe.json', import.meta.url).href,
			scale: 2,
		},
	},
	fsIntro: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/fsIntro/fs_screen.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/fsIntro/fs_screen.json', import.meta.url).href,
			scale: 2,
		},
	},
	fsIntroNumber: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/fsIntro/fs_screen.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/fsIntro/fs_screen_number.json', import.meta.url).href,
			scale: 2,
		},
	},
	fsOutroNumber: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/fsIntro/fs_screen.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/fsIntro/fs_total_number.json', import.meta.url).href,
			scale: 2,
		},
	},
	foregroundAnimation: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/foregroundAnimation/mm_bg.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/foregroundAnimation/mm_bg.json', import.meta.url).href,
			scale: 2,
		},
		preload: true,
	},
	foregroundFeatureAnimation: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/foregroundFeatureAnimation/mm_bg_feature.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/foregroundFeatureAnimation/mm_bg_feature.json', import.meta.url).href,
			scale: 2,
		},
		preload: true,
	},
	tumble_multiplier: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/tumbleWin/tumble_win.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/tumbleWin/tumble_multiplier.json', import.meta.url).href,
			scale: 2,
		},
	},
	tumble_win: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/tumbleWin/tumble_win.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/tumbleWin/tumble_win.json', import.meta.url).href,
			scale: 2,
		},
	},
	reelhouse: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/reelhouse/reelhouse_glow.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/reelhouse/reelhouse_glow.json', import.meta.url).href,
			scale: 2,
		},
	},
	progressBar: {
		type: 'sprites',
		src: new URL('../../assets/sprites/progressBar/progressBar.json', import.meta.url).href,
		preload: true,
	},
	freeSpins: {
		type: 'sprites',
		src: new URL('../../assets/sprites/freeSpins/freeSpins.json', import.meta.url).href,
	},
	winSmall: {
		type: 'sprites',
		src: new URL('../../assets/sprites/winSmall/MM_Localisation_winsmall.json', import.meta.url).href,
	},
	clusterWin: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/clusterWin/clusterpay.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/clusterWin/clusterpay.json', import.meta.url).href,
			scale: 2,
		},
	},
	transition: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/transition/transition.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/transition/transition.json', import.meta.url).href,
			scale: 2,
		},
	},
	symbolsStatic: {
		type: 'sprites',
		src: new URL('../../assets/sprites/symbolsStatic/symbolsStatic.json', import.meta.url).href,
	},
	coins: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/coin/SD2_Coin.json', import.meta.url).href,
	},
} as const;
