import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { GenerateAudioAistudioCommand } from '@/src/modules/generate-audio-aistudio/generate-audio-aistudio.command';
import { OS } from '@/src/types/setting.type';
import { listVoice } from '@/src/modules/generate-audio-aistudio/list-voice';

export class GenerateAudioAistudioNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Generate Audio AI Studio',
		name: 'generateAudioAistudioNode',
		group: ['transform'],
		version: 1,
		description: 'Generate audio using Google AI Studio',
		defaults: {
			name: 'Generate Audio AI Studio',
		},
		icon: {
			light: 'file:audio.svg',
			dark: 'file:audio.svg',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Style Instruction',
				name: 'styleInstruction',
				type: 'string',
				default: '',
				placeholder: 'Speak in a calm and professional tone',
				description: 'The style instruction for the audio generation',
				typeOptions: {
					rows: 2,
				},
			},
			{
				displayName: 'Voice',
				name: 'voice',
				type: 'options',
				description: 'The voice to use for audio generation',
				options: listVoice.map((voice) => ({
					name: voice,
					value: voice,
				})),
				default: '',
				required: true,
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				placeholder: 'Enter the text you want to convert to audio',
				description: 'The text prompt to convert to audio',
				typeOptions: {
					rows: 4,
				},
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

		const generateAudioCommand = new GenerateAudioAistudioCommand({
			os: this.getNodeParameter('os', 0) as OS,
			showBrowser: this.getNodeParameter('showBrowser', 0) as boolean,
			isCloseBrowser: this.getNodeParameter('isCloseBrowser', 0) as boolean,
			job: {
				style_instruction: this.getNodeParameter('styleInstruction', 0) as string,
				voice: this.getNodeParameter('voice', 0) as string,
				prompt: this.getNodeParameter('prompt', 0) as string,
			},
		});

		const audioSrc = await generateAudioCommand.run();

		const returnData = items.map((item) => {
			return {
				json: {},
				binary: audioSrc
					? {
							data: {
								data: audioSrc,
								filename: 'audio.mp3',
								mimeType: 'audio/mpeg',
							},
						}
					: undefined,
			};
		});

		return [returnData];
	}
}
