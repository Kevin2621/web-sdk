export type BonusPurchaseContent = {
	brand: string;
	title: string;
	subtitle: string;
	featuredTag: string;
	featuredImage: string;
	featuredBadge: string;
	featuredBadgeCaption: string;
	featuredTitle: string;
	featuredDescription: [string, string];
	purchaseLabel: string;
	costCaption: string;
	rules: string[];
	practiceCaption: string;
	environmentImage: string;
	planned: { name: string; image: string; description: string }[];
};
