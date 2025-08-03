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
				displayName: 'Speakers',
				name: 'speakers',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {
					speaker: [
						{
							name: 'speaker 1',
							voice: listVoice[0],
							prompt: '',
						},
					],
				},
				description: 'The speakers for audio generation',
				options: [
					{
						name: 'speaker',
						displayName: 'Speaker',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'The name of the speaker',
							},
							{
								displayName: 'Voice',
								name: 'voice',
								type: 'options',
								description: 'The voice to use for this speaker',
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
								placeholder: 'Enter the text you want this speaker to say',
								description: 'The text prompt for this speaker',
								typeOptions: {
									rows: 4,
								},
							},
						],
					},
				],
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

		const speakersData = this.getNodeParameter('speakers', 0) as {
			speaker?: Array<{
				name: string;
				voice: string;
				prompt: string;
			}>;
		};

		const speakers =
			speakersData.speaker?.map((speaker) => ({
				name: speaker.name,
				voice: speaker.voice,
				prompt: speaker.prompt,
			})) || [];

		const generateAudioCommand = new GenerateAudioAistudioCommand({
			os: this.getNodeParameter('os', 0) as OS,
			showBrowser: this.getNodeParameter('showBrowser', 0) as boolean,
			isCloseBrowser: this.getNodeParameter('isCloseBrowser', 0) as boolean,
			job: {
				style_instruction: this.getNodeParameter('styleInstruction', 0) as string,
				speakers: speakers,
			},
		});

		const audioSrcs = await generateAudioCommand.run();

		const returnData = items.map((item) => {
			const binaryData: Record<string, any> = {};

			if (audioSrcs.length > 0) {
				audioSrcs.forEach((audioSrc, index) => {
					binaryData[`audio_${index + 1}`] = {
						data: audioSrc.audioSrc,
						filename: audioSrc.name,
						mimeType: 'audio/mpeg',
					};
				});
			}

			return {
				json: {
					audioCount: audioSrcs.length,
					audioFiles: audioSrcs.map((audioSrc, index) => ({
						name: audioSrc.name,
						index: index + 1,
						binaryKey: `audio_${index + 1}`,
					})),
				},
				binary: audioSrcs.length > 0 ? binaryData : undefined,
			};
		});

		return [returnData];
	}
}
