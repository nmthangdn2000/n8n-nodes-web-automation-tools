import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { PostReelsInstagramCommand } from '@/src/modules/post-reels-instagram/post-reels-instagram.command';
import { OS } from '@/src/types/setting.type';
import { getBrowserUIComponents } from '@/src/shared/browser-ui.components';

export class PostReelsInstagramNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Post Reels Instagram',
		name: 'postReelsInstagramNode',
		group: ['transform'],
		version: 1,
		description: 'Post a reels video to Instagram',
		defaults: {
			name: 'Post Reels Instagram',
		},
		icon: {
			light: 'file:instagram.svg',
			dark: 'file:instagram.svg',
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
				required: true,
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
				displayName: 'Share to Facebook Reels',
				name: 'shareToFacebookReels',
				type: 'boolean',
				default: false,
				description: 'Whether to also share this reel to Facebook',
			},
			{
				displayName: 'Hide Like and View Counts',
				name: 'hideLikeAndViewCounts',
				type: 'boolean',
				default: false,
				description: 'Whether to hide like and view counts',
			},
			{
				displayName: 'Turn Off Commenting',
				name: 'turnOffCommenting',
				type: 'boolean',
				default: false,
				description: 'Whether to turn off commenting',
			},
			...getBrowserUIComponents(),
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const browserType = this.getNodeParameter('browserType', 0) as string;
		const websocketUrl = browserType === 'remote' ? (this.getNodeParameter('websocketUrl', 0) as string) : undefined;

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

		const postReelsCommand = new PostReelsInstagramCommand({
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
			websocketUrl: websocketUrl,
			video_path: this.getNodeParameter('videoPath', 0) as string,
			description: this.getNodeParameter('description', 0) as string,
			is_share_to_reels_facebook: this.getNodeParameter('shareToFacebookReels', 0) as boolean,
			is_hide_like_and_view_counts: this.getNodeParameter('hideLikeAndViewCounts', 0) as boolean,
			is_turn_off_commenting: this.getNodeParameter('turnOffCommenting', 0) as boolean,
		});

		const urlPost = await postReelsCommand.run();

		// Add the input parameters to the output
		const returnData = items.map((item) => {
			return {
				json: {
					url: urlPost,
				},
			};
		});

		return [returnData];
	}
}
