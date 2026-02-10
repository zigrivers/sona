import { ApiError } from '@/types/errors';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (!response.ok) {
    let detail = 'Request failed';
    let code = 'UNKNOWN_ERROR';

    try {
      const body = await response.json();
      detail = body.detail ?? detail;
      code = body.code ?? code;
    } catch {
      // response body is not JSON — keep defaults
    }

    throw new ApiError(response.status, detail, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function requestFormData<T>(url: string, body: FormData): Promise<T> {
  const response = await fetch(url, { method: 'POST', body });

  if (!response.ok) {
    let detail = 'Request failed';
    let code = 'UNKNOWN_ERROR';

    try {
      const errorBody = await response.json();
      detail = errorBody.detail ?? detail;
      code = errorBody.code ?? code;
    } catch {
      // response body is not JSON — keep defaults
    }

    throw new ApiError(response.status, detail, code);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get<T>(url: string): Promise<T> {
    return request<T>(url, { method: 'GET' });
  },

  post<T>(url: string, body?: unknown): Promise<T> {
    return request<T>(url, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(url: string, body?: unknown): Promise<T> {
    return request<T>(url, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete(url: string): Promise<void> {
    return request<void>(url, { method: 'DELETE' });
  },

  upload<T>(url: string, body: FormData): Promise<T> {
    return requestFormData<T>(url, body);
  },
};
