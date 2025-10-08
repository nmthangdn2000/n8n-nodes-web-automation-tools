import { chromium } from 'playwright-core';
import { SettingType } from '@/src/types/setting.type';

export const launchBrowser = async (settings: SettingType) => {
	const {
		os,
		showBrowser,
		browserWidth,
		browserHeight,
		locale,
		timezoneId,
		userAgent,
		websocketUrl,
	} = settings;

	let { userDataDir, executablePath } = settings;

	if (os === 'macos') {
		userDataDir = 'Library/Application Support/Google/Chrome/Default';

		if (!executablePath) {
			executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
		}
	}

	if (os === 'windows') {
		userDataDir = 'AppData/Local/Google/Chrome/User Data/Default';

		if (!executablePath) {
			executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
		}
	}

	if (!userDataDir || !executablePath) {
		throw new Error('Unsupported platform: ' + os);
	}

	const browserOptions: any = {
		headless: showBrowser ? false : true,
		executablePath,
		args: [
			'--disable-blink-features=AutomationControlled',
			'--no-sandbox',
			// '--profile-directory=Profile 5',
		],
		viewport: {
			width: browserWidth ? browserWidth : 1400,
			height: browserHeight ? browserHeight : 800,
		},
		locale: locale || 'en-US',
		timezoneId: timezoneId || 'Asia/Ho_Chi_Minh',
		userAgent:
			userAgent ||
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
	};

	// Add WebSocket URL if provided
	if (websocketUrl) {
		// Connect to existing browser via WebSocket
		const browser = await chromium.connectOverCDP(websocketUrl);
		return browser;
	}

	const browser = await chromium.launchPersistentContext(userDataDir, browserOptions);

	return browser;
};
