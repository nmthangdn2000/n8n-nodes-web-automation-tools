import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { PostThreadCommand } from '@/src/modules/post-threads/post-threads.command';
import { OS } from '@/src/types/setting.type';

export class PostThreadsNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Post Threads',
		name: 'postThreadsNode',
		group: ['transform'],
		version: 1,
		description: 'Post a thread to Threads.com',
		defaults: {
			name: 'Post Threads',
		},
		icon: {
			light: 'file:threads.svg',
			dark: 'file:threads.svg',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				placeholder: 'Enter your thread description',
				description: 'The description/content of the thread',
				required: true,
			},
			{
				displayName: 'Media Files Input Type',
				name: 'mediaFilesInputType',
				type: 'options',
				default: 'fixedCollection',
				description: 'Choose how to input media files',
				options: [
					{
						name: 'Fixed Collection',
						value: 'fixedCollection',
					},
					{
						name: 'JSON',
						value: 'json',
					},
				],
			},
			{
				displayName: 'Media Files',
				name: 'mediaFiles',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				description: 'The path to the media file (video or image, max 1 video)',
				displayOptions: {
					show: {
						mediaFilesInputType: ['fixedCollection'],
					},
				},
				options: [
					{
						name: 'mediaFile',
						displayName: 'Media File',
						values: [
							{
								displayName: 'Path',
								name: 'path',
								type: 'string',
								default: '',
								description: 'The path to the media file (video or image, max 1 video)',
							},
						],
					},
				],
			},
			{
				displayName: 'Media Files JSON',
				name: 'mediaFilesJson',
				type: 'json',
				default: '[]',
				description: 'JSON array of media file paths (e.g., ["path1", "path2"])',
				displayOptions: {
					show: {
						mediaFilesInputType: ['json'],
					},
				},
			},
			{
				displayName: 'Reply Threads Input Type',
				name: 'replyThreadsInputType',
				type: 'options',
				default: 'fixedCollection',
				description: 'Choose how to input reply threads',
				options: [
					{
						name: 'Fixed Collection',
						value: 'fixedCollection',
					},
					{
						name: 'JSON',
						value: 'json',
					},
				],
			},
			{
				displayName: 'Reply Threads',
				name: 'replyThreads',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				description: 'Reply threads to add to the main post',
				displayOptions: {
					show: {
						replyThreadsInputType: ['fixedCollection'],
					},
				},
				options: [
					{
						name: 'replyThread',
						displayName: 'Reply Thread',
						values: [
							{
								displayName: 'Description',
								name: 'description',
								type: 'string',
								default: '',
								description: 'The description/content of the reply thread',
							},
							{
								displayName: 'Media Files',
								name: 'mediaFiles',
								type: 'fixedCollection',
								typeOptions: {
									multipleValues: true,
								},
								default: {},
								description: 'The media files for this reply thread',
								options: [
									{
										name: 'mediaFile',
										displayName: 'Media File',
										values: [
											{
												displayName: 'Path',
												name: 'path',
												type: 'string',
												default: '',
												description: 'The path to the media file',
											},
										],
									},
								],
							},
						],
					},
				],
			},
			{
				displayName: 'Reply Threads JSON',
				name: 'replyThreadsJson',
				type: 'json',
				default: '[]',
				description:
					'JSON array of reply threads (e.g., [{"description": "text", "media_files": ["path1"]}])',
				displayOptions: {
					show: {
						replyThreadsInputType: ['json'],
					},
				},
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

		// Get media files input type
		const mediaFilesInputType = this.getNodeParameter('mediaFilesInputType', 0) as string;

		let mediaFiles: string[] = [];

		if (mediaFilesInputType === 'fixedCollection') {
			// Get video paths from the fixed collection
			const mediaFilesData = this.getNodeParameter('mediaFiles', 0) as {
				mediaFile?: Array<{ path: string }>;
			};
			mediaFiles = mediaFilesData.mediaFile?.map((item) => item.path) || [];
		} else if (mediaFilesInputType === 'json') {
			// Get video paths from JSON
			const mediaFilesJson = this.getNodeParameter('mediaFilesJson', 0) as string;
			try {
				const parsedJson = JSON.parse(mediaFilesJson);
				if (Array.isArray(parsedJson)) {
					mediaFiles = parsedJson.filter((path) => typeof path === 'string');
				}
			} catch (error) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid JSON format for media files. Please provide a valid JSON array of strings.',
				);
			}
		}

		// Get reply threads input type
		const replyThreadsInputType = this.getNodeParameter('replyThreadsInputType', 0) as string;

		let replyThreads: { media_files: string[]; description: string }[] = [];

		if (replyThreadsInputType === 'fixedCollection') {
			// Get reply threads from the fixed collection
			const replyThreadsData = this.getNodeParameter('replyThreads', 0) as {
				replyThread?: Array<{
					description: string;
					mediaFiles: { mediaFile?: Array<{ path: string }> };
				}>;
			};
			replyThreads =
				replyThreadsData.replyThread?.map((item) => ({
					description: item.description,
					media_files: item.mediaFiles.mediaFile?.map((mediaItem) => mediaItem.path) || [],
				})) || [];
		} else if (replyThreadsInputType === 'json') {
			// Get reply threads from JSON
			const replyThreadsJson = this.getNodeParameter('replyThreadsJson', 0) as string;
			try {
				const parsedJson = JSON.parse(replyThreadsJson);
				if (Array.isArray(parsedJson)) {
					replyThreads = parsedJson.filter(
						(item) =>
							typeof item === 'object' &&
							item !== null &&
							'description' in item &&
							'media_files' in item &&
							Array.isArray(item.media_files),
					);
				}
			} catch (error) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid JSON format for reply threads. Please provide a valid JSON array of objects with description and media_files properties.',
				);
			}
		}

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

		const postThreadCommand = new PostThreadCommand({
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
			media_files: mediaFiles,
			description: this.getNodeParameter('description', 0) as string,
			reply_threads: replyThreads,
		});

		const urlPost = await postThreadCommand.run();

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
