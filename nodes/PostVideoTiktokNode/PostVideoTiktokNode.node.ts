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
				displayName: 'Is Duet On',
				name: 'isDuetOn',
				type: 'boolean',
				default: false,
				description: 'Whether to duet on the video',
			},
			{
				displayName: 'Is Stitch On',
				name: 'isStitchOn',
				type: 'boolean',
				default: false,
				description: 'Whether to stitch the video',
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const postTiktokModule = new PostTiktokModule(this, {
			video_path: this.getNodeParameter('videoPath', 0) as string,
			os: this.getNodeParameter('os', 0) as OS,
			showBrowser: this.getNodeParameter('showBrowser', 0) as boolean,
			isCloseBrowser: this.getNodeParameter('isCloseBrowser', 0) as boolean,
			description: this.getNodeParameter('description', 0) as string,
			audience: this.getNodeParameter('audience', 0) as keyof typeof Audience,
			is_ai_generated: this.getNodeParameter('isAiGenerated', 0) as boolean,
			run_music_copyright_check: this.getNodeParameter('runMusicCopyrightCheck', 0) as boolean,
			run_content_check_lite: this.getNodeParameter('runContentCheckLite', 0) as boolean,
			is_comment_on: this.getNodeParameter('isCommentOn', 0) as boolean,
			is_duet_on: this.getNodeParameter('isDuetOn', 0) as boolean,
			is_stitch_on: this.getNodeParameter('isStitchOn', 0) as boolean,
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
