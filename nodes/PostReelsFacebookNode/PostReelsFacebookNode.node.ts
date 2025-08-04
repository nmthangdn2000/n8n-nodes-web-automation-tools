import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { PostReelsFacebookCommand } from '@/src/modules/post-reels-facebook/post-reels-facebook.command';
import { OS } from '@/src/types/setting.type';

export class PostReelsFacebookNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Post Reels Facebook',
		name: 'postReelsFacebookNode',
		group: ['transform'],
		version: 1,
		description: 'Post a reels video to Facebook',
		defaults: {
			name: 'Post Reels Facebook',
		},
		icon: {
			light: 'file:facebook.svg',
			dark: 'file:facebook.svg',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Video Path',
				name: 'videoPath',
				type: 'string',
				default: '',
				placeholder: 'C:/Users/YourUsername/Videos/your_video.mp4',
				description: 'The path to the video file',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				placeholder: 'Enter your reels description',
				description: 'The description of the reels',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'string',
				default: '',
				placeholder: 'Your Page Name',
				description: 'The Facebook page to post to (optional)',
			},
			{
				displayName: 'Show Browser',
				name: 'showBrowser',
				type: 'boolean',
				default: false,
				description: 'Whether to show the browser',
			},
			{
				displayName: 'Is Close Browser',
				name: 'isCloseBrowser',
				type: 'boolean',
				default: true,
				description: 'Whether to close the browser',
			},
			{
				displayName: 'OS',
				name: 'os',
				type: 'options',
				default: 'windows',
				description: 'The operating system to use',
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
			},
			{
				displayName: 'Browser Settings',
				name: 'browserSettings',
				type: 'collection',
				default: {},
				description: 'Configure browser settings',
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
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const browserSettingsData = this.getNodeParameter('browserSettings', 0) as {
			settingType: string;
			userDataDir?: string;
			executablePath?: string;
			browserWidth?: number;
			browserHeight?: number;
			locale?: string;
			timezoneId?: string;
			userAgent?: string;
		};

		const settings = browserSettingsData || {
			userDataDir: undefined,
			executablePath: undefined,
			browserWidth: undefined,
			browserHeight: undefined,
			locale: undefined,
			timezoneId: undefined,
			userAgent: undefined,
		};

		const postReelsCommand = new PostReelsFacebookCommand({
			os: this.getNodeParameter('os', 0) as OS,
			showBrowser: this.getNodeParameter('showBrowser', 0) as boolean,
			isCloseBrowser: this.getNodeParameter('isCloseBrowser', 0) as boolean,
			userDataDir: settings.userDataDir,
			executablePath: settings.executablePath,
			browserWidth: settings.browserWidth,
			browserHeight: settings.browserHeight,
			locale: settings.locale,
			timezoneId: settings.timezoneId,
			userAgent: settings.userAgent,
			video_path: this.getNodeParameter('videoPath', 0) as string,
			description: this.getNodeParameter('description', 0) as string,
			page: this.getNodeParameter('page', 0) as string,
		});

		await postReelsCommand.run();

		// Add the input parameters to the output
		const returnData = items.map((item) => {
			return {
				json: {},
			};
		});

		return [returnData];
	}
}
