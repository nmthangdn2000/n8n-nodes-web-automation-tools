import { launchBrowser } from '../../utils/browser.util';
import { SettingType } from '../../types/setting.type';

type LoadDouyinUserCommandInputs = SettingType & {
	userId: string;
	maxVideoCount?: number;
};

export class LoadDouyinUserCommand {
	private readonly settings: LoadDouyinUserCommandInputs;

	constructor(settings: LoadDouyinUserCommandInputs) {
		this.settings = settings;
	}

	private async handleCaptchaIframe(page: any): Promise<string> {
		try {
			// Check if captcha iframe exists
			const captchaIframe = await page.$('iframe[src*="rmc.bytedance.com/verifycenter/captcha"]');

			if (captchaIframe) {
				// Wait for the captcha iframe to disappear (user completed verification)
				// Maximum wait time: 60 seconds (1 minute)
				const maxWaitTime = 60000;
				const checkInterval = 1000; // Check every 1 second
				let elapsedTime = 0;

				while (elapsedTime < maxWaitTime) {
					const iframeStillExists = await page.$(
						'iframe[src*="rmc.bytedance.com/verifycenter/captcha"]',
					);

					if (!iframeStillExists) {
						// Wait a bit more for the page to fully load after captcha
						await page.waitForTimeout(2000);
						return 'Captcha verification completed successfully';
					}

					await page.waitForTimeout(checkInterval);
					elapsedTime += checkInterval;
				}

				// If we reach here, captcha is still present after timeout
				return 'Captcha verification timeout - proceeding anyway';
			} else {
				return 'No captcha iframe detected - proceeding normally';
			}
		} catch (error: any) {
			return `Error checking for captcha iframe: ${error.message}`;
		}
	}

	private async waitForUserDetailElement(page: any): Promise<string> {
		try {
			// Wait for user detail element to appear with 30 second timeout
			await page.waitForSelector('[data-e2e="user-detail"]', { timeout: 30000 });
			return 'User detail element found - page fully loaded';
		} catch (error: any) {
			// If element not found within timeout, continue anyway
			return `User detail element not found within timeout - proceeding anyway: ${error.message}`;
		}
	}

	async run(): Promise<any> {
		const { browser, context } = await launchBrowser(this.settings);

		try {
			const page = await context.newPage();

			// Construct the Douyin user URL
			const douyinUrl = `https://www.douyin.com/user/${this.settings.userId}`;

			// Navigate to the Douyin user page
			await page.goto(douyinUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

			// Wait for page to load and any dynamic content
			await page.waitForTimeout(5000);

			// Check for captcha iframe and wait for user verification
			const captchaStatus = await this.handleCaptchaIframe(page);

			// Wait for user detail element to appear (indicates page is fully loaded)
			const userDetailStatus = await this.waitForUserDetailElement(page);

			// Execute JavaScript logic to get video URLs
			const maxVideoCount = this.settings.maxVideoCount || 10;
			const scraperScript = `
				(async function(userId, maxVideos) {
					const getid = async function(sec_user_id, max_cursor) {
						const url = \`https://www.douyin.com/aweme/v1/web/aweme/post/?device_platform=webapp&aid=6383&channel=channel_pc_web&sec_user_id=\${sec_user_id}&max_cursor=\${max_cursor}&count=20&version_code=170400&version_name=17.4.0\`;
						try {
							const res = await fetch(url, {
								"headers": {
									"accept": "application/json, text/plain, */*",
									"accept-language": "vi",
									"sec-ch-ua": "\\"Not?A_Brand\\";v=\\"8\\", \\"Chromium\\";v=\\"118\\", \\"Microsoft Edge\\";v=\\"118\\"",
									"sec-ch-ua-mobile": "?0",
									"sec-ch-ua-platform": "\\"Windows\\"",
									"sec-fetch-dest": "empty",
									"sec-fetch-mode": "cors",
									"sec-fetch-site": "same-origin",
									"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.0.0"
								},
								"referrer": \`https://www.douyin.com/user/\${sec_user_id}\`,
								"referrerPolicy": "strict-origin-when-cross-origin",
								"body": null,
								"method": "GET",
								"mode": "cors",
								"credentials": "include"
							});
							if (!res.ok) {
								console.log(\`HTTP Error: \${res.status}\`);
								await new Promise(resolve => setTimeout(resolve, 2000));
								return await getid(sec_user_id, max_cursor);
							}
							return await res.json();
						} catch (e) {
							console.log("Data loading error:", e);
							await new Promise(resolve => setTimeout(resolve, 2000));
							return await getid(sec_user_id, max_cursor);
						}
					};

					const scrapeDouyinVideos = async function(userId, maxVideos) {
						try {
							const result = [];
							let hasMore = 1;
							const sec_user_id = userId;
							// Sử dụng maxVideos từ parameter, nếu không có thì dùng 10
							const videoLimit = maxVideos || 10;

							if (!sec_user_id) {
								throw new Error("Invalid user ID");
							}

							console.log(\`Loading videos from user: \${sec_user_id}\`);
							let max_cursor = 0;
							let errorCount = 0;

							while (hasMore == 1 && errorCount < 5 && (videoLimit === 0 || result.length < videoLimit)) {
								try {
									console.log(\`Loading more data, max_cursor = \${max_cursor}\`);
									const moredata = await getid(sec_user_id, max_cursor);

									if (!moredata || !moredata.aweme_list) {
										console.log("No video data found, retrying...");
										errorCount++;
										await new Promise(resolve => setTimeout(resolve, 3000));
										continue;
									}

									errorCount = 0;
									hasMore = moredata.has_more;
									max_cursor = moredata.max_cursor;

									for (const video of moredata.aweme_list) {
										// Dừng nếu đã đủ số video yêu cầu (trừ khi videoLimit = 0)
										if (videoLimit > 0 && result.length >= videoLimit) {
											break;
										}

										let videoUrl = "";
										if (video.video && video.video.play_addr) {
											videoUrl = video.video.play_addr.url_list[0];
										} else if (video.video && video.video.download_addr) {
											videoUrl = video.video.download_addr.url_list[0];
										}

										if (videoUrl) {
											if (!videoUrl.startsWith("https")) {
												videoUrl = videoUrl.replace("http", "https");
											}
											result.push({
												url: videoUrl,
												aweme_id: video.aweme_id,
												desc: video.desc,
												create_time: video.create_time,
												statistics: video.statistics
											});
										}
									}

									// Add delay between requests to avoid being blocked
									await new Promise(resolve => setTimeout(resolve, 1000));
								} catch (e) {
									console.error("Error during loading:", e);
									errorCount++;
									await new Promise(resolve => setTimeout(resolve, 3000));
								}
							}

							return {
								success: true,
								totalVideos: result.length,
								videos: result,
								userId: sec_user_id
							};
						} catch (e) {
							console.error("Critical error:", e);
							return {
								success: false,
								error: e.message,
								userId: userId
							};
						}
					};

					return await scrapeDouyinVideos(userId, maxVideos);
				})
			`;

			// Execute the scraper script and handle any errors
			let videoUrls;
			try {
				videoUrls = await page.evaluate(
					({
						script,
						userId,
						maxVideoCount,
					}: {
						script: string;
						userId: string;
						maxVideoCount: number;
					}) => {
						const func = eval(script);
						return func(userId, maxVideoCount);
					},
					{ script: scraperScript, userId: this.settings.userId, maxVideoCount },
				);
			} catch (scriptError: any) {
				videoUrls = {
					success: false,
					error: `Script execution failed: ${scriptError.message}`,
					userId: this.settings.userId,
				};
			}

			// Get page title and URL for verification
			const pageTitle = await page.title();
			const currentUrl = page.url();

			return {
				success: true,
				pageTitle,
				currentUrl,
				userId: this.settings.userId,
				message: 'Successfully loaded Douyin user page',
				captchaStatus,
				userDetailStatus,
				videoData: videoUrls,
			};
		} catch (error) {
			throw error;
		} finally {
			if (this.settings.isCloseBrowser && browser) {
				await browser.close();
			}
		}
	}
}
