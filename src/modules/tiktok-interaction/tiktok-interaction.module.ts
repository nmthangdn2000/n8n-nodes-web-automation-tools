import { Locator, Page } from 'playwright-core';
import { launchBrowser } from '@/src/utils/browser.util';
import { IExecuteFunctions } from 'n8n-workflow';
import { SettingType } from '@/src/types/setting.type';

type TiktokInteractionModuleInputs = SettingType & {
	enableLike: boolean;
	enableComment: boolean;
	commentText?: string;
	actionInterval: string;
};

export class TiktokInteractionModule {
	private readonly settings: TiktokInteractionModuleInputs;
	private readonly executeFunctions: IExecuteFunctions;

	constructor(executeFunctions: IExecuteFunctions, settings: TiktokInteractionModuleInputs) {
		this.settings = settings;
		this.executeFunctions = executeFunctions;
	}

	private parseActionInterval(interval: string): number {
		// Parse interval string like "5" or "5,10"
		if (interval.includes(',')) {
			const [min, max] = interval.split(',').map((s) => parseInt(s.trim()));
			if (isNaN(min) || isNaN(max) || min >= max) {
				throw new Error(`Invalid interval format: ${interval}. Use format like "5" or "5,10"`);
			}
			// Return random number between min and max
			return Math.floor(Math.random() * (max - min + 1)) + min;
		} else {
			const value = parseInt(interval);
			if (isNaN(value) || value < 0) {
				throw new Error(`Invalid interval value: ${interval}. Must be a positive number`);
			}
			return value;
		}
	}

	async run() {
		const { browser, context } = await launchBrowser(this.settings);

		try {
			const page = await context.newPage();

			// Navigate to TikTok homepage
			await page.goto('https://www.tiktok.com', {
				waitUntil: 'networkidle',
			});

			// Check if we're on TikTok and logged in
			const currentUrl = page.url();
			if (!currentUrl.includes('tiktok.com')) {
				throw new Error('Failed to load TikTok');
			}

			if (currentUrl.includes('login')) {
				if (!this.settings.showBrowser) {
					throw new Error('Please set show_browser to true to login to TikTok');
				}
			}

			await page.waitForSelector('#column-list-container', { state: 'visible', timeout: 5000 });

			let errorCount = 0;

			while (errorCount <= 5) {
				this.executeFunctions.logger.info('🔄 Scrolling and interacting with TikTok feed...');
				await this.humanScrollOnArticle(page.locator('#column-list-container'), page);

				await page.waitForTimeout(this.parseActionInterval(this.settings.actionInterval));

				const visibleArticle = page
					.locator('#column-list-container article:not([style*="transition-duration: 0ms"])')
					.filter({
						has: page.locator('*'),
					})
					.first();

				try {
					await this.likeVideo(page, visibleArticle);
				} catch (error) {
					this.executeFunctions.logger.error('❌ Error liking video:', error);
					errorCount++;
					continue;
				}

				if (this.settings.enableComment && this.settings.commentText) {
					try {
						await this.commentOnVideo(page, visibleArticle, this.settings.commentText);
					} catch (error) {
						this.executeFunctions.logger.error('❌ Error commenting on video:', error);
						errorCount++;
						continue;
					}
				}

				await page.waitForTimeout(this.parseActionInterval(this.settings.actionInterval));

				errorCount = 0;
			}

			return {
				success: true,
				message: `TikTok spam completed successfully`,
			};
		} catch (error) {
			throw error;
		} finally {
			if (this.settings.isCloseBrowser && browser) {
				await browser.close();
			}
		}
	}

	private async likeVideo(page: Page, visibleArticle: Locator) {
		try {
			this.executeFunctions.logger.info('❤️ Attempting to like video...');

			const buttonLike = visibleArticle.locator('button[aria-label*="Like video"]');
			await buttonLike.waitFor({ state: 'visible', timeout: 5000 });

			// nếu button có aria-pressed là true thì không click
			const ariaPressed = await buttonLike.getAttribute('aria-pressed');
			if (ariaPressed === 'true') {
				this.executeFunctions.logger.info('✅ Video is already liked');
				return;
			}

			// await buttonLike.click();
			await this.humanClick(buttonLike, page);
			await page.waitForTimeout(1000);
			this.executeFunctions.logger.info('✅ Video liked successfully');
		} catch (error) {
			this.executeFunctions.logger.error('❌ Error liking video:', error);
			throw error;
		}
	}

	private async commentOnVideo(page: Page, visibleArticle: Locator, commentText: string) {
		try {
			this.executeFunctions.logger.info('💬 Attempting to comment on video...');

			const buttonComment = visibleArticle.locator('button[aria-label*="Read or add comments"]');
			await buttonComment.waitFor({ state: 'visible', timeout: 5000 });

			const commentBox = page.locator('[data-e2e="comment-input"] [contenteditable="true"]');

			if (!(await commentBox.isVisible())) {
				// await buttonComment.click();
				await this.humanClick(buttonComment, page);
				await page.waitForTimeout(1000);

				await commentBox.waitFor({ state: 'visible', timeout: 5000 });
			}

			await page.waitForTimeout(1000);

			await commentBox.click({ force: true });

			await page.keyboard.press('Control+A');
			await page.keyboard.press('Backspace');

			await page.keyboard.type(commentText, {
				delay: 20,
			});

			await page.waitForTimeout(1000);

			await page.locator('[data-e2e="comment-post"][aria-disabled="false"]').click();

			this.executeFunctions.logger.info('✅ Comment posted successfully');
		} catch (error) {
			this.executeFunctions.logger.error('❌ Error commenting on video:', error);
			throw error;
		}
	}

	private async humanClick(locator: Locator, page: Page) {
		// Đợi phần tử hiển thị
		await locator.waitFor({ state: 'visible', timeout: 5000 });

		const box = await locator.boundingBox();
		if (!box) throw new Error('Element not visible or not in viewport');

		// Random sai số nhỏ để không click chính giữa tuyệt đối
		const offsetX = (Math.random() - 0.5) * box.width * 0.3;
		const offsetY = (Math.random() - 0.5) * box.height * 0.3;

		const targetX = box.x + box.width / 2 + offsetX;
		const targetY = box.y + box.height / 2 + offsetY;

		// Di chuyển chuột với chuyển động mượt
		await page.mouse.move(targetX, targetY, {
			steps: 10 + Math.floor(Math.random() * 10),
		});

		// Tạm dừng trước khi click (giống người dừng chuột chút xíu)
		await page.waitForTimeout(100 + Math.random() * 150);

		// Click bằng mouse (thật)
		await page.mouse.down();
		await page.waitForTimeout(50 + Math.random() * 100);
		await page.mouse.up();

		// Sau click, thêm delay ngẫu nhiên để tự nhiên hơn
		await page.waitForTimeout(300 + Math.random() * 500);
	}

	private async humanScrollOnArticle(article: Locator, page: Page, distance = 120) {
		await article.waitFor({ state: 'visible', timeout: 5000 });

		const box = await article.boundingBox();
		if (!box) throw new Error('Article không hiển thị trong viewport');

		const targetX = box.x + box.width / 2;
		const targetY = box.y + box.height / 2;

		const liveText = article.locator('span:has-text("LIVE")').first();
		if (!(await liveText.isVisible())) {
			await page.mouse.click(targetX, targetY, { delay: 50 + Math.random() * 100 });
		}

		await page.waitForTimeout(200 + Math.random() * 150);
		await page.keyboard.press('ArrowDown');
		await page.waitForTimeout(2500 + Math.random() * 1000);
	}
}
