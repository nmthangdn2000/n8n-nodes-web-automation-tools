export enum OS {
	MACOS = 'macos',
	WINDOWS = 'windows',
	LINUX = 'linux',
}

export type SettingType = {
	os: OS;
	userDataDir?: string;
	executablePath?: string;
	showBrowser: boolean;
	isCloseBrowser: boolean;
	browserWidth?: number;
	browserHeight?: number;
	locale?: string;
	timezoneId?: string;
	userAgent?: string;
	websocketUrl?: string;
};
