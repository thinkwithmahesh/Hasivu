type QueryParams = Record<string, string | number | boolean | null | undefined>;

interface ApiClientConfig extends RequestInit {
  params?: QueryParams;
  responseType?: 'json' | 'blob';
}

function buildUrl(path: string, params?: QueryParams): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  const url = path.startsWith('http')
    ? new URL(path)
    : new URL(`${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, 'http://localhost');

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  if (path.startsWith('http')) {
    return url.toString();
  }

  return `${url.pathname}${url.search}`;
}

async function parseResponse<T>(response: Response, responseType: ApiClientConfig['responseType']): Promise<T> {
  if (responseType === 'blob') {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return response.blob() as Promise<T>;
  }

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      body?.message || body?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

export class ApiClient {
  async get<T>(url: string, config: ApiClientConfig = {}): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T>(url: string, data?: unknown, config: ApiClientConfig = {}): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data ?? {}),
    });
  }

  async put<T>(url: string, data?: unknown, config: ApiClientConfig = {}): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data ?? {}),
    });
  }

  async delete<T>(url: string, config: ApiClientConfig = {}): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  private async request<T>(url: string, config: ApiClientConfig): Promise<T> {
    const { params, headers, responseType = 'json', body, ...init } = config;
    const requestHeaders = new Headers(headers);
    if (!(body instanceof FormData) && !requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json');
    }

    const response = await fetch(buildUrl(url, params), {
      ...init,
      body,
      credentials: 'include',
      headers: requestHeaders,
    });

    return parseResponse<T>(response, responseType);
  }
}
