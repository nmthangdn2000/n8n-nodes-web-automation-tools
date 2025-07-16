export const retry = async <T>(
	fn: () => Promise<T>,
	maxRetries = 3,
	fnDelay: () => Promise<void>,
) => {
	let retries = 0;
	while (retries < maxRetries) {
		try {
			return await fn();
		} catch (error) {
			retries++;
			await fnDelay();
		}
	}
	throw new Error('Retry failed');
};
