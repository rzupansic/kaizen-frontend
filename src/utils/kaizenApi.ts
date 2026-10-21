export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type RequestOptions = {
  method?: string;
  data?: unknown;
};

export const kaizenApiRequest = async <T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: options.method ?? 'GET',
      credentials: 'include',
      // Fastify rejects an empty body when Content-Type is JSON (e.g. DELETE),
      // so only declare JSON when there is actually a body to send.
      headers: options.data === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: options.data === undefined ? undefined : JSON.stringify(options.data),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || response.statusText);
    }
    return data;
  } catch (error: any) {
    console.error('API Error:', error.message);
    throw error;
  }
};
