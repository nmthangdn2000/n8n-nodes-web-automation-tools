import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { TiktokInteractionModule } from '@/src/modules/tiktok-interaction/tiktok-interaction.module';
import { OS } from '@/src/types/setting.type';
import { getBrowserUIComponents } from '@/src/shared/browser-ui.components';

export class TiktokInteractionNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TikTok Interaction Node',
		name: 'tiktokInteractionNode',
		group: ['transform'],
		version: 1,
		description: 'Spam TikTok feed by scrolling and interacting with random videos (like, comment)',
		defaults: {
			name: 'TikTok Interaction',
		},
		icon: {
			light: 'file:tiktok.svg',
			dark: 'file:tiktok.svg',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Like',
				name: 'enableLike',
				type: 'boolean',
				default: false,
				description: 'Whether to enable like interaction',
			},
			{
				displayName: 'Comment',
				name: 'enableComment',
				type: 'boolean',
				default: false,
				description: 'Whether to enable comment interaction',
			},
			{
				displayName: 'Comment Text',
				name: 'commentText',
				type: 'string',
				default: '',
				placeholder: 'Great video! 👍',
				description: 'The text to comment',
				displayOptions: {
					show: {
						enableComment: [true],
					},
				},
			},
			{
				displayName: 'Action Interval (Seconds)',
				name: 'actionInterval',
				type: 'string',
				default: '5',
				placeholder: '5 or 5,10 for random 5-10 seconds',
				description:
					'Time to wait between actions. Use single number (5) or range (5,10) for random interval.',
				required: true,
			},
			...getBrowserUIComponents(),
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const browserType = this.getNodeParameter('browserType', 0) as string;
		const websocketUrl =
			browserType === 'remote' ? (this.getNodeParameter('websocketUrl', 0) as string) : undefined;

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

		const tiktokInteractionModule = new TiktokInteractionModule(this, {
			enableLike: this.getNodeParameter('enableLike', 0) as boolean,
			enableComment: this.getNodeParameter('enableComment', 0) as boolean,
			commentText: this.getNodeParameter('commentText', 0) as string,
			actionInterval: this.getNodeParameter('actionInterval', 0) as string,
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
		});

		const result = await tiktokInteractionModule.run();

		const returnData = items.map((item) => {
			return {
				json: {
					...result,
				},
			};
		});

		return [returnData];
	}
}
