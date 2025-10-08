import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { PostTiktokModule } from '@/src/modules/post-tiktok/post-tiktok.module';
import { Audience } from '@/src/modules/post-tiktok/post-tiktok.enum';
import { OS } from '@/src/types/setting.type';
import { getBrowserUIComponents } from '@/src/shared/browser-ui.components';

export class PostVideoTiktokNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Post Video Tiktok Node',
		name: 'postVideoTiktokNode',
		group: ['transform'],
		version: 1,
		description: 'Post a video to Tiktok',
		defaults: {
			name: 'Post Video Tiktok',
		},
		icon: {
			light: 'file:tiktok.svg',
			dark: 'file:tiktok.svg',
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
				placeholder: '',
				description: 'The description of the video',
			},
			{
				displayName: 'Audience',
				name: 'audience',
				type: 'options',
				description: 'The audience to post the video to',
				options: Object.keys(Audience)
					.filter((key) => isNaN(Number(key)))
					.map((audience) => ({
						name: audience,
						value: audience,
					})),
				default: '',
			},
			{
				displayName: 'Is AI Generated',
				name: 'isAiGenerated',
				type: 'boolean',
				default: false,
				description: 'Whether to use AI to generate the video',
			},
			{
				displayName: 'Run Music Copyright Check',
				name: 'runMusicCopyrightCheck',
				type: 'boolean',
				default: false,
				description: 'Whether to run the copyright check',
			},
			{
				displayName: 'Run Content Check Lite',
				name: 'runContentCheckLite',
				type: 'boolean',
				default: false,
				description: 'Whether to run the content check lite',
			},
			{
				displayName: 'Is Comment On',
				name: 'isCommentOn',
				type: 'boolean',
				default: false,
				description: 'Whether to comment on the video',
			},
			{
				displayName: 'Is Reuse of Content',
				name: 'isReuseOfContent',
				type: 'boolean',
				default: false,
				description: 'Whether to duet on the video',
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

		const postTiktokModule = new PostTiktokModule(this, {
			video_path: this.getNodeParameter('videoPath', 0) as string,
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
			description: this.getNodeParameter('description', 0) as string,
			audience: this.getNodeParameter('audience', 0) as keyof typeof Audience,
			is_ai_generated: this.getNodeParameter('isAiGenerated', 0) as boolean,
			run_music_copyright_check: this.getNodeParameter('runMusicCopyrightCheck', 0) as boolean,
			run_content_check_lite: this.getNodeParameter('runContentCheckLite', 0) as boolean,
			is_comment_on: this.getNodeParameter('isCommentOn', 0) as boolean,
			is_reuse_of_content: this.getNodeParameter('isReuseOfContent', 0) as boolean,
		});

		await postTiktokModule.run();

		const returnData = items.map((item) => {
			return {
				json: {},
			};
		});

		return [returnData];
	}
}
