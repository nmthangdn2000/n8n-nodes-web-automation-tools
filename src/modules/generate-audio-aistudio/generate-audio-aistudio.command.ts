import { Page } from 'playwright-core';
import { listVoice } from './list-voice';
import { launchBrowser } from '@/src/utils/browser.util';
import { sleep } from '@/src/utils/common.util';
import { SettingType } from '@/src/types/setting.type';

type GenerateAudioAistudioCommandInputs = SettingType & {
	job: {
		style_instruction: string;
		voice: string;
		prompt: string;
		outputPath: string;
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

			await sleep(1000);

			await this.selectVoice(page, this.settings.job.voice);

			await this.generateAudio(page, this.settings.job);
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

		await sleep(500);
	}

	private async generateAudio(page: Page, job: GenerateAudioAistudioCommandInputs['job']) {
		await page.fill(
			'.single-speaker-prompt-builder-wrapper > .style-instructions-textarea > textarea',
			job.style_instruction,
		);

		await page.fill('.single-speaker-prompt-builder-wrapper >  textarea', job.prompt);

		await page.waitForSelector('run-button:not([disabled])');
		await page.click('run-button');

		await sleep(1000);

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
