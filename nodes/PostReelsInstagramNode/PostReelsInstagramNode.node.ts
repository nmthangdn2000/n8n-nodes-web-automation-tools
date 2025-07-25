import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { PostReelsInstagramCommand } from '@/src/modules/post-reels-instagram/post-reels-instagram.command';
import { OS } from '@/src/types/setting.type';

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
			{
				displayName: 'Show Browser',
				name: 'showBrowser',
				type: 'boolean',
				default: false,
				description: 'Whether to show the browser (required for login)',
			},
			{
				displayName: 'Is Close Browser',
				name: 'isCloseBrowser',
				type: 'boolean',
				default: true,
				description: 'Whether to close the browser after posting',
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

		const postReelsCommand = new PostReelsInstagramCommand({
			os: this.getNodeParameter('os', 0) as OS,
			showBrowser: this.getNodeParameter('showBrowser', 0) as boolean,
			isCloseBrowser: this.getNodeParameter('isCloseBrowser', 0) as boolean,
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
