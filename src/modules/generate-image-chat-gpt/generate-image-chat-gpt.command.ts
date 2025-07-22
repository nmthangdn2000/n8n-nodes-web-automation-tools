import { Page } from 'playwright-core';
import { retry } from '@/src/utils/common.util';
import { launchBrowser } from '@/src/utils/browser.util';
import { IExecuteFunctions } from 'n8n-workflow';
import { SettingType } from '@/src/types/setting.type';

type GenerateImageChatGPTCommandInputs = SettingType & {
	job: {
		prompt: string;
	};
};

export class GenerateImageChatGPTCommand {
	private readonly settings: GenerateImageChatGPTCommandInputs;
	private readonly executeFunctions: IExecuteFunctions;

	constructor(executeFunctions: IExecuteFunctions, settings: GenerateImageChatGPTCommandInputs) {
		this.settings = settings;
		this.executeFunctions = executeFunctions;
	}

	async run() {
		const browser = await launchBrowser(this.settings);

		try {
			const page = await browser.newPage();
			await page.goto('https://chatgpt.com', {
				timeout: 10000,
			});

			const imageUrl = await this.generateImage(page, this.settings.job.prompt);

			const imageBuffer = await this.downloadImage(imageUrl);

			return imageBuffer;
		} catch (error) {
			throw error;
		} finally {
			if (this.settings.isCloseBrowser) {
				await browser.close();
			}
		}
	}

	private async generateImage(page: Page, prompt: string) {
		const promptSelector = '#prompt-textarea';

		await page.waitForSelector(promptSelector, {
			state: 'visible',
		});

		await page.click(promptSelector); // click vào để focus
		await page.fill(promptSelector, '');
		await page.keyboard.type(prompt);
		await page.keyboard.press('Enter');

		await retry(
			async () => {
				await this.waitOneOf(page);
			},
			3,
			async () => {
				await page.waitForTimeout(1000);
			},
		);

		return await this.getLastImageURLInLastResponse(page);
	}

	private async downloadImage(imageUrl: string) {
		const imageResponse = await this.executeFunctions.helpers.httpRequest({
			url: imageUrl,
			method: 'GET',
			encoding: 'arraybuffer',
		});

		const imageBuffer = await this.executeFunctions.helpers.prepareBinaryData(
			imageResponse,
			'image.png',
			'image/png',
		);

		return imageBuffer;
	}

	private async waitOneOf(page: Page) {
		await page.waitForTimeout(1000);

		const articles = await page.$$('article[data-testid^="conversation-turn"]');
		if (articles.length === 0) {
			throw new Error('❌ Không tìm thấy article nào.');
		}
		const lastArticle = articles[articles.length - 1];

		const selectors = [
			'[data-testid="copy-turn-action-button"]',
			'[data-testid="good-response-turn-action-button"]',
			'[data-testid="bad-response-turn-action-button"]',
		];

		return await Promise.race(
			selectors.map((selector) =>
				lastArticle.waitForSelector(selector, {
					timeout: 1000 * 60 * 5,
				}),
			),
		);
	}

	private async getLastImageURLInLastResponse(page: Page) {
		await page.waitForTimeout(1000);

		const articles = await page.$$('article[data-testid^="conversation-turn"]');
		if (articles.length === 0) {
			throw new Error('❌ Không tìm thấy article nào.');
		}
		const lastArticle = articles[articles.length - 1];
		const text = await lastArticle.textContent();

		const imageElement = await lastArticle.$('img');

		if (!imageElement) {
			throw new Error(`❌ Lỗi: ${text}`);
		}

		const imageURL = await imageElement.getAttribute('src');
		if (!imageURL) {
			throw new Error(`❌ Lỗi: ${text}`);
		}

		return imageURL;
	}
}
