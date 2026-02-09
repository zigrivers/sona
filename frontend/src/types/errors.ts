export class ApiError extends Error {
  code: string;
  detail: string;
  status: number;

  constructor(status: number, detail: string, code: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.code = code;
  }
}
