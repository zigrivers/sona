import { http, HttpResponse } from 'msw';

export const dataHandlers = [
  http.get('/api/data/stats', () =>
    HttpResponse.json({
      db_location: '/data/sona.db',
      db_size_bytes: 524288,
      clone_count: 3,
      content_count: 12,
      sample_count: 7,
    })
  ),

  http.get(
    '/api/data/backup',
    () =>
      new HttpResponse(new Blob(['fake-db-content']), {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="sona-backup.db"',
        },
      })
  ),

  http.post('/api/data/restore', () =>
    HttpResponse.json({
      success: true,
      message: 'Database restored successfully',
      stats: {
        db_location: '/data/sona.db',
        db_size_bytes: 524288,
        clone_count: 3,
        content_count: 12,
        sample_count: 7,
      },
    })
  ),
];
