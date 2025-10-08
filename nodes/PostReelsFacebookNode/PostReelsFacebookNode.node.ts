import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { PostReelsFacebookCommand } from '@/src/modules/post-reels-facebook/post-reels-facebook.command';
import { OS } from '@/src/types/setting.type';
import { getBrowserUIComponents } from '@/src/shared/browser-ui.components';

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
			...getBrowserUIComponents(),
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const browserType = this.getNodeParameter('browserType', 0) as string;
		const websocketUrl = this.getNodeParameter('websocketUrl', 0) as string;

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
			websocketUrl: browserType === 'remote' ? websocketUrl : undefined,
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
