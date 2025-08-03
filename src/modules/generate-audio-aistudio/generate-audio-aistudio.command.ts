import { Page } from 'playwright-core';
import { listVoice } from './list-voice';
import { launchBrowser } from '@/src/utils/browser.util';
import { SettingType } from '@/src/types/setting.type';

type GenerateAudioAistudioCommandInputs = SettingType & {
	job: {
		style_instruction: string;
		speakers: {
			voice: string;
			prompt: string;
		}[];
	};
};

export class GenerateAudioAistudioCommand {
	private readonly settings: GenerateAudioAistudioCommandInputs;
	constructor(settings: GenerateAudioAistudioCommandInputs) {
		this.settings = settings;
	}

	async run() {
		const browser = await launchBrowser(this.settings);

		try {
			const page = await browser.newPage();
			await page.goto('https://aistudio.google.com/generate-speech');

			await page.waitForSelector('button.toggle-button:has-text("Single-speaker audio")');
			await page.click('button.toggle-button:has-text("Single-speaker audio")');

			await page.waitForTimeout(1000);

			const audioSrcs: {
				name: string;
				voice: string;
				audioSrc: string;
			}[] = [];

			for (const speaker of this.settings.job.speakers) {
				await this.selectVoice(page, speaker.voice);
				const audioSrc = await this.generateAudio(
					page,
					speaker.prompt,
					this.settings.job.style_instruction,
				);

				if (audioSrc) {
					audioSrcs.push({
						name: speaker.voice,
						voice: speaker.voice,
						audioSrc,
					});
				}
			}

			return audioSrcs;
		} catch (error) {
			// console.log(`❌ Lỗi: ${error}`);
			throw error;
		} finally {
			if (this.settings.isCloseBrowser) {
				await browser.close();
			}
		}
	}

	private async selectVoice(page: Page, voice: string) {
		await page.waitForSelector('ms-voice-selector .mat-mdc-text-field-wrapper');
		await page.click('ms-voice-selector .mat-mdc-text-field-wrapper');

		const voiceIndex = listVoice.indexOf(voice);

		await page.click(
			`.cdk-overlay-container #mat-select-4-panel mat-option:nth-child(${voiceIndex + 1})`,
		);

		await page.waitForTimeout(500);
	}

	private async generateAudio(
		page: Page,
		prompt: string,
		style_instruction: string,
	): Promise<string | null> {
		await page.fill(
			'.single-speaker-prompt-builder-wrapper > .style-instructions-textarea > textarea',
			style_instruction,
		);

		await page.fill('.single-speaker-prompt-builder-wrapper >  textarea', prompt);

		await page.waitForSelector('run-button:not([disabled])');
		await page.click('run-button');

		await page.waitForTimeout(1000);

		await page.waitForSelector('run-button:not(:has-text("Stop"))', {
			timeout: 1000 * 60 * 2,
		});

		const audioElement = await page.$('audio');
		let audioSrc = await audioElement?.evaluate((el) => el.src);

		if (audioSrc) {
			if (audioSrc.startsWith('data:')) {
				audioSrc = audioSrc.split(',')[1];
			}
			audioSrc = audioSrc.replace(/\s/g, '');

			return audioSrc;
			// const audioBuffer = Buffer.from(audioSrc, 'base64');
			// writeFileSync(job.outputPath, audioBuffer);
		}

		return null;
	}
}
