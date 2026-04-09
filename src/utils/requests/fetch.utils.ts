import { ENDPOINTS } from "../endpoints.utils.js";

export async function safeFetch<T>(
	endpoint: keyof typeof ENDPOINTS,
	options?: RequestInit,
): Promise<T> {
	try {
		const response = await fetch(ENDPOINTS[endpoint], options);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch data from ${endpoint}: ${response.statusText}`,
			);
		}

		const data: T = await response.json();
		return data;
	} catch (error) {
		console.error(`Error fetching data from ${endpoint}:`, error);
		throw error;
	}
}
