import { TLanguage } from '@/src/types/language.type';
import { LANGUAGE_DATA } from './data';

export const translate = (key: keyof typeof LANGUAGE_DATA, language: TLanguage) => {
	return LANGUAGE_DATA[key][language];
};
