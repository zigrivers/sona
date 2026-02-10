import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/types/errors';

import { api } from './api';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('api.get', () => {
  it('sends GET request and returns parsed JSON', async () => {
    const data = [{ id: '1', name: 'Clone 1' }];
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await api.get('/api/clones');

    expect(mockFetch).toHaveBeenCalledWith('/api/clones', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual(data);
  });

  it('throws ApiError on failure response', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ detail: 'Clone not found', code: 'CLONE_NOT_FOUND' }, 404)
    );

    try {
      await api.get('/api/clones/abc');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(404);
      expect(apiErr.detail).toBe('Clone not found');
      expect(apiErr.code).toBe('CLONE_NOT_FOUND');
    }
  });
});

describe('api.post', () => {
  it('sends JSON body with POST request', async () => {
    const body = { name: 'New Clone' };
    const responseData = { id: '1', name: 'New Clone' };
    mockFetch.mockResolvedValueOnce(jsonResponse(responseData));

    const result = await api.post('/api/clones', body);

    expect(mockFetch).toHaveBeenCalledWith('/api/clones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(result).toEqual(responseData);
  });
});

describe('api.put', () => {
  it('sends JSON body with PUT request', async () => {
    const body = { name: 'Updated Clone' };
    const responseData = { id: '1', name: 'Updated Clone' };
    mockFetch.mockResolvedValueOnce(jsonResponse(responseData));

    const result = await api.put('/api/clones/1', body);

    expect(mockFetch).toHaveBeenCalledWith('/api/clones/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(result).toEqual(responseData);
  });
});

describe('api.upload', () => {
  it('sends FormData with POST request without Content-Type header', async () => {
    const responseData = { id: '1', filename: 'test.txt' };
    mockFetch.mockResolvedValueOnce(jsonResponse(responseData));

    const formData = new FormData();
    formData.append('file', new Blob(['hello']), 'test.txt');

    const result = await api.upload('/api/upload', formData);

    expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
      method: 'POST',
      body: formData,
    });
    expect(result).toEqual(responseData);
  });

  it('throws ApiError on failure response', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ detail: 'File too large', code: 'FILE_TOO_LARGE' }, 413)
    );

    const formData = new FormData();
    formData.append('file', new Blob(['hello']), 'test.txt');

    try {
      await api.upload('/api/upload', formData);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(413);
      expect(apiErr.detail).toBe('File too large');
      expect(apiErr.code).toBe('FILE_TOO_LARGE');
    }
  });
});

describe('api.delete', () => {
  it('sends DELETE request and returns void', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await api.delete('/api/clones/1');

    expect(mockFetch).toHaveBeenCalledWith('/api/clones/1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toBeUndefined();
  });
});
