import { Page } from 'playwright-core';
import { launchBrowser } from '@/src/utils/browser.util';
import { Audience } from './post-tiktok.enum';
import { IExecuteFunctions } from 'n8n-workflow';
import { SettingType } from '@/src/types/setting.type';
import { translate } from './language/translate';
import { TLanguage } from '@/src/types/language.type';

type PostTiktokModuleInputs = SettingType & {
	video_path: string;
	description: string;
	audience: keyof typeof Audience;
	is_ai_generated: boolean;
	run_music_copyright_check: boolean;
	run_content_check_lite: boolean;
	is_comment_on: boolean;
	is_reuse_of_content: boolean;
	auto_select_music: boolean;
};

export class PostTiktokModule {
	private readonly settings: PostTiktokModuleInputs;
	private readonly executeFunctions: IExecuteFunctions;
	private warnings: string[] = [];
	private errors: string[] = [];
	private language: TLanguage;

	constructor(executeFunctions: IExecuteFunctions, settings: PostTiktokModuleInputs) {
		this.settings = settings;
		this.executeFunctions = executeFunctions;
		this.language = 'en';
	}

	async run() {
		this.warnings = []; // Reset warnings array
		this.errors = []; // Reset errors array
		const { browser, context } = await launchBrowser(this.settings);

		try {
			const page = await context.newPage();

			await page.goto('https://www.tiktok.com/tiktokstudio/upload', {
				waitUntil: 'networkidle',
			});

			const currentUrl = page.url();
			if (currentUrl.includes('login')) {
				if (!this.settings.showBrowser) {
					throw new Error('Please set show_browser to true to login to TikTok');
				}
			}

			// <html lang="vi">
			this.language = (await page.locator('html').getAttribute('lang')) as TLanguage;

			try {
				const cancelDraftButton = page.getByRole('button', {
					name: translate('cancel', this.language),
				});
				if (await cancelDraftButton.isVisible({ timeout: 2000 })) {
					await cancelDraftButton.click();

					await page.waitForSelector(
						`.common-modal-footer .TUXButton-label:text("${translate('cancel', this.language)}")`,
						{
							timeout: 3000,
						},
					);

					await page
						.locator(
							`.common-modal-footer .TUXButton-label:text("${translate('cancel', this.language)}")`,
						)
						.click();
				}
			} catch (e) {
				this.executeFunctions.logger.error('No draft cancel popup', e);
			}

			await page.setInputFiles('input[type="file"]', this.settings.video_path);

			// check icon upload success
			await page.waitForSelector('.info-body .info-main span[data-icon="CheckCircleFill"]', {
				timeout: 600000, // 10 phút
			});

			if (this.settings.auto_select_music) {
				await this.clickEditVideoButton(page);
			}

			await this.setDescription(page, this.settings.description);

			await this.selectDropdownById(page, Audience[this.settings.audience]);

			await page.locator('.more-btn').click();

			await this.clickCheckboxByIndex(page, 0, this.settings.is_comment_on);
			await this.clickCheckboxByIndex(page, 1, this.settings.is_reuse_of_content);

			await this.setSwitchAIGenerated(page, this.settings.is_ai_generated);

			// Run both switches in parallel for better performance
			await Promise.all([
				this.setSwitchCopyright(page, this.settings.run_music_copyright_check),
				this.setSwitchContentCheckLite(page, this.settings.run_content_check_lite),
			]);

			await page.locator('.footer button[data-e2e="post_video_button"]').click();

			// Kiểm tra và xử lý modal cảnh báo nội dung nếu có
			await this.handleContentWarningModal(page);

			await page.waitForURL('https://www.tiktok.com/tiktokstudio/content');

			return {
				success: true,
				message: 'Post video successfully',
				warn: this.warnings.length > 0 ? this.warnings : undefined,
				error: this.errors.length > 0 ? this.errors : undefined,
			};
		} catch (error) {
			throw error;
		} finally {
			if (this.settings.isCloseBrowser && browser) {
				await browser.close();
			}
		}
	}

	private async setDescription(page: Page, description: string) {
		const selectAllShortcut = this.settings.os === 'macos' ? 'Meta+A' : 'Control+A';
		await page.click('.public-DraftEditor-content');
		await page.keyboard.press(selectAllShortcut);
		await page.keyboard.press('Backspace');
		await page.type('.public-DraftEditor-content', description);
	}

	private async clickCheckboxByIndex(page: Page, index: number, value: boolean) {
		const labels = page.locator('.checkbox-container label');
		const label = labels.nth(index);
		const checkbox = label.locator('input[type="checkbox"]');
		const isChecked = await checkbox.isChecked();

		const isDisabled = await checkbox.isDisabled();

		if (isDisabled) {
			return;
		}

		if (isChecked !== value) {
			await label.click();
		}
	}

	private async setSwitchAIGenerated(page: Page, checked: boolean) {
		const toggle = page.locator('[data-e2e="aigc_container"] .Switch__content');
		const current = await toggle.getAttribute('aria-checked');
		if ((checked && current === 'false') || (!checked && current === 'true')) {
			await toggle.click();
		}

		if (checked) {
			try {
				const modalFooter = page.locator('.common-modal-footer');
				await modalFooter.waitFor({ state: 'visible', timeout: 500 });

				const primaryButton = modalFooter.locator('button[data-type="primary"]');

				await primaryButton.click({
					timeout: 500,
				});
			} catch (e: unknown) {
				this.executeFunctions.logger.error('No modal footer', {
					message: (e as Error).message,
				});
			}
		}
	}

	private async selectDropdownById(page: Page, optionId: number) {
		const escapedId = `option-\\"${optionId}\\"`;

		await page.locator('.view-auth-container .Select__root button.Select__trigger').click();

		await page.locator(`[id=${escapedId}]`).click();
	}

	private async setSwitchCopyright(page: Page, checked: boolean) {
		const wrapper = page.locator('.copyright-check');
		const switchContent = wrapper.locator('.Switch__content');

		const isDisabled = await switchContent.getAttribute('data-disabled');
		if (isDisabled === 'true') {
			this.executeFunctions.logger.warn('⚠️ Switch is disabled. Cannot change state.');
			return;
		}

		const current = await switchContent.getAttribute('aria-checked');
		if ((checked && current === 'false') || (!checked && current === 'true')) {
			await switchContent.click();
		}

		if (!checked) {
			// Xử lý modal "Stop copyright checking?" nếu có
			await this.handleStopCopyrightModal(page);
			return;
		}

		await this.waitForCopyrightStatusResult(page, wrapper, 'copyright check');
	}

	private async setSwitchContentCheckLite(page: Page, checked: boolean) {
		const wrapper = page.locator('.headline-wrapper');
		const switchContent = wrapper.locator('.headline-switch .Switch__content');

		const isDisabled = await switchContent.getAttribute('data-disabled');
		if (isDisabled === 'true') {
			this.executeFunctions.logger.warn('⚠️ Switch is disabled. Cannot change state.');
			return;
		}

		const current = await switchContent.getAttribute('aria-checked');
		if ((checked && current === 'false') || (!checked && current === 'true')) {
			await switchContent.click();
		}

		if (!checked) {
			// Xử lý modal "Stop copyright checking?" nếu có
			await this.handleStopCopyrightModal(page);
			return;
		}

		await this.waitForStatusResult(page, wrapper, 'content check');
	}

	private async waitForStatusResult(page: Page, wrapper: any, checkType: string) {
		const parent = wrapper.locator('..');
		const statusWrapper = parent.locator('.status-wrapper');

		const maxWaitTime = 600000; // 10 phút
		const startTime = Date.now();

		while (Date.now() - startTime < maxWaitTime) {
			try {
				const errorStatus = statusWrapper.locator('.status-result.status-error[data-show="true"]');
				if (await errorStatus.isVisible({ timeout: 1000 })) {
					const errorMessage = await errorStatus.locator('.status-tip').textContent();
					const errorText = `${checkType} failed: ${errorMessage}`;
					this.executeFunctions.logger.error(`❌ ${errorText}`);
					this.errors.push(errorText);
					throw new Error(`❌ ${errorText}`);
				}

				const warnStatus = statusWrapper.locator('.status-result.status-warn[data-show="true"]');
				if (await warnStatus.isVisible({ timeout: 1000 })) {
					const warnMessage = await warnStatus.locator('.status-tip').textContent();
					const warningText = `${checkType} warning: ${warnMessage}`;
					this.executeFunctions.logger.warn(`⚠️ ${warningText}`);
					this.warnings.push(warningText);
					return;
				}

				const successStatus = statusWrapper.locator(
					'.status-result.status-success[data-show="true"]',
				);
				if (await successStatus.isVisible({ timeout: 1000 })) {
					const successMessage = await successStatus.locator('.status-tip').textContent();
					this.executeFunctions.logger.info(`🎉 ${checkType} success: ${successMessage}`);
					return;
				}

				const checkingStatus = statusWrapper.locator(
					'.status-result.status-checking[data-show="true"]',
				);
				if (await checkingStatus.isVisible({ timeout: 1000 })) {
					this.executeFunctions.logger.info(`⏳ ${checkType} is still checking...`);
					await page.waitForTimeout(5000);
					continue;
				}

				await page.waitForTimeout(2000);
			} catch (error) {
				if (error instanceof Error && error.message.includes('failed')) {
					throw error;
				}
				await page.waitForTimeout(2000);
			}
		}

		throw new Error(`⏰ ${checkType} timeout after 10 minutes`);
	}

	private async waitForCopyrightStatusResult(page: Page, wrapper: any, checkType: string) {
		const statusWrapper = wrapper.locator('.status-wrapper');

		const maxWaitTime = 600000; // 10 phút
		const startTime = Date.now();

		while (Date.now() - startTime < maxWaitTime) {
			try {
				const errorStatus = statusWrapper.locator('.status-result.status-error');
				if (await errorStatus.isVisible({ timeout: 1000 })) {
					const errorMessage = await errorStatus.locator('.status-tip').textContent();
					const errorText = `${checkType} failed: ${errorMessage}`;
					this.executeFunctions.logger.error(`❌ ${errorText}`);
					this.errors.push(errorText);
					throw new Error(`❌ ${errorText}`);
				}

				const warnStatus = statusWrapper.locator('.status-result.status-warn');
				if (await warnStatus.isVisible({ timeout: 1000 })) {
					const warnMessage = await warnStatus.locator('.status-tip').textContent();
					const warningText = `${checkType} warning: ${warnMessage}`;
					this.executeFunctions.logger.warn(`⚠️ ${warningText}`);
					this.warnings.push(warningText);
					return;
				}

				const successStatus = statusWrapper.locator('.status-result.status-success');
				if (await successStatus.isVisible({ timeout: 1000 })) {
					const successMessage = await successStatus.locator('.status-tip').textContent();
					this.executeFunctions.logger.info(`🎉 ${checkType} success: ${successMessage}`);
					return;
				}

				const checkingStatus = statusWrapper.locator('.status-result.status-checking');
				if (await checkingStatus.isVisible({ timeout: 1000 })) {
					this.executeFunctions.logger.info(`⏳ ${checkType} is still checking...`);
					await page.waitForTimeout(5000);
					continue;
				}

				await page.waitForTimeout(2000);
			} catch (error) {
				if (error instanceof Error && error.message.includes('failed')) {
					throw error;
				}
				await page.waitForTimeout(2000);
			}
		}

		throw new Error(`⏰ ${checkType} timeout after 10 minutes`);
	}

	private async handleContentWarningModal(page: Page) {
		try {
			const warningModal = page.locator('.TUXModal.common-modal[role="dialog"]');

			if (await warningModal.isVisible({ timeout: 5000 })) {
				this.executeFunctions.logger.info('⚠️ Content warning modal detected, closing it...');

				// Thu thập thông tin cảnh báo từ modal
				try {
					const violationReason = await warningModal.locator('.reason-title').textContent();
					if (violationReason) {
						this.warnings.push(`Content warning: ${violationReason}`);
					}
				} catch (e) {
					// Nếu không lấy được thông tin chi tiết, thêm cảnh báo chung
					this.warnings.push('Content warning: Content may be restricted');
				}

				const closeButton = warningModal.locator('.common-modal-close');
				if (await closeButton.isVisible({ timeout: 2000 })) {
					await closeButton.click();
					this.executeFunctions.logger.info('✅ Content warning modal closed successfully');

					await page.waitForTimeout(1000);

					await page.locator('.footer button[data-e2e="post_video_button"]').click();
					this.executeFunctions.logger.info('🔄 Retrying post video after closing warning modal');
				} else {
					this.executeFunctions.logger.warn('⚠️ Could not find close button in warning modal');
				}
			} else {
				this.executeFunctions.logger.info('✅ No content warning modal detected');
			}
		} catch (error) {
			this.executeFunctions.logger.error('Error handling content warning modal:', error);
		}
	}

	private async handleStopCopyrightModal(page: Page) {
		try {
			// Kiểm tra modal "Stop copyright checking?" với title chứa "Stop copyright checking"
			const stopModal = page.locator('.TUXModal.common-modal[role="dialog"]').filter({
				has: page.locator('.TUXText:has-text("Stop copyright checking")'),
			});

			if (await stopModal.isVisible({ timeout: 3000 })) {
				this.executeFunctions.logger.info(
					'⚠️ Stop copyright checking modal detected, clicking Stop button...',
				);

				// Tìm và click button "Stop" (primary button)
				const stopButton = stopModal.locator(
					'.common-modal-footer .TUXButton--primary .TUXButton-label:has-text("Stop")',
				);

				if (await stopButton.isVisible({ timeout: 2000 })) {
					await stopButton.click();
					this.executeFunctions.logger.info(
						'✅ Stop copyright checking modal handled successfully',
					);
					await page.waitForTimeout(1000);
				} else {
					this.executeFunctions.logger.warn('⚠️ Could not find Stop button in copyright modal');
				}
			}
		} catch (error) {
			this.executeFunctions.logger.error('Error handling stop copyright modal:', error);
		}
	}

	private async clickEditVideoButton(page: Page, autoSelectMusic: boolean = true) {
		try {
			this.executeFunctions.logger.info('🎬 Looking for Edit video button...');

			await page.waitForTimeout(3000);

			const editVideoButton = page.locator(
				`button:has-text("${translate('editVideo', this.language)}")`,
			);
			await editVideoButton.click();

			const modalEditVideo = page.locator('.TUXModal.common-modal[role="dialog"]');
			await modalEditVideo.waitFor({ state: 'visible', timeout: 10000 });

			if (autoSelectMusic) {
				await page.waitForSelector('.music-card-container', {
					timeout: 15000,
					state: 'visible',
				});

				// Lấy tất cả music card containers
				const musicCards = page.locator('.music-card-container');
				const musicCardsCount = await musicCards.count();

				this.executeFunctions.logger.info(`🎵 Found ${musicCardsCount} music cards`);

				if (musicCardsCount > 0) {
					// Random chọn 1 music card
					const randomIndex = Math.floor(Math.random() * musicCardsCount);
					this.executeFunctions.logger.info(
						`🎲 Randomly selected music card at index: ${randomIndex}`,
					);

					const selectedMusicCard = musicCards.nth(randomIndex);
					await selectedMusicCard.hover();

					const useButton = selectedMusicCard.locator(
						`button:has-text("${translate('use', this.language)}")`,
					);
					await useButton.waitFor({ state: 'visible', timeout: 5000 });
					await useButton.click();

					await page.waitForTimeout(2000);
				} else {
					this.executeFunctions.logger.warn('⚠️ No music cards found');
				}
			} else {
				this.executeFunctions.logger.info(
					'🎵 Auto select music is disabled, skipping music selection',
				);
			}

			const saveEditButton = page.locator('button[data-e2e="editor_save_button"]');
			await saveEditButton.waitFor({ state: 'visible', timeout: 5000 });
			await saveEditButton.click();
		} catch (error) {
			this.executeFunctions.logger.error('❌ Error clicking Edit video button:', error);
			throw error;
		}
	}
}
