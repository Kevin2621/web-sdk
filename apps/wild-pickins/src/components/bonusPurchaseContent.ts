import { base } from '$app/paths';
import type { BonusPurchaseContent } from 'components-ui-html';

export const bonusPurchaseContent: BonusPurchaseContent = {
	brand: 'WILD HARVEST',
	title: 'Pick your bonus',
	subtitle: 'A little shortcut to the good stuff.',
	featuredTag: 'THE ORIGINAL',
	featuredImage: `${base}/assets/art-refresh/S.png`,
	featuredBadge: '10',
	featuredBadgeCaption: 'FREE SPINS',
	featuredTitle: 'Standard Bonus Buy',
	featuredDescription: ['Jump straight into free spins.', 'Collect sticky multiplier Wilds.'],
	purchaseLabel: 'Buy bonus',
	costCaption: 'your bet',
	rules: [
		'10 free spins · Sticky multiplier Wilds · Up to 30 total spins.',
		'Full boards keep paying. Play ends when spins expire or the round cap is reached.',
	],
	practiceCaption: 'Event preview · no money is charged',
	environmentImage: `${base}/assets/art-refresh/environment-v3.png`,
	planned: [
		{
			name: 'Bonus Hunt',
			image: `${base}/assets/art-refresh/S.png`,
			description: 'More chances to reach free spins.',
		},
		{
			name: 'Bumper Crop Buy',
			image: `${base}/assets/art-refresh/W.png`,
			description: 'A stronger start to your bonus.',
		},
		{
			name: 'Harvest or Bust',
			image: `${base}/assets/art-refresh/H3.png`,
			description: 'Fill the board. Take the prize.',
		},
	],
};
