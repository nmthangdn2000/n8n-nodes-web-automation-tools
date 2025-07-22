import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { GenerateImageChatGPTCommand } from '@/src/modules/generate-image-chat-gpt/generate-image-chat-gpt.command';
import { OS } from '@/src/types/setting.type';

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

		const generateImageCommand = new GenerateImageChatGPTCommand(this, {
			os: this.getNodeParameter('os', 0) as OS,
			showBrowser: this.getNodeParameter('showBrowser', 0) as boolean,
			isCloseBrowser: this.getNodeParameter('isCloseBrowser', 0) as boolean,
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
