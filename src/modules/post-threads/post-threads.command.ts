import { launchBrowser } from '../../utils/browser.util';
import { SettingType } from '../../types/setting.type';

type PostThreadsCommandInputs = SettingType & {
	media_files: string[];
	description: string;
	reply_threads: {
		media_files: string[];
		description: string;
	}[];
};

export class PostThreadCommand {
	constructor(private readonly settings: PostThreadsCommandInputs) {}

	async run() {
		const browser = await launchBrowser(this.settings);

		try {
			const page = await browser.newPage();

			await page.goto('https://www.threads.com/login', {
				waitUntil: 'domcontentloaded',
			});

			const pageUrl = page.url();
			if (pageUrl.includes('login')) {
				throw new Error('Please login to your account');
			}

			const buttonPost = page.locator('div[role="button"]:has-text("Post")');
			await buttonPost.click();

			const dialog = page.locator('div[role="dialog"]');
			await dialog.waitFor({ state: 'visible' });

			if (this.settings.description) {
				const inputDescription = page.locator('div[contenteditable="true"]');
				await inputDescription.click();
				await inputDescription.type(this.settings.description);
				await page.waitForTimeout(300);
			}

			if (this.settings.media_files.length > 0) {
				for (const videoPath of this.settings.media_files) {
					const fileInput = dialog.locator('input[type="file"]');
					await fileInput.setInputFiles(videoPath);
					await page.waitForTimeout(500);
				}
			}

			if (this.settings.reply_threads.length > 0) {
				for (let i = 0; i < this.settings.reply_threads.length; i++) {
					const replyThread = this.settings.reply_threads[i];
					await dialog.locator('div[role="button"]:has-text("Add to thread")').click();

					await page.waitForTimeout(300);

					const fileInput = dialog.locator('input[type="file"]').nth(i + 1);
					await fileInput.setInputFiles(replyThread.media_files);

					const inputDescription = page.locator('div[contenteditable="true"]').nth(i + 1);
					await inputDescription.click();
					await inputDescription.type(replyThread.description);
				}
			}

			await page.waitForTimeout(1000);
			await dialog.locator('div[role="button"]:has-text("Post")').click();

			const postingText = page.locator('div[role="alert"] >> text=Posting...');
			await postingText.waitFor({ state: 'visible', timeout: 10000 });
			await postingText.waitFor({ state: 'detached', timeout: 1000 * 60 * 5 });

			const failedPosting = page.locator('div >> text=Post failed to upload');
			if (await failedPosting.isVisible()) {
				throw new Error('Post failed to upload');
			}

			const profileButton = page.locator('a[role="link"]:has-text("Profile")').first();
			const hrefProfile = await profileButton.getAttribute('href');

			if (!hrefProfile) return null;
			await page.goto(`https://www.threads.com${hrefProfile}`);
			await page.waitForLoadState('domcontentloaded');

			const listPosts = page.locator(`a[href^="${hrefProfile}/post"]`);
			const urlPost = await listPosts.first().getAttribute('href');

			return `https://www.threads.com${urlPost}`;
		} catch (error) {
			throw error;
		} finally {
			if (this.settings.isCloseBrowser) {
				await browser.close();
			}
		}
	}
}
