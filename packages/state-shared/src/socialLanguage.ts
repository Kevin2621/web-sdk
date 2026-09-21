// Engine social-casino terminology. Apply only to display text, never API keys or amounts.
// https://studio.engine.io/docs/approval-guidelines/jurisdiction-requirements
const phrases: Record<string, string> = {
	'be awarded to player’s accounts': 'appear in player’s accounts',
	"be awarded to player's accounts": "appear in player's accounts",
	'place your bets': 'come and play',
	'place your bet': 'come and play',
	'player bet amount': 'play amount',
	'place this bet': 'play this round',
	'insufficient funds': 'insufficient balance',
	'add funds to your account': 'get coins',
	'win feature': 'play feature',
	'buy bonus': 'get bonus',
	'bonus buy': 'bonus',
	'total bet': 'total play',
	'paid out': 'won',
	'pays out': 'wins',
	'pay out': 'win',
	'at the cost of': 'for',
	'cost of': 'can be played for',
	'pay table': 'win table',
	paytable: 'win table',
	paylines: 'win lines',
	payline: 'win line',
	payouts: 'wins',
	payout: 'win',
	betting: 'playing',
	bets: 'plays',
	bet: 'play',
	stake: 'play amount',
	cash: 'coins',
	payer: 'winner',
	pays: 'wins',
	paid: 'won',
	pay: 'win',
	money: 'coins',
	buy: 'play',
	bought: 'instantly triggered',
	purchase: 'play',
	rebet: 'respin',
	credit: 'balance',
	gamble: 'play',
	wager: 'play',
	deposit: 'get coins',
	withdraw: 'redeem',
	currency: 'token',
	funds: 'balance',
	fund: 'balance',
};
const pattern = new RegExp(`\\b(${Object.keys(phrases).join('|')})\\b`, 'gi');

export function socialLanguage(text: string): string {
	return text.replace(pattern, (match) => {
		const replacement = phrases[match.toLowerCase()];
		if (match === match.toUpperCase()) return replacement.toUpperCase();
		if (match[0] === match[0].toUpperCase())
			return replacement[0].toUpperCase() + replacement.slice(1);
		return replacement;
	});
}
