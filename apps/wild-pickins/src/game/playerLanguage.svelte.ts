import { stateI18n } from 'state-shared';
import translations from './playerTranslations';
export function playerLanguage(){
 const requested=typeof window==='undefined'?'en':new URLSearchParams(window.location.search).get('lang');
 const language=requested||stateI18n.i18n.locale||'en';
 return Object.hasOwn(translations,language)?language:'en';
}
