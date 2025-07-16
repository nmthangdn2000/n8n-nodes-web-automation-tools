export type SettingType = {
	os: 'macos' | 'windows' | 'linux';
	userDataDir?: string;
	executablePath?: string;
	showBrowser: boolean;
	isCloseBrowser: boolean;
	browserWidth?: number;
	browserHeight?: number;
	locale?: string;
	timezoneId?: string;
	userAgent?: string;
};
