import { INodeProperties } from 'n8n-workflow';

/**
 * Common browser UI components for all nodes
 */

export const browserTypeOptions: INodeProperties = {
	displayName: 'Browser Type',
	name: 'browserType',
	type: 'options',
	default: 'local',
	description: 'Choose between local browser or remote browser connection',
	options: [
		{
			name: 'Local Browser',
			value: 'local',
			description: 'Launch a new browser instance locally',
		},
		{
			name: 'Remote Browser',
			value: 'remote',
			description: 'Connect to an existing browser via WebSocket',
		},
	],
};

export const websocketUrlOptions: INodeProperties = {
	displayName: 'WebSocket URL',
	name: 'websocketUrl',
	type: 'string',
	default: '',
	placeholder: 'ws://localhost:9222',
	description: 'WebSocket URL to connect to existing browser instance',
	displayOptions: {
		show: {
			browserType: ['remote'],
		},
	},
};

export const osOptions: INodeProperties = {
	displayName: 'OS',
	name: 'os',
	type: 'options',
	default: 'windows',
	description: 'The operating system to use',
	displayOptions: {
		show: {
			browserType: ['local'],
		},
	},
	options: [
		{
			name: 'Windows',
			value: 'windows',
		},
		{
			name: 'MacOS',
			value: 'macos',
		},
		{
			name: 'Linux',
			value: 'linux',
		},
	],
};

export const browserSettingsOptions: INodeProperties = {
	displayName: 'Browser Settings',
	name: 'browserSettings',
	type: 'collection',
	default: {},
	description: 'Configure browser settings',
	displayOptions: {
		show: {
			browserType: ['local'],
		},
	},
	options: [
		{
			displayName: 'Browser Height',
			name: 'browserHeight',
			type: 'number',
			default: 1080,
			description: 'The height of the browser window',
		},
		{
			displayName: 'Browser Width',
			name: 'browserWidth',
			type: 'number',
			default: 1920,
			description: 'The width of the browser window',
		},
		{
			displayName: 'Executable Path',
			name: 'executablePath',
			type: 'string',
			default: '',
			description: 'The executable path for the browser',
		},
		{
			displayName: 'Locale',
			name: 'locale',
			type: 'string',
			default: 'en-US',
			description: 'The locale for the browser',
		},
		{
			displayName: 'Timezone ID',
			name: 'timezoneId',
			type: 'string',
			default: 'Asia/Tokyo',
			description: 'The timezone for the browser',
		},
		{
			displayName: 'User Agent',
			name: 'userAgent',
			type: 'string',
			default:
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			description: 'The user agent for the browser',
		},
		{
			displayName: 'User Data Dir',
			name: 'userDataDir',
			type: 'string',
			default: '',
			description: 'The user data directory for the browser',
		},
	],
};

export const showBrowserOptions: INodeProperties = {
	displayName: 'Show Browser',
	name: 'showBrowser',
	type: 'boolean',
	default: false,
	description: 'Whether to show the browser',
};

export const isCloseBrowserOptions: INodeProperties = {
	displayName: 'Is Close Browser',
	name: 'isCloseBrowser',
	type: 'boolean',
	default: true,
	description: 'Whether to close the browser',
};

/**
 * Get all common browser UI components
 */
export const getBrowserUIComponents = (): INodeProperties[] => {
	return [
		showBrowserOptions,
		isCloseBrowserOptions,
		browserTypeOptions,
		websocketUrlOptions,
		osOptions,
		browserSettingsOptions,
	];
};

/**
 * Get browser UI components for specific use cases
 */
export const getBrowserUIComponentsForLocal = (): INodeProperties[] => {
	return [showBrowserOptions, isCloseBrowserOptions, osOptions, browserSettingsOptions];
};

export const getBrowserUIComponentsForRemote = (): INodeProperties[] => {
	return [showBrowserOptions, isCloseBrowserOptions, browserTypeOptions, websocketUrlOptions];
};
