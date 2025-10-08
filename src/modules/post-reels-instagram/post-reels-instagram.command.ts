import { SettingType } from '@/src/types/setting.type';
import { launchBrowser } from '@/src/utils/browser.util';
import { Locator, Page } from 'playwright-core';

type PostReelsInstagramCommandInputs = SettingType & {
	video_path: string;
	description: string;
	is_share_to_reels_facebook: boolean;
	is_hide_like_and_view_counts: boolean;
	is_turn_off_commenting: boolean;
};

export class PostReelsInstagramCommand {
	private readonly settings: PostReelsInstagramCommandInputs;

	constructor(settings: PostReelsInstagramCommandInputs) {
		this.settings = settings;
	}

	async run() {
		const { browser, context } = await launchBrowser(this.settings);

		try {
			const page = await context.newPage();

			await page.goto('https://www.instagram.com/', {
				waitUntil: 'domcontentloaded',
			});

			const loginForm = await page.$('form[id="loginForm"]');
			if (loginForm) {
				if (!this.settings.showBrowser) {
					throw new Error('Please set showBrowser to true to login to Instagram');
				}
			}

			const createButton = page.getByRole('link', { name: /create/i });
			await createButton.click();

			const parent = createButton.locator('xpath=..');

			const postButton = parent.locator('div a').first();
			await postButton.click();

			let dialog = page.locator('div[role="dialog"]');
			await dialog.waitFor({ state: 'visible' });

			const fileInput = dialog.locator('input[type="file"]');
			await fileInput.setInputFiles(this.settings.video_path);

			await page
				.locator('role=dialog >> button:has-text("OK")')
				.click({
					timeout: 1000,
				})
				.catch(() => {});
			await page.waitForTimeout(1000);

			dialog = page.locator('div[role="dialog"]');
			await dialog.locator('div[role="button"]:has-text("Next")').click();
			await page.waitForTimeout(1000);

			dialog = page.locator('div[role="dialog"]');
			await dialog.waitFor({ state: 'visible' });

			await dialog.locator('div[role="button"]:has-text("Next")').click();
			await page.waitForTimeout(1000);

			const descriptionInput = dialog.locator('div[contenteditable="true"]');
			await descriptionInput.click();
			await descriptionInput.type(this.settings.description);

			await page.waitForTimeout(1000);

			dialog = page.locator('div[role="dialog"]');

			await this.shareToReelsFacebook(page, dialog, this.settings.is_share_to_reels_facebook);

			await this.advancedSettings(
				page,
				dialog,
				this.settings.is_hide_like_and_view_counts,
				this.settings.is_turn_off_commenting,
			);

			const publishButton = dialog.locator('div[role="button"]:has-text("Share")').first();
			await publishButton.click();

			const sharingDialog = page.getByRole('dialog', { name: 'Sharing' });
			await sharingDialog.waitFor({ state: 'visible' });

			await sharingDialog.waitFor({
				state: 'detached',
				timeout: 1000 * 60 * 5, // 5 minutes
			});

			await page.reload();
			await page.waitForTimeout(1000);

			const profileButton = page.locator('a[role="link"]:has-text("Profile")').first();
			const hrefProfile = await profileButton.getAttribute('href');
			if (!hrefProfile) {
				throw new Error('Upload reels to Instagram failed');
			}

			await page.goto(`https://www.instagram.com${hrefProfile}`);
			await page.waitForLoadState('domcontentloaded');

			const listPosts = page.locator('main[role="main"] div[style*="display: flex"] a');
			const urlPost = await listPosts.first().getAttribute('href');
			return `https://www.instagram.com${urlPost}`;
		} catch (error) {
			throw error;
		} finally {
			if (this.settings.isCloseBrowser && browser) {
				await browser.close();
			}
		}
	}

	private async shareToReelsFacebook(
		page: Page,
		dialog: Locator,
		is_share_to_reels_facebook: boolean,
	) {
		const buttonDropdownShareTo = dialog.locator('div[role="button"]:has-text("Share to")');
		const parentDropdownShareTo = buttonDropdownShareTo.locator('xpath=..');
		const containerDropdownShareTo = parentDropdownShareTo.locator('div.html-div');
		if ((await containerDropdownShareTo.count()) === 0) {
			await buttonDropdownShareTo.click();
		}

		const inputShareToReels = containerDropdownShareTo.locator('input[type="checkbox"]');

		const isChecked = await inputShareToReels.isChecked();

		if (isChecked !== is_share_to_reels_facebook) {
			await inputShareToReels.click();
			await page.waitForTimeout(1000);
			if (is_share_to_reels_facebook) {
				await page
					.locator('button:has-text("Share this reel")')
					.click({
						timeout: 1000,
					})
					.catch(() => {});
			} else {
				await page.waitForTimeout(1000);
				await page
					.locator(`button:has-text("Don't share this reel")`)
					.click({
						timeout: 1000,
					})
					.catch(() => {});
			}
		}
	}

	private async advancedSettings(
		page: Page,
		dialog: Locator,
		is_hide_like_and_view_counts: boolean,
		is_turn_off_commenting: boolean,
	) {
		const buttonAdvancedSettings = dialog.locator(
			'div[role="button"]:has-text("Advanced settings")',
		);
		const parentAdvancedSettings = buttonAdvancedSettings.locator('xpath=..');
		const containerAdvancedSettings = parentAdvancedSettings.locator('div.html-div');
		if ((await containerAdvancedSettings.count()) === 0) {
			await buttonAdvancedSettings.click();
		}

		const inputCheckboxes = containerAdvancedSettings.locator('input[type="checkbox"]');

		const isCheckedHideLikeAndViewCounts = await inputCheckboxes.nth(0).isChecked();
		const isCheckedTurnOffCommenting = await inputCheckboxes.nth(1).isChecked();

		if (isCheckedHideLikeAndViewCounts !== is_hide_like_and_view_counts) {
			await inputCheckboxes.nth(0).click();
		}

		if (isCheckedTurnOffCommenting !== is_turn_off_commenting) {
			await inputCheckboxes.nth(1).click();
		}
	}
}
