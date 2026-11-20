import { expect } from 'vitest';

export interface ApiResult<T = unknown> {
  status: number;
  body: T;
  headers: Headers;
  text: string;
}

export interface RequestOptions {
  method?: string;
  json?: unknown;
  form?: FormData;
  headers?: Record<string, string>;
}

interface StoredCookie {
  name: string;
  value: string;
  path: string;
}

/** Klien HTTP kecil dengan cookie jar sesuai perilaku browser (path-aware). */
export class ApiClient {
  private cookies: StoredCookie[] = [];

  constructor(private readonly baseUrl: string) {}

  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
    const response = await this.send(path, options);
    const text = await response.text();
    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');

    return {
      status: response.status,
      body: (text && isJson ? JSON.parse(text) : undefined) as T,
      headers: response.headers,
      text,
    };
  }

  /** Permintaan untuk respons biner (unduh file, avatar). */
  async requestRaw(path: string, options: RequestOptions = {}) {
    const response = await this.send(path, options);

    return {
      status: response.status,
      headers: response.headers,
      bytes: Buffer.from(await response.arrayBuffer()),
    };
  }

  private async send(path: string, options: RequestOptions): Promise<Response> {
    const headers = new Headers(options.headers);
    const url = new URL(`/api${path}`, this.baseUrl);

    const cookieHeader = this.cookies
      .filter((cookie) => url.pathname.startsWith(cookie.path))
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ');

    if (cookieHeader) {
      headers.set('cookie', cookieHeader);
    }

    let body: string | FormData | undefined;

    if (options.json !== undefined) {
      headers.set('content-type', 'application/json');
      body = JSON.stringify(options.json);
    } else if (options.form) {
      body = options.form;
    }

    const response = await fetch(url, {
      method: options.method ?? (body ? 'POST' : 'GET'),
      headers,
      body,
      redirect: 'manual',
    });

    this.storeCookies(response.headers);

    return response;
  }

  hasCookie(name: string): boolean {
    return this.cookies.some((cookie) => cookie.name === name);
  }

  cookie(name: string): string | null {
    return this.cookies.find((cookie) => cookie.name === name)?.value ?? null;
  }

  setCookie(name: string, value: string, path = '/'): void {
    this.cookies = this.cookies.filter((cookie) => cookie.name !== name);
    this.cookies.push({ name, value, path });
  }

  clearCookies(): void {
    this.cookies = [];
  }

  private storeCookies(headers: Headers): void {
    for (const raw of headers.getSetCookie()) {
      const [pair, ...attributes] = raw.split(';');
      const separator = pair?.indexOf('=') ?? -1;

      if (!pair || separator < 0) {
        continue;
      }

      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      const pathAttribute = attributes.find((attribute) =>
        attribute.trim().toLowerCase().startsWith('path='),
      );
      const path = pathAttribute ? pathAttribute.split('=')[1]?.trim() || '/' : '/';

      this.cookies = this.cookies.filter((cookie) => cookie.name !== name);

      if (value && !value.startsWith('deleted')) {
        this.cookies.push({ name, value, path });
      }
    }
  }
}

export async function expectStatus<T>(
  result: ApiResult<T>,
  expected: number,
): Promise<ApiResult<T>> {
  if (result.status !== expected) {
    throw new Error(
      `Status ${result.status}, diharapkan ${expected}. Body: ${result.text.slice(0, 500)}`,
    );
  }

  expect(result.status).toBe(expected);

  return result;
}
