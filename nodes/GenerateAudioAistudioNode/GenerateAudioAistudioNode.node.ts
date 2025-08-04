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

		const generateAudioCommand = new GenerateAudioAistudioCommand({
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
