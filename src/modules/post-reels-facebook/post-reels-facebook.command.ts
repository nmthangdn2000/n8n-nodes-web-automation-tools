import { Page } from 'playwright-core';
import { launchBrowser } from '@/src/utils/browser.util';
import { retry } from '@/src/utils/common.util';
import { SettingType } from '@/src/types/setting.type';

type PostReelsFacebookCommandInputs = SettingType & {
	video_path: string;
	description: string;
	page?: string;
};

export class PostReelsFacebookCommand {
	private readonly settings: PostReelsFacebookCommandInputs;

	constructor(settings: PostReelsFacebookCommandInputs) {
		this.settings = settings;
	}

	async run() {
		const browser = await launchBrowser(this.settings);

		try {
			const page = await browser.newPage();

			await page.goto('https://www.facebook.com/', {
				waitUntil: 'domcontentloaded',
			});

			const loginForm = await page.$('[data-testid="royal_login_form"]');
			if (loginForm) {
				if (!this.settings.showBrowser) {
					throw new Error('Please set show_browser to true to login to Facebook');
				}
			}

			if (this.settings.page) {
				await retry(
					async () => {
						await this.selectProfile(page, this.settings.page!);
					},
					3,
					async () => {
						await page.waitForTimeout(1000);
					},
				);
			}

			await this.postReels(page, this.settings);
		} catch (error) {
			throw error;
		} finally {
			if (this.settings.isCloseBrowser) {
				await browser.close();
			}
		}
	}

	private async selectProfile(page: Page, profileName: string) {
		if (await this.checkProfileSelected(page, profileName)) {
			return;
		}

		const dialog = page.locator('div[role="dialog"][aria-label="Your profile"]');
		await dialog.waitFor({ state: 'visible' });

		const seeAllButton = dialog.locator('[role="button"][aria-label="See all profiles"]');
		if ((await seeAllButton.count()) > 0) {
			await seeAllButton.click();
		}

		await page.waitForTimeout(2000);

		const list = dialog.locator('[role="list"]');

		const targetButton = list.locator(
			`div[role="button"][tabindex="0"][aria-label^="${profileName}"]`,
		);

		if ((await targetButton.count()) === 0) {
			throw new Error(`Không tìm thấy profile ${profileName}`);
		}

		await targetButton.waitFor({ state: 'visible' });
		await targetButton.click();

		try {
			const loader = page.locator('#switching-info-container');
			await loader.waitFor({ state: 'visible' });
			await loader.waitFor({ state: 'hidden' });

			if (await this.checkProfileSelected(page, profileName)) {
				return;
			}
		} catch (error: any) {
			throw error;
		}

		throw new Error(`Không tìm thấy profile ${profileName}`);
	}

	private async checkProfileSelected(page: Page, profileName: string) {
		await page.waitForTimeout(1000);

		await page.waitForSelector('div[aria-label="Your profile"][role="button"]', {
			timeout: 60000,
		});

		await page.click('div[aria-label="Your profile"][role="button"]');

		const currentProfile = page.locator('a[role="link"][href="/me/"]:not([aria-label])');
		await currentProfile.waitFor({ state: 'visible' });

		const currentProfileText = await currentProfile.textContent();

		if (currentProfileText !== profileName) {
			return false;
		}

		return true;
	}

	private async postReels(page: Page, input: PostReelsFacebookCommandInputs) {
		try {
			await page.goto('https://www.facebook.com/reels/create/');

			await page.setInputFiles('input[type="file"]', input.video_path);

			await page.waitForSelector('div[aria-label="Next"][role="button"]');
			await page.click('div[aria-label="Next"]');

			await page.waitForTimeout(1000);

			const nextButtonStep2 = page.locator('div[aria-label="Next"][role="button"]').nth(1);
			await nextButtonStep2.click();

			await page.waitForSelector('div[role="form"]');
			const editor = page.locator('div[role="form"] [contenteditable="true"]');
			await editor.click();
			await page.keyboard.type(input.description, {
				delay: 100,
			});

			await page.waitForTimeout(1000);

			const publishButton = page.locator(
				'div[aria-label="Publish"][role="button"]:not([aria-disabled="true"])',
			);
			await publishButton.waitFor({ state: 'visible' });
			await publishButton.click();

			await page.waitForTimeout(2000);

			await page.waitForSelector('[role="status"][aria-label="Loading..."]', {
				state: 'hidden',
			});

			return true;
		} catch (error) {
			throw error;
		}
	}
}
