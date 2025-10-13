import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { GenerateImageChatGPTCommand } from '@/src/modules/generate-image-chat-gpt/generate-image-chat-gpt.command';
import { OS } from '@/src/types/setting.type';
import { getBrowserUIComponents } from '@/src/shared/browser-ui.components';

export class GenerateImageChatGptNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Generate Image ChatGPT',
		name: 'generateImageChatGptNode',
		group: ['transform'],
		version: 1,
		description: 'Generate image using ChatGPT',
		defaults: {
			name: 'Generate Image ChatGPT',
		},
		icon: {
			light: 'file:image.svg',
			dark: 'file:image.svg',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				placeholder: 'Enter the image description',
				description: 'The prompt to generate the image',
				typeOptions: {
					rows: 4,
				},
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

		// Only get browserSettings when browserType is 'local'
		let browserSettingsData:
			| {
					settingType: string;
					userDataDir?: string;
					executablePath?: string;
					browserWidth?: number;
					browserHeight?: number;
					locale?: string;
					timezoneId?: string;
					userAgent?: string;
			  }
			| undefined;

		if (browserType === 'local') {
			browserSettingsData = this.getNodeParameter('browserSettings', 0) as {
				settingType: string;
				userDataDir?: string;
				executablePath?: string;
				browserWidth?: number;
				browserHeight?: number;
				locale?: string;
				timezoneId?: string;
				userAgent?: string;
			};
		}

		const settings = browserSettingsData || {
			userDataDir: undefined,
			executablePath: undefined,
			browserWidth: undefined,
			browserHeight: undefined,
			locale: undefined,
			timezoneId: undefined,
			userAgent: undefined,
		};

		const generateImageCommand = new GenerateImageChatGPTCommand(this, {
			os: browserType === 'local' ? (this.getNodeParameter('os', 0) as OS) : OS.WINDOWS,
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
			job: {
				prompt: this.getNodeParameter('prompt', 0) as string,
			},
		});

		const imageBuffer = await generateImageCommand.run();

		// Add the generated image data to the output
		const returnData = items.map((item) => {
			return {
				json: {},
				binary: imageBuffer
					? {
							data: imageBuffer,
						}
					: undefined,
			};
		});

		return [returnData];
	}
}
