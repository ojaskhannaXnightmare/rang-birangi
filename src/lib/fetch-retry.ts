/**
 * RANG BIRANGI - Fetch with retry
 *
 * Wraps fetch() with automatic retry on failure.
 * Fixes Vercel "retry/close" errors caused by serverless cold starts.
 */

export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 1
): Promise<Response> {
  try {
    const res = await fetch(url, options)
    return res
  } catch (error) {
    if (retries > 0) {
      // Wait 500ms before retry
      await new Promise((r) => setTimeout(r, 500))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}
