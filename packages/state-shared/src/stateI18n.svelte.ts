import { i18n, type Messages } from '@lingui/core';
import { stateUrlDerived, type Language } from './stateUrl.svelte';
import { socialLanguage } from './socialLanguage';

export const stateI18n = $state({
	i18n,
});

export const stateI18nDerived = {
	init: (lang: Language, messages: Messages) => {
		stateI18n.i18n.load(lang, messages as Messages);
		stateI18n.i18n.activate(lang);
	},
	translate: (value: string) => {
		const key = stateUrlDerived.social() ? socialLanguage(value) : value;
		const translated = stateI18n.i18n._(stateI18n.i18n.t(key));
		return stateI18nDerived.displayText(translated);
	},
	// Metadata strings bypass Lingui but still need social terminology.
	displayText: (value: string) => (stateUrlDerived.social() ? socialLanguage(value) : value),
};
