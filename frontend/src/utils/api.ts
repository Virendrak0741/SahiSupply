// SahiSupply AI — Resilient API Client
// Direct host connection prevents Vite dev server proxy EPERM errors in sandbox environments.

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // If accessing through Vite dev server (port 5173), direct the browser directly to Express backend (5001)
    // CORS is enabled on the Express server, allowing seamless cross-origin communication from the host browser.
    if (window.location.port === '5173') {
      return `http://${window.location.hostname}:5001`;
    }
  }
  return '';
};

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = getApiBaseUrl();
  return `${base}${cleanEndpoint}`;
};

export async function apiFetch<T = any>(
  endpoint: string,
  options?: RequestInit,
  fallbackData?: T
): Promise<T> {
  const primaryUrl = getApiUrl(endpoint);
  
  try {
    const res = await fetch(primaryUrl, options);
    
    // Check if response is valid JSON
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      return data;
    }

    // If primaryUrl was cross-origin (port 5001) and failed, try relative path as fallback
    if (primaryUrl !== endpoint) {
      try {
        const retryRes = await fetch(endpoint, options);
        const retryType = retryRes.headers.get('content-type') || '';
        if (retryRes.ok && retryType.includes('application/json')) {
          return await retryRes.json();
        }
      } catch (e) {
        // Fall through to error handling
      }
    }

    // Try reading text error if possible
    let errorText = '';
    try {
      errorText = await res.text();
    } catch (_) {}

    throw new Error(`API ${res.status}: ${res.statusText} ${errorText.slice(0, 100)}`);
  } catch (err: any) {
    console.warn(`[SahiSupply API] Warning fetching ${endpoint}:`, err.message || err);
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw err;
  }
}
