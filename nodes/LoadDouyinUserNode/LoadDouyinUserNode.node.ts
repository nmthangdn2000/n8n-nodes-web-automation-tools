import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { LoadDouyinUserCommand } from '../../src/modules/load-douyin-user/load-douyin-user.command';
import { OS } from '@/src/types/setting.type';
import { getBrowserUIComponents } from '@/src/shared/browser-ui.components';

export class LoadDouyinUserNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Load Douyin User',
		name: 'loadDouyinUserNode',
		group: ['transform'],
		version: 1,
		description: 'Load Douyin user profile page',
		defaults: {
			name: 'Load Douyin User',
		},
		icon: {
			light: 'file:douyin.svg',
			dark: 'file:douyin.svg',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '',
				placeholder: 'MS4wLjABAAAA3PP9a3_6etLPCsan0Nx6hqZGLl512dQCeUE4v_GZJsdrYIvOVZcd0pIsQIkvDP9O',
				description: 'The Douyin user ID to load',
				required: true,
			},
			{
				displayName: 'Max Video Count',
				name: 'maxVideoCount',
				type: 'number',
				default: 10,
				description:
					'Maximum number of videos to scrape from the user profile. Default is 10 videos. Set to 0 for no limit (not recommended as it may take a long time)',
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

		const settings = {
			os: this.getNodeParameter('os', 0) as OS,
			showBrowser: this.getNodeParameter('showBrowser', 0) as boolean,
			isCloseBrowser: this.getNodeParameter('isCloseBrowser', 0) as boolean,
			userDataDir: browserSettingsData?.userDataDir,
			executablePath: browserSettingsData?.executablePath,
			browserWidth: browserSettingsData?.browserWidth,
			browserHeight: browserSettingsData?.browserHeight,
			locale: browserSettingsData?.locale,
			timezoneId: browserSettingsData?.timezoneId,
			userAgent: browserSettingsData?.userAgent,
			websocketUrl: websocketUrl,
			userId: this.getNodeParameter('userId', 0) as string,
			maxVideoCount: this.getNodeParameter('maxVideoCount', 0) as number,
		};

		const loadDouyinUserCommand = new LoadDouyinUserCommand(settings);

		const result = await loadDouyinUserCommand.run();

		// Add the input parameters to the output
		const returnData = items.map((item) => {
			return {
				json: {
					userId: this.getNodeParameter('userId', 0) as string,
					url: `https://www.douyin.com/user/${this.getNodeParameter('userId', 0) as string}`,
					success: result.success,
					pageTitle: result.pageTitle,
					currentUrl: result.currentUrl,
					message: result.message,
					videoData: result.videoData,
				},
			};
		});

		return [returnData];
	}
}
