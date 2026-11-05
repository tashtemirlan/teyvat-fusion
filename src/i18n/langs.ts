// Языки игры в порядке колонок словаря: каждая строка словаря содержит переводы через «|» в этом порядке.
export interface Lang {
  code: string;
  name: string;
  rtl?: boolean;
}

export const LANGS: Lang[] = [
  { code: 'en', name: 'English' }, { code: 'ru', name: 'Русский' }, { code: 'zh', name: '简体中文' }, { code: 'zh-TW', name: '繁體中文' },
  { code: 'ja', name: '日本語' }, { code: 'ko', name: '한국어' }, { code: 'vi', name: 'Tiếng Việt' }, { code: 'th', name: 'ไทย' },
  { code: 'id', name: 'Bahasa Indonesia' }, { code: 'ms', name: 'Bahasa Melayu' }, { code: 'fil', name: 'Filipino' }, { code: 'hi', name: 'हिन्दी' },
  { code: 'bn', name: 'বাংলা' }, { code: 'ur', name: 'اردو', rtl: true }, { code: 'ta', name: 'தமிழ்' }, { code: 'te', name: 'తెలుగు' },
  { code: 'mr', name: 'मराठी' }, { code: 'ar', name: 'العربية', rtl: true }, { code: 'fa', name: 'فارسی', rtl: true }, { code: 'he', name: 'עברית', rtl: true },
  { code: 'tr', name: 'Türkçe' }, { code: 'de', name: 'Deutsch' }, { code: 'fr', name: 'Français' }, { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' }, { code: 'it', name: 'Italiano' }, { code: 'nl', name: 'Nederlands' }, { code: 'pl', name: 'Polski' },
  { code: 'uk', name: 'Українська' }, { code: 'cs', name: 'Čeština' }, { code: 'sk', name: 'Slovenčina' }, { code: 'hu', name: 'Magyar' },
  { code: 'ro', name: 'Română' }, { code: 'bg', name: 'Български' }, { code: 'el', name: 'Ελληνικά' }, { code: 'sv', name: 'Svenska' },
  { code: 'nb', name: 'Norsk' }, { code: 'da', name: 'Dansk' }, { code: 'fi', name: 'Suomi' }, { code: 'et', name: 'Eesti' },
  { code: 'lv', name: 'Latviešu' }, { code: 'lt', name: 'Lietuvių' }, { code: 'sr', name: 'Српски' }, { code: 'hr', name: 'Hrvatski' },
  { code: 'sl', name: 'Slovenščina' }, { code: 'kk', name: 'Қазақша' }, { code: 'uz', name: 'Oʻzbekcha' }, { code: 'az', name: 'Azərbaycanca' },
  { code: 'sw', name: 'Kiswahili' }, { code: 'af', name: 'Afrikaans' }, { code: 'ca', name: 'Català' }, { code: 'ka', name: 'ქართული' },
];
